import { ImageUrlService } from '../../services/imageUrlService';
import type { ArtworkEntity } from '../../typings';

/**
 * Ensure a value is an array
 */
function ensureArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Enhance artwork data with long-lived image URLs
 */
export async function enhanceArtworkWithImageUrls(artwork: ArtworkEntity): Promise<ArtworkEntity> {
  if (!artwork.assets || artwork.assets.length === 0) {
    return artwork;
  }
  
  // Process all asset URLs
  const enhancedAssets = await Promise.all(
    artwork.assets.map(async (asset) => {
      if (!asset.url) return asset;
      
      // Extract bucket and path from the URL
      const urlParts = extractStorageInfo(asset.url);
      if (!urlParts) return asset;
      
      // Get a new signed URL with longer expiry
      const enhancedUrl = await ImageUrlService.getImageUrl({
        bucket: urlParts.bucket,
        path: urlParts.path,
        transform: {
          quality: 85, // Default quality for CDN optimization
        },
      });
      
      return {
        ...asset,
        url: enhancedUrl || asset.url, // Fallback to original if enhancement fails
      };
    })
  );
  
  return {
    ...artwork,
    assets: enhancedAssets,
    // Ensure bibliography and collectors are arrays
    bibliography: ensureArray(artwork.bibliography),
    collectors: ensureArray(artwork.collectors),
  };
}

/**
 * Enhance multiple artworks with image URLs
 */
export async function enhanceArtworksWithImageUrls(
  artworks: ArtworkEntity[]
): Promise<ArtworkEntity[]> {
  // Collect all image configs for batch processing
  const imageConfigs: Array<{ artworkId: string; assetIndex: number; bucket: string; path: string }> = [];
  
  artworks.forEach((artwork) => {
    if (artwork.assets) {
      artwork.assets.forEach((asset, index) => {
        if (asset.url) {
          const urlParts = extractStorageInfo(asset.url);
          if (urlParts && artwork.id) {
            imageConfigs.push({
              artworkId: artwork.id,
              assetIndex: index,
              bucket: urlParts.bucket,
              path: urlParts.path,
            });
          }
        }
      });
    }
  });
  
  // Batch fetch all URLs
  const urls = await ImageUrlService.getImageUrls(
    imageConfigs.map(({ bucket, path }) => ({
      bucket,
      path,
      transform: { quality: 85 },
    }))
  );
  
  // Create a map for quick lookup
  const urlMap = new Map<string, string>();
  imageConfigs.forEach((config, index) => {
    const url = urls[index];
    if (url) {
      urlMap.set(`${config.artworkId}-${config.assetIndex}`, url);
    }
  });
  
  // Apply enhanced URLs to artworks
  return artworks.map((artwork) => {
    if (!artwork.id) return artwork;
    
    const enhancedAssets = artwork.assets 
      ? artwork.assets.map((asset, index) => {
          const enhancedUrl = urlMap.get(`${artwork.id}-${index}`);
          return enhancedUrl ? { ...asset, url: enhancedUrl } : asset;
        })
      : [];
    
    return {
      ...artwork,
      assets: enhancedAssets,
      // Ensure bibliography and collectors are arrays
      bibliography: ensureArray(artwork.bibliography),
      collectors: ensureArray(artwork.collectors),
    };
  });
}

/**
 * Extract bucket and path from Supabase storage URL
 */
function extractStorageInfo(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+)/);
    
    if (pathMatch) {
      return {
        bucket: pathMatch[1],
        path: decodeURIComponent(pathMatch[2].split('?')[0]),
      };
    }
    
    return null;
  } catch {
    return null;
  }
}