import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../../assets/logo/patunay-256x256.png';
import { useImageUrl } from '../../../hooks/useImageUrl';

interface ArtworkImageCellProps {
  artworkId: string;
  title?: string;
  assets?: Array<{ url: string; id?: string; name?: string }>;
}

export const ArtworkImageCell = ({ artworkId, title, assets = [] }: ArtworkImageCellProps) => {
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>(
    {}
  );

  // Get the first two images for display
  const firstImage = assets[0];
  const secondImage = assets[1];
  const remainingCount = assets.length > 2 ? assets.length - 2 : 0;

  // Extract storage info from first image URL for enhanced loading
  const storageInfo = firstImage?.url ? extractStorageInfo(firstImage.url) : null;
  const { url: enhancedUrl } = useImageUrl({
    bucket: storageInfo?.bucket,
    path: storageInfo?.path,
    enabled: !!storageInfo && imageStates[firstImage?.url || ''] === 'error',
    transform: { width: 100, height: 100, quality: 85 },
  });

  // Use enhanced URL if available, otherwise fall back to original
  const displayUrl = enhancedUrl || firstImage?.url;

  const handleImageLoad = (url: string) => {
    setImageStates((prev) => ({ ...prev, [url]: 'loaded' }));
  };

  const handleImageError = (url: string) => {
    setImageStates((prev) => ({ ...prev, [url]: 'error' }));
  };

  const hasValidFirstImage = displayUrl && displayUrl.trim() !== '';
  const hasValidSecondImage = secondImage?.url && secondImage.url.trim() !== '';

  return (
    <Link to={`/dashboard/artworks/${artworkId}`} className="block">
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* First image */}
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
            {hasValidFirstImage ? (
              <img
                src={displayUrl}
                alt={title || 'Artwork'}
                className="h-full w-full object-cover"
                onLoad={() => handleImageLoad(displayUrl!)}
                onError={() => handleImageError(displayUrl!)}
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <img src={logo} alt="Default artwork" className="h-8 w-8 opacity-60" />
              </div>
            )}
          </div>

          {/* Second image (overlapped) */}
          {hasValidSecondImage && (
            <div className="absolute -top-1 -right-1 h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
              <img
                src={secondImage.url}
                alt={title || 'Artwork'}
                className="h-full w-full object-cover"
                onLoad={() => handleImageLoad(secondImage.url)}
                onError={() => handleImageError(secondImage.url)}
                loading="lazy"
              />
            </div>
          )}

          {/* Remaining count indicator */}
          {remainingCount > 0 && (
            <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white shadow-sm">
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

/**
 * Extract bucket and path from Supabase storage URL
 */
function extractStorageInfo(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+)/
    );

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
