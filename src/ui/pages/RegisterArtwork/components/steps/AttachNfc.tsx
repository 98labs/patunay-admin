import { Button } from "@components";
import { ArtworkEntity, NfcModeEntity } from "@typings";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";

import { addArtwork } from "../../../../supabase/rpc/addArtwork";

interface Props {
  data: ArtworkEntity;
  addAddArtworkResult: (result: ArtworkEntity) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

interface WriteResult {
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}

const AttachNfc = ({ data, addAddArtworkResult, onPrev, onNext }: Props) => {
  const [writeResult, setWriteResult] = useState<WriteResult | null>(null);
  const [isScanning, setisScanning] = useState<boolean>(false);

  const handleStartScanning = async () => {
    setisScanning(true);
  };

  const handleAddArtwork = async (options: {
    attachLater: boolean;
    tagId?: string;
  }) => {
    const artwork: ArtworkEntity = {
      idNumber: data.idNumber,
      title: data.title,
      description: data.description,
      height: data.height,
      width: data.width,
      sizeUnit: data.sizeUnit,
      artist: data.artist,
      year: new Date().getFullYear().toString(),
      medium: data.medium,
      tag_id: options.tagId ?? null,
      expirationDate: new Date("2025-12-31"),
      readWriteCount: 0,
      provenance: data.provenance,
      bibliography: data.bibliography,
      collectors: data.collectors,
      assets: null,
    };

    const result = (await addArtwork(artwork))[0];

    const parsedRes: ArtworkEntity = {
      ...result,
      id: result.id,
      idNumber: result.idnumber,
      sizeUnit: result.size_unit,
      tag_id: result.tag_id,
      bibliography: result.bibliography ? JSON.parse(result.collectors) : [],
      collectors: result.collectors ? JSON.parse(result.collectors) : [],
      assets: result.assets
        ? result.assets.map((asset: any) => ({
            fileName: asset.filename ?? "",
            url: asset.url,
            sortOrder: asset.sort_order,
          }))
        : null,
    };

    window.electron.writeOnTag(
      options.attachLater ? "No data" : (parsedRes.id ?? "No Data")
    );

    addAddArtworkResult(parsedRes);

    onNext();
  };

  useEffect(() => {
    window.electron.subscribeNfcWriteResult((result) => {
      if (result.success) {
        setWriteResult(result);

        window.electron.setMode(NfcModeEntity.Read);
      } else {
        alert("Write failed: " + result.message);
      }

      setisScanning(false);
    });
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    window.electron.subscribeNfcCardDetection(
      (card: { uid: string; data: any }) => {
        handleAddArtwork({ attachLater: false, tagId: card.uid });
      }
    );
  }, [isScanning, handleAddArtwork]);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col items-center gap-2 p-24">
        <div className="flex flex-col justify-center align-middle gap-2">
          <Nfc className="w-40 h-50 m-auto text-neutral-black-02" />
          <p className="font-semibold">
            {writeResult && writeResult.success
              ? "Success!"
              : isScanning
                ? "Please tap the NFC tag to the NFC reader to write"
                : "Please connect the NFC reader device to your computer"}
          </p>
          <Button
            onClick={handleStartScanning}
            buttonLabel={isScanning ? "Scanning..." : "Start scanning"}
            className={`transition-all ease-out duration-200 w-full font-light`}
            disabled={isScanning}
          />
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
          buttonType="primary"
          buttonLabel="Attach artwork to NFC tag later"
          onClick={() => handleAddArtwork({ attachLater: true })}
        />
      </div>
    </div>
  );
};

export default AttachNfc;
