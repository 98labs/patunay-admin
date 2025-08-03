import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@components';

interface ImageGalleryProps {
  images: string[];
  title: string;
  onImageClick?: () => void;
  onManageClick?: () => void;
}

export const ImageGallery = ({ images, title, onImageClick, onManageClick }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});

  useEffect(() => {
    // Reset to first image when images change
    setCurrentIndex(0);
  }, [images]);

  const handleImageLoad = (index: number) => {
    setImageStates(prev => ({ ...prev, [index]: 'loaded' }));
  };

  const handleImageError = (index: number) => {
    setImageStates(prev => ({ ...prev, [index]: 'error' }));
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-base-200 border border-dashed border-base-300 rounded-2xl text-base-content/90 text-center p-8 flex flex-col gap-4">
        <p className="text-sm font-semibold">No images uploaded yet</p>
        <span className="text-sm">Click below to add images</span>
        <Button
          buttonLabel="Upload images"
          className="rounded-lg"
          onClick={onManageClick}
        />
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const currentImageState = imageStates[currentIndex] || 'loading';

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative group">
        <div 
          className="relative overflow-hidden rounded-lg bg-base-200 cursor-pointer"
          onClick={onImageClick}
        >
          {/* Loading State */}
          {currentImageState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {/* Error State */}
          {currentImageState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-error">Failed to load image</p>
                <button 
                  className="btn btn-sm btn-ghost mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageStates(prev => ({ ...prev, [currentIndex]: 'loading' }));
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Main Image */}
          <img
            src={currentImage}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-[500px] object-contain"
            onLoad={() => handleImageLoad(currentIndex)}
            onError={() => handleImageError(currentIndex)}
            style={{ display: currentImageState === 'loaded' ? 'block' : 'none' }}
          />

          {/* Navigation Arrows (only show if more than 1 image) */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-base-100/80 rounded-full 
                         hover:bg-base-100 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-base-100/80 rounded-full 
                         hover:bg-base-100 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-base-100/80 rounded text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip (only show if more than 1 image) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-primary ring-2 ring-primary/50' 
                  : 'border-base-300 hover:border-base-content/20'
              }`}
            >
              <img
                src={image}
                alt={`${title} - Thumbnail ${index + 1}`}
                className="w-20 h-20 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dots Indicator (alternative to thumbnails for many images) */}
      {images.length > 5 && images.length <= 10 && (
        <div className="flex justify-center gap-1 mt-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary w-6' 
                  : 'bg-base-300 hover:bg-base-content/30'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};