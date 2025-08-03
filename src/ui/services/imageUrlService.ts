import supabase from '../supabase';

interface ImageUrlConfig {
  bucket: string;
  path: string;
  expiresIn?: number; // in seconds
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

interface CachedUrl {
  url: string;
  expiresAt: number;
}

// Cache for signed URLs to avoid unnecessary API calls
const urlCache = new Map<string, CachedUrl>();

// CDN configuration
const CDN_CONFIG = {
  // Default expiration time (7 days in seconds)
  DEFAULT_EXPIRY: 7 * 24 * 60 * 60,
  // Minimum time before expiry to trigger refresh (1 hour in milliseconds)
  REFRESH_THRESHOLD: 60 * 60 * 1000,
  // Cache key TTL (slightly less than actual expiry)
  CACHE_TTL_BUFFER: 5 * 60 * 1000, // 5 minutes
};

export class ImageUrlService {
  /**
   * Get a signed URL for an image with automatic token refresh
   */
  static async getImageUrl(config: ImageUrlConfig): Promise<string | null> {
    const { bucket, path, expiresIn = CDN_CONFIG.DEFAULT_EXPIRY, transform } = config;
    
    if (!path) return null;
    
    // Generate cache key
    const cacheKey = this.getCacheKey(bucket, path, transform);
    
    // Check cache first
    const cached = urlCache.get(cacheKey);
    if (cached && this.isUrlValid(cached)) {
      return cached.url;
    }
    
    try {
      // For public buckets, use public URL with CDN
      if (await this.isBucketPublic(bucket)) {
        return this.getPublicUrl(bucket, path, transform);
      }
      
      // For private buckets, create signed URL with longer expiry
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) {
        console.error('Failed to create signed URL:', error);
        return null;
      }
      
      // Apply transformations if needed
      const finalUrl = transform ? this.applyTransformations(data.signedUrl, transform) : data.signedUrl;
      
      // Cache the URL
      const expiresAt = Date.now() + (expiresIn * 1000) - CDN_CONFIG.CACHE_TTL_BUFFER;
      urlCache.set(cacheKey, { url: finalUrl, expiresAt });
      
      return finalUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  }
  
  /**
   * Get multiple signed URLs efficiently
   */
  static async getImageUrls(configs: ImageUrlConfig[]): Promise<(string | null)[]> {
    // Separate cached and uncached configs
    const results: (string | null)[] = new Array(configs.length);
    const uncachedConfigs: { config: ImageUrlConfig; index: number }[] = [];
    
    configs.forEach((config, index) => {
      const cacheKey = this.getCacheKey(config.bucket, config.path, config.transform);
      const cached = urlCache.get(cacheKey);
      
      if (cached && this.isUrlValid(cached)) {
        results[index] = cached.url;
      } else {
        uncachedConfigs.push({ config, index });
      }
    });
    
    // Batch fetch uncached URLs
    if (uncachedConfigs.length > 0) {
      const batchResults = await Promise.all(
        uncachedConfigs.map(({ config }) => this.getImageUrl(config))
      );
      
      uncachedConfigs.forEach(({ index }, i) => {
        results[index] = batchResults[i];
      });
    }
    
    return results;
  }
  
  /**
   * Preload images with signed URLs
   */
  static async preloadImages(configs: ImageUrlConfig[]): Promise<void> {
    const urls = await this.getImageUrls(configs);
    
    // Preload valid URLs
    urls.forEach((url) => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }
  
  /**
   * Clear expired URLs from cache
   */
  static clearExpiredUrls(): void {
    const now = Date.now();
    
    for (const [key, cached] of urlCache.entries()) {
      if (!this.isUrlValid(cached)) {
        urlCache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cached URLs
   */
  static clearCache(): void {
    urlCache.clear();
  }
  
  /**
   * Check if a bucket is public
   */
  private static async isBucketPublic(bucket: string): Promise<boolean> {
    // Check if bucket is configured as public
    // For now, we'll check the bucket name, but this could be
    // extended to check actual bucket policies
    return bucket === 'artifacts' || bucket.includes('public');
  }
  
  /**
   * Get public URL with CDN
   */
  private static getPublicUrl(bucket: string, path: string, transform?: any): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    
    // Apply transformations if needed
    return transform ? this.applyTransformations(data.publicUrl, transform) : data.publicUrl;
  }
  
  /**
   * Apply image transformations to URL
   */
  private static applyTransformations(url: string, transform: any): string {
    const params = new URLSearchParams();
    
    if (transform.width) params.append('width', transform.width.toString());
    if (transform.height) params.append('height', transform.height.toString());
    if (transform.quality) params.append('quality', transform.quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  /**
   * Generate cache key
   */
  private static getCacheKey(bucket: string, path: string, transform?: any): string {
    const transformKey = transform ? JSON.stringify(transform) : '';
    return `${bucket}:${path}:${transformKey}`;
  }
  
  /**
   * Check if cached URL is still valid
   */
  private static isUrlValid(cached: CachedUrl): boolean {
    const timeUntilExpiry = cached.expiresAt - Date.now();
    return timeUntilExpiry > CDN_CONFIG.REFRESH_THRESHOLD;
  }
}

// Set up periodic cache cleanup
setInterval(() => {
  ImageUrlService.clearExpiredUrls();
}, 5 * 60 * 1000); // Every 5 minutes

// Export singleton instance methods for convenience
export const getImageUrl = ImageUrlService.getImageUrl.bind(ImageUrlService);
export const getImageUrls = ImageUrlService.getImageUrls.bind(ImageUrlService);
export const preloadImages = ImageUrlService.preloadImages.bind(ImageUrlService);
export const clearImageCache = ImageUrlService.clearCache.bind(ImageUrlService);