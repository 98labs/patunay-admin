import { useCallback, useEffect, useState, useRef } from "react";

import { ImageUp, X, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@components";

import supabase from "../../../../supabase/index";
import { ArtworkEntity, AssetEntity } from "@typings";
import { useNotification } from "../../../../hooks/useNotification";

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
          .from("artifacts")
          .upload(filePath, file);

        if (uploadError) {
          showError(`Failed to upload ${file.name}: ${uploadError.message}`, "Upload Error");
          continue;
        }

        const { data } = supabase.storage
          .from("artifacts")
          .getPublicUrl(filePath);

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
      if (index === activeIndex && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      } else if (index < activeIndex) {
        setActiveIndex(activeIndex - 1);
      } else if (updatedAssets.length > 0 && activeIndex >= updatedAssets.length) {
        setActiveIndex(updatedAssets.length - 1);
      }
      
      onDataChange({ assets: JSON.stringify(updatedAssets) });
    },
    [assets, activeIndex, onDataChange]
  );

  useEffect(() => {
    if (artwork) {
      if (artwork.assets) {
        setAssets(
          typeof artwork.assets === "string"
            ? JSON.parse(artwork.assets)
            : artwork.assets
        );
      } else {
        setAssets([]);
      }
    }
  }, [artwork]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
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
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
      <div
        className={`outline border border-base-300 rounded-2xl flex flex-col overflow-hidden ${assets?.length <= 0 && "items-center gap-2 p-24"}`}
      >
        {assets?.length <= 0 ? (
          <>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div>
                <ImageUp className="h-40 w-40 text-base-content mx-auto" />
              </div>
              {uploading ? (
                <p className="text-center">Uploading...</p>
              ) : (
                <>
                  <div>
                    {isDragActive ? (
                      <p className="font-medium text-center">
                        Drop it like it's hot!
                      </p>
                    ) : (
                      <p className="font-medium text-center">
                        Drag and drop an artwork here, or
                      </p>
                    )}
                  </div>
                  <div className="text-center mt-4">
                    <Button
                      buttonLabel="Upload an artwork"
                      onClick={async () => {}}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            {/* Main image viewer */}
            <div className="relative flex-1 flex items-center justify-center p-4">
              <img
                src={assets[activeIndex]?.url}
                className="max-h-full max-w-full object-contain rounded-lg"
                alt={assets[activeIndex]?.fileName}
              />
              <button
                onClick={() => handleDeleteImage(activeIndex)}
                className="absolute top-6 right-6 p-2 bg-error text-error-content rounded-full hover:bg-error/80 transition-colors"
                type="button"
                title="Delete this image"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Thumbnail row */}
            <div className="border-t border-base-300 p-4">
              <div className="flex gap-2 overflow-x-auto">
                {assets.map((asset, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 cursor-pointer transition-all ${
                      index === activeIndex ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                ))}
                
                {/* Add more images button */}
                <div
                  {...getRootProps()}
                  className="flex-shrink-0 h-20 w-20 flex flex-col items-center justify-center border-2 border-dashed border-base-300 rounded cursor-pointer hover:border-primary transition-colors"
                >
                  <input {...getInputProps()} />
                  <Plus className="h-6 w-6 text-base-content/50" />
                  {uploading && <span className="text-xs">...</span>}
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
          buttonLabel={assets?.length > 0 ? "Continue" : "Add image later"}
          disabled={uploading}
          onClick={handleOnNext}
        />
      </div>
    </div>
  );
};

export default UploadImage;
