import { Button } from "@components";
import { ArtworkEntity, AssetEntity } from "@typings";
import { useNavigate } from "react-router-dom";
import { handleAddArtwork } from "../../hooks/handleAddArtwork";
import { useState } from "react";
import ImageSlider from "../ImageSlider";
import { useAuth } from "../../../../hooks/useAuth";

interface Props {
  artwork: ArtworkEntity;
  onAddArtwork: (result: ArtworkEntity) => void;
  onPrev: () => Promise<void>;
}

interface Detail {
  label: string;
  value?: AssetEntity[] | string | number | null;
}

const ReviewArtwork = ({
  artwork,
  onAddArtwork,
  onPrev,
}: Props) => {
  const {
    artist,
    assets,
    bibliography,
    collectors,
    description,
    height,
    id_number,
    medium,
    provenance,
    sizeUnit,
    tag_id,
    title,
    width,
    year,
  } = artwork;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentOrganization } = useAuth();

  const details: Detail[] = [
    {
      label: "Assets",
      value:
        typeof assets === "string" ? (JSON.parse(assets) as AssetEntity[]) : "",
    },
    { label: "Title", value: title },
    { label: "Artist", value: artist },
    { label: "Description", value: description },
    { label: "Medium", value: medium },
    {
      label: "Size",
      value: `${height}${sizeUnit} × ${width}${sizeUnit}`,
    },
    { label: "Year", value: year },
    { label: "ID Number", value: id_number },
    { label: "Tag ID", value: tag_id },
    { label: "Provenance", value: provenance },

    { label: "Read/Write Count", value: artwork.readWriteCount },
    {
      label: "Bibliography",
      value: bibliography ? bibliography.join(", ") : "",
    },
    { label: "Collectors", value: collectors ? collectors.join(", ") : "" },
  ];

  const handleSubmitArtwork = async () => {
    if (isSubmitting) return;

    if (!currentOrganization?.id) {
      console.error("No organization selected");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await handleAddArtwork({ 
        data: artwork,
        organizationId: currentOrganization.id 
      });

      onAddArtwork({ ...res, assets: assets });

      // Redirect to artworks page after successful submission
      navigate("/dashboard/artworks");
    } catch (error) {
      console.error("Error in submitting artwork:", error);
      setIsSubmitting(false);
    }
  };

  const handleOnPrev = async () => {
    if (isSubmitting) return;

    onPrev();
  };

  return (
    <>
      <div className="flex-2 h-fill flex flex-col justify-between gap-2">
        <div className="border border-base-300 rounded-2xl flex flex-col gap-2">
          <h2 className="text-xl font-semibold px-4 pt-4">
            Review the details before submitting
          </h2>
          <div className="flex flex-col gap-2  pb-4">
            {details.map(({ label, value }) => {
              if (!value) return null;

              if (Array.isArray(value))
                return (
                  <ImageSlider
                    key={label}
                    assets={value}
                    showOtherImages={false}
                  />
                );

              return (
                <div key={label} className="flex gap-2 px-4">
                  {label !== "Assets" && (
                    <span className="font-semibold">{label}:</span>
                  )}
                  <span>{value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            buttonType="secondary"
            buttonLabel="Back"
            disabled={isSubmitting}
            onClick={onPrev}
          />
          <Button
            className="flex-1"
            buttonType="primary"
            buttonLabel="Submit"
            disabled={isSubmitting}
            onClick={handleSubmitArtwork}
          />
        </div>
      </div>
    </>
  );
};

export default ReviewArtwork;
