import { Button, Modal } from "@components";
import { ArtworkEntity, AssetEntity } from "@typings";

import { handleAddArtwork } from "../../hooks/handleAddArtwork";
import { useState } from "react";

interface Props {
  artwork: ArtworkEntity;
  onAddArtwork: (result: ArtworkEntity) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

interface Detail {
  label: string;
  value?: AssetEntity[] | string | number | null;
}

const ReviewArtwork = ({ artwork, onAddArtwork, onPrev, onNext }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    artist,
    assets,
    bibliography,
    collectors,
    description,
    height,
    idNumber,
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
    { label: "ID Number", value: idNumber },
    { label: "Tag ID", value: tag_id },
    { label: "Provenance", value: provenance },

    { label: "Read/Write Count", value: artwork.readWriteCount },
    {
      label: "Bibliography",
      value: bibliography ? bibliography.join(", ") : "",
    },
    { label: "Collectors", value: collectors ? collectors.join(", ") : "" },
  ];

  // useEffect(() => {
  //   jsConfetti.addConfetti();

  //   return () => {
  //     jsConfetti;
  //   };
  // }, [jsConfetti]);

  const handleSubmitArtwork = async () => {
    try {
      const res = await handleAddArtwork({ data: artwork });
      console.log("res", res);

      onAddArtwork(res);

      openModal();
    } catch (error) {
      console.error("Error in submitting artwork:", error);
    }
  };

  const openModal = async () => {
    setIsModalOpen(true);
  };

  const closeModal = async () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex-2 h-fill flex flex-col justify-between gap-2">
        <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2 p-4">
          <h2 className="text-xl font-semibold">
            Review the details before submitting
          </h2>
          <div className="flex flex-col gap-2">
            {details.map(({ label, value }) => {
              if (!value) return null;

              if (Array.isArray(value))
                return (
                  <img className="mx-auto" src={value[0].url} width={200} />
                );

              return (
                <div key={label} className="flex gap-2">
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
            buttonLabel="Submit"
            onClick={handleSubmitArtwork}
          />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex flex-col gap-4">
          <h1 className="font-bold">Successfully submitted to artwork!</h1>
          <p className="text-sm">
            Do you want to attach the artwork to an NFC tag?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              buttonLabel="Attach Later"
              buttonType="secondary"
              className="btn-sm"
              onClick={onNext}
            />
            <Button
              buttonLabel="Attach to NFC Tag"
              className="btn-sm"
              onClick={onNext}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReviewArtwork;
