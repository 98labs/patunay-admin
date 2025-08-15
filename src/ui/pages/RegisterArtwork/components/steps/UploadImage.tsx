import { useCallback, useEffect, useState, useRef } from 'react';

import { ImageUp, X, Plus, ChevronLast, ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@components';

import supabase from '../../../../supabase/index';
import { ArtworkEntity, AssetEntity } from '@typings';
import { useNotification } from '../../../../hooks/useNotification';

interface Props {
  artwork: ArtworkEntity;
  onDataChange: (data: { [key: string]: string | string[] }) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

const UploadImage = ({ artwork, onDataChange, onPrev, onNext }: Props) => {
  const [assets, setAssets] = useState<AssetEntity[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError } = useNotification();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);

      const uploadedAssets: AssetEntity[] = [];

      for (const file of acceptedFiles) {
        // Sanitize filename: remove accents and special characters
        const sanitizedName = file.name
          .normalize('NFD') // Normalize unicode
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
          .replace(/_{2,}/g, '_') // Replace multiple underscores with single
          .toLowerCase();

        const fileName = `${Date.now()}-${sanitizedName}`;
        const filePath = `artworks/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('artifacts')
          .upload(filePath, file);

        if (uploadError) {
          showError(`Failed to upload ${file.name}: ${uploadError.message}`, 'Upload Error');
          continue;
        }

        const { data } = supabase.storage.from('artifacts').getPublicUrl(filePath);

        uploadedAssets.push({
          fileName: file.name, // Keep original name for display
          url: data.publicUrl,
        });
      }

      const updatedAssets = [...assets, ...uploadedAssets];
      setAssets(updatedAssets);

      onDataChange({ assets: JSON.stringify(updatedAssets) });

      setUploading(false);
    },
    [assets, onDataChange, showError]
  );

  const handleDeleteImage = useCallback(
    (index: number) => {
      const updatedAssets = assets.filter((_, i) => i !== index);
      setAssets(updatedAssets);

      // Adjust activeIndex if needed
      if (updatedAssets.length === 0) {
        // No images left, reset to 0
        setActiveIndex(0);
      } else {
        setActiveIndex(activeIndex - 1);
      }
      // If index > activeIndex, no change needed to activeIndex

      onDataChange({ assets: JSON.stringify(updatedAssets) });
    },
    [assets, activeIndex, onDataChange]
  );

  useEffect(() => {
    if (artwork) {
      if (artwork.assets) {
        setAssets(typeof artwork.assets === 'string' ? JSON.parse(artwork.assets) : artwork.assets);
      } else {
        setAssets([]);
      }
    }
  }, [artwork]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const handleOnPrev = async () => {
    if (uploading) return;
    onPrev();
  };

  const handleOnNext = async () => {
    if (uploading) return;
    onNext();
  };

  return (
    <div className="h-fill flex flex-2 flex-col justify-between gap-2">
      <div
        className={`border-base-300 flex flex-col overflow-hidden rounded-2xl border ${assets?.length <= 0 && 'items-center gap-2 p-24'}`}
      >
        {assets?.length <= 0 ? (
          <>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div>
                <ImageUp className="text-base-content mx-auto h-40 w-40" />
              </div>
              {uploading ? (
                <p className="text-center">Uploading...</p>
              ) : (
                <>
                  <div>
                    {isDragActive ? (
                      <p className="text-center font-medium">Drop it like it's hot!</p>
                    ) : (
                      <p className="text-center font-medium">Drag and drop an artwork here, or</p>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <Button buttonLabel="Upload an artwork" onClick={async () => {}} />
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col select-none">
            {/* Main image viewer */}
            <div className="relative flex justify-center">
              <div className="absolute flex h-full w-full justify-between">
                <div
                  onClick={() =>
                    setActiveIndex(activeIndex <= 0 ? assets.length - 1 : activeIndex - 1)
                  }
                  className="flex cursor-pointer items-center px-1 transition duration-100 ease-out hover:bg-[var(--color-neutral-black-01)]/10"
                >
                  <Button className="pointer-events-none h-8 w-8 rounded-full border-none bg-[var(--color-neutral-white)] shadow-none">
                    <ChevronLeft className="text-[var(--color-neutral-black-02)]" />
                  </Button>
                </div>
                <div
                  onClick={() => setActiveIndex((activeIndex + 1) % assets.length)}
                  className="flex cursor-pointer items-center px-1 transition duration-100 ease-out hover:bg-[var(--color-neutral-black-02)]/10"
                >
                  <Button className="pointer-events-none h-8 w-8 rounded-full border-none bg-[var(--color-neutral-white)] shadow-none">
                    <ChevronRight className="text-[var(--color-neutral-black-02)]" />
                  </Button>
                </div>
              </div>
              <img
                src={assets[activeIndex]?.url}
                className="h-96 max-w-full object-contain"
                alt={assets[activeIndex]?.fileName}
              />
            </div>
            {/* Thumbnail row */}
            <div className="border-base-300 p-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {assets.map((asset, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 cursor-pointer overflow-clip rounded-lg transition-all duration-200 ease-in-out ${
                      index === activeIndex ? 'border-2 border-[var(--color-primary-400)]' : ''
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="h-20 w-20 rounded object-cover"
                    />
                    <div className="absolute top-0 right-0">
                      <Button
                        onClick={() => handleDeleteImage(index)}
                        className="m-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-none bg-[var(--color-tertiary-red-400)]/90 p-0 transition-none hover:bg-[var(--color-tertiary-red-200)]/90"
                      >
                        <Minus size={16} />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add more images button */}
                <div
                  {...getRootProps()}
                  className="text-base-content/50 hover:text-base-content border-base-300 hover:border-primary flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed transition-colors"
                >
                  <input {...getInputProps()} />
                  <Plus className="text-base-content/50 h-6 w-6" />
                  {uploading && <span className="text-xs">...</span>}
                </div>

                {/* Reupload images button */}
                <div
                  {...getRootProps()}
                  className="text-base-content/50 hover:text-base-content border-base-300 hover:border-primary flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed transition-colors"
                  onClick={() => {
                    // Clear existing images before reuploading
                    setAssets([]);
                    setActiveIndex(0);
                  }}
                >
                  <input {...getInputProps()} />
                  <ImageUp className="h-6 w-6" />
                  <span className="text-center text-[8px]">
                    {assets.length > 1 ? 'Replace Images' : 'Replace Image'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          buttonType="secondary"
          buttonLabel="Back"
          disabled={uploading}
          onClick={handleOnPrev}
        />
        <Button
          className="flex-1"
          buttonType="primary"
          buttonLabel={assets?.length > 0 ? 'Continue' : 'Add image later'}
          disabled={uploading}
          onClick={handleOnNext}
        />
      </div>
    </div>
  );
};

export default UploadImage;
