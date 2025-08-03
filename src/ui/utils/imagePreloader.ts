/**
 * Preload images to ensure they're in browser cache
 */
export class ImagePreloader {
  private static cache = new Map<string, boolean>();
  
  /**
   * Preload a single image
   */
  static async preloadImage(url: string): Promise<void> {
    if (!url || this.cache.has(url)) {
      return;
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, true);
        resolve();
      };
      
      img.onerror = () => {
        this.cache.set(url, false);
        resolve();
      };
      
      img.src = url;
    });
  }
  
  /**
   * Preload multiple images
   */
  static async preloadImages(urls: (string | undefined)[]): Promise<void> {
    const validUrls = urls.filter((url): url is string => !!url);
    await Promise.all(validUrls.map(url => this.preloadImage(url)));
  }
  
  /**
   * Check if an image is already cached
   */
  static isImageCached(url: string): boolean {
    if (this.cache.has(url)) {
      return this.cache.get(url) || false;
    }
    
    // Check browser cache
    const img = new Image();
    img.src = url;
    const isCached = img.complete && img.naturalWidth > 0;
    
    if (isCached) {
      this.cache.set(url, true);
    }
    
    return isCached;
  }
  
  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}