import { Button } from "@components";
import { ArtworkEntity, NfcModeEntity } from "@typings";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";

import { updateArtwork } from "../../../../supabase/rpc/updateArtwork";
import { safeJsonParse } from "../../../Artworks/components/utils";

interface Props {
  data: ArtworkEntity;
  onUpdateArtwork: (result: ArtworkEntity) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

interface WriteResult {
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}

const AttachNfc = ({ data, onUpdateArtwork, onPrev, onNext }: Props) => {
  const [writeResult, setWriteResult] = useState<WriteResult | null>(null);
  const [isScanning, setisScanning] = useState<boolean>(false);
  const [isAttaching, setIsAttaching] = useState(false);

  const handleStartScanning = async () => {
    setisScanning(true);
  };

  const handleAttachArtwork = async (options: {
    attachLater: boolean;
    tagId?: string;
  }) => {
    if (isAttaching) return;
    setIsAttaching(true);

    try {
      const result = await updateArtwork({ ...data!, tag_id: options.tagId });

      if (!result) {
        alert("Failed to attach artwork. Please try again.");
        return;
      }

      onUpdateArtwork({
        ...result[0],
        tag_id: options.tagId,
        bibliography: safeJsonParse(result[0].bibliography),
        collectors: safeJsonParse(result[0].collectors),
      });

      window.electron.writeOnTag(
        options.attachLater ? "No data" : (data.id ?? "No Data")
      );

      await onNext();
    } catch (err) {
      console.error("Attach artwork error:", err);
    } finally {
      setIsAttaching(false);
    }
  };

  const handleAttachArtworkLater = async () => {
    if (isAttaching) return;

    await handleAttachArtwork({ attachLater: true });
  };

  const handleOnPrev = async () => {
    if (isAttaching) return;

    onPrev();
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
      async (card: { uid: string; data: any }) => {
        if (isAttaching) return;

        setIsAttaching(true);
        await handleAttachArtwork({ attachLater: false, tagId: card.uid });
        setIsAttaching(false);
      }
    );
  }, [isScanning, handleAttachArtwork]);

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
          disabled={isAttaching}
          onClick={handleOnPrev}
        />
        <Button
          buttonType="secondary"
          buttonLabel="Attach artwork to NFC tag later"
          disabled={isAttaching}
          onClick={handleAttachArtworkLater}
        />
      </div>
    </div>
  );
};

export default AttachNfc;
