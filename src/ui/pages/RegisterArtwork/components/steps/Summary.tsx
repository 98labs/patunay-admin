import { useEffect } from "react";

import { Button } from "@components";
import { ArtworkEntity, AssetEntity } from "@typings";
import { jsConfetti } from "../../../../lib/confetti/confetti";
import ImageSlider from "../ImageSlider";

interface Props {
  artwork: ArtworkEntity;
  onPrev: () => Promise<void>;
}

interface Detail {
  label: string;
  value?: AssetEntity[] | string | number | null;
}

const Summary = ({ artwork, onPrev }: Props) => {
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

  useEffect(() => {
    jsConfetti.addConfetti();

    return () => {
      jsConfetti;
    };
  }, [jsConfetti]);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2">
        <h2 className="text-xl font-semibold px-4 pt-4">
          Successfully added an artwork!
        </h2>
        <div className="flex flex-col gap-2 pb-4">
          {details.map(({ label, value }) => {
            if (!value) return null;

            if (Array.isArray(value))
              return (
                <ImageSlider
                  assets={value}
                  showImageIndicator={true}
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
          onClick={onPrev}
        />
        <Button
          className="flex-1"
          buttonType="primary"
          buttonLabel="Done"
          onClick={async () => {
            window.location.href = "/dashboard/artworks/";
          }}
        />
      </div>
    </div>
  );
};

export default Summary;
