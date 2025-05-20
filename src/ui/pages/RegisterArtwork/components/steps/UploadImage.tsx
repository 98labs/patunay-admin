import { useCallback, useEffect, useState } from "react";

import { ImageUp } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@components";

import supabase from "../../../../supabase/index";
import { ArtworkEntity, AssetEntity } from "@typings";

interface Props {
  artwork: ArtworkEntity;
  onDataChange: (data: { [key: string]: string | string[] }) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

const UploadImage = ({ artwork, onDataChange, onPrev, onNext }: Props) => {
  const [assets, setAssets] = useState<AssetEntity[]>([]);

  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);

      const uploadedAssets: AssetEntity[] = [];

      for (const file of acceptedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `private/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("artifacts")
          .upload(filePath, file);

        if (uploadError) {
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data, error: urlError } = await supabase.storage
          .from("artifacts")
          .createSignedUrl(filePath, 60 * 60);

        if (urlError) {
          alert(`Failed to create URL for ${file.name}: ${urlError.message}`);
          continue;
        }

        uploadedAssets.push({
          fileName: file.name,
          url: data?.signedUrl ?? "",
        });
      }

      setAssets(uploadedAssets);
      console.log("uploadedAssets", uploadedAssets);
      console.log("stringified uploadedAssets", JSON.stringify(uploadedAssets));

      onDataChange({ assets: JSON.stringify(uploadedAssets) });

      setUploading(false);
    },
    [onDataChange]
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
        {...getRootProps()}
        className={`outline outline-neutral-gray-01 rounded-2xl flex flex-col items-center gap-2 overflow-hidden ${assets?.length <= 0 && "p-24"}`}
      >
        <input {...getInputProps()} />
        {assets?.length <= 0 && (
          <div>
            <ImageUp className="h-40 w-40 text-neutral-black-01" />
          </div>
        )}
        {assets?.length <= 0 ? (
          uploading ? (
            <p>Uploading...</p>
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
              <div>
                <Button
                  buttonLabel="Upload an artwork"
                  onClick={async () => {}}
                />
              </div>
            </>
          )
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {assets.map((asset, index) => (
              <img
                key={index}
                src={asset.url}
                alt={`Uploaded ${index}`}
                className="rounded-lg w-full h-auto"
              />
            ))}
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
