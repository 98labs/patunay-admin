import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../../assets/logo/patunay-256x256.png';
import { useImageUrl } from '../../../hooks/useImageUrl';

interface ArtworkImageCellProps {
  artworkId: string;
  title?: string;
  imageUrl?: string;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export const ArtworkImageCell = ({ artworkId, title, imageUrl }: ArtworkImageCellProps) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Extract storage info from URL for enhanced loading
  const storageInfo = imageUrl ? extractStorageInfo(imageUrl) : null;
  const { url: enhancedUrl } = useImageUrl({
    bucket: storageInfo?.bucket,
    path: storageInfo?.path,
    enabled: !!storageInfo && imageState === 'error' && retryCount > 0,
    transform: { width: 100, height: 100, quality: 85 },
  });
  
  // Use enhanced URL if available, otherwise fall back to original
  const displayUrl = enhancedUrl || imageUrl;
  
  // Check if image is already cached/loaded
  useEffect(() => {
    if (!displayUrl) {
      setImageState('error');
      return;
    }
    
    // Create a new image to check cache
    const img = new Image();
    img.src = displayUrl;
    
    if (img.complete && img.naturalWidth > 0) {
      // Image is already cached
      setImageState('loaded');
    } else {
      // Image needs to load
      setImageState('loading');
    }
    
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setRetryCount(0);
  }, [displayUrl]);
  
  const handleImageLoad = () => {
    setImageState('loaded');
    setRetryCount(0);
  };
  
  const handleImageError = () => {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      // Schedule a retry
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageState('error'); // Trigger re-render with enhanced URL
      }, RETRY_DELAY * (retryCount + 1));
    } else {
      // Max retries reached
      if (import.meta.env.DEV) {
        console.warn(`ArtworkImageCell: Failed to load image after ${MAX_RETRY_ATTEMPTS} attempts for ${artworkId} - ${title}`);
      }
      setImageState('error');
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  const hasValidUrl = displayUrl && displayUrl.trim() !== '';
  const showPlaceholder = !hasValidUrl || (imageState === 'error' && retryCount >= MAX_RETRY_ATTEMPTS);
  
  return (
    <Link 
      to={`/dashboard/artworks/${artworkId}`} 
      className="block"
    >
      <div className="avatar">
        <div className="w-12 h-12 rounded border border-base-300 overflow-hidden bg-base-200 relative">
          {hasValidUrl && !showPlaceholder ? (
            <>
              {/* Always show image once we have a URL */}
              <img 
                ref={imgRef}
                key={`${displayUrl}-${retryCount}`} // Force remount on retry
                src={displayUrl}
                alt={title || "Artwork"} 
                className={`object-cover w-full h-full ${imageState === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="eager" // Prioritize loading
              />
              {/* Loading spinner overlay */}
              {imageState === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-200">
                  <div className="loading loading-spinner loading-sm"></div>
                </div>
              )}
            </>
          ) : (
            // Placeholder when no image or error
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={logo} 
                alt="Default artwork" 
                className="w-8 h-8 opacity-60"
              />
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