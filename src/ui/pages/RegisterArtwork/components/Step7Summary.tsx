import { Button } from "@components";
import { ArtworkEntity } from "@typings";
import { Link } from "react-router-dom";

interface Props {
  artwork: ArtworkEntity;
  onPrev: () => void;
  onNext: () => void;
}

interface Detail {
  label: string;
  value?: string | number | null;
}

const Step7 = ({ artwork, onNext }: Props) => {
  const {
    artist,
    assets,
    collectors,
    description,
    height,
    idNumber,
    medium,
    provenance,
    sizeUnit,
    tagId,
    title,
    width,
    year,
  } = artwork;

  const details: Detail[] = [
    { label: "Title", value: title },
    { label: "Artist", value: artist },
    { label: "Description", value: description },
    { label: "Medium", value: medium },
    {
      label: "Size",
      value: `${height}${sizeUnit} × ${width}${sizeUnit}`,
    },
    { label: "Year", value: year },
    { label: "ID Number", value: idNumber },
    { label: "Tag ID", value: tagId },
    { label: "Provenance", value: provenance },

    { label: "Read/Write Count", value: artwork.readWriteCount },
    { label: "Collectors", value: collectors ? collectors.join(", ") : "" },
    { label: "Assets", value: assets ? assets.length.toString() : "" },
  ];

  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2 p-4">
        <h2 className="text-xl font-semibold">
          Successfully registered an artwork!
        </h2>
        <div className="flex flex-col gap-2">
          {details.map(
            ({ label, value }) =>
              value && (
                <div key={label} className="flex gap-2">
                  <span className="font-semibold">{label}:</span>
                  <span>{value}</span>
                </div>
              )
          )}
        </div>
      </div>
      <Link to="/dashboard/artworks" className="w-full">
        <Button
          buttonType="primary"
          buttonLabel="Proceed to Artworks"
          onClick={onNext}
        />
      </Link>
    </div>
  );
};

export default Step7;
