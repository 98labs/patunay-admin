import { Button, NfcListener, NfcModeSwitcher } from "@components";
import { ArtworkEntity, NfcModeEntity } from "@typings";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";
import { addArtwork } from "../../../../supabase/rpc/addArtwork";

interface Props {
  data: ArtworkEntity;
  onPrev: () => void;
  onNext: () => void;
}

interface WriteResult {
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}

const Step6 = ({ data, onNext }: Props) => {
  const [textToWrite, setTextToWrite] = useState<string>("");
  const [writeResult, setWriteResult] = useState<WriteResult | null>(null);
  const [isScanning, setisScanning] = useState<boolean>(false);

  const handleSetText = (text: string) => {
    setTextToWrite(text);
  };

  const handleStartScanning = () => {
    setisScanning(true);
    window.electron.writeOnTag(textToWrite);
  };

  const handleAddArtwork = async () => {
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
      tagId: null,
      expirationDate: new Date("2025-12-31"),
      readWriteCount: 0,
      provenance: data.provenance,
      collectors: data.collectors,
      assets: null,
    };

    const result = (await addArtwork(artwork))[0];

    const parsedRes: ArtworkEntity = {
      ...result,
      idNumber: result.idnumber,
      sizeUnit: result.size_unit,
      tagId: result.tag_id,
      collectors: result.collectors ? JSON.parse(result.collectors) : [],
      assets: result.assets
        ? result.assets.map((asset: any) => ({
            fileName: asset.filename ?? "", // fallback to empty string if null
            url: asset.url,
            sortOrder: asset.sort_order,
          }))
        : null,
    };

    console.log("Result", parsedRes);
    onNext();
  };

  useEffect(() => {
    const unsubscribe = window.electron.subscribeNfcWriteResult((result) => {
      console.log(result);
      if (result.success) {
        setWriteResult(result);
      } else {
        alert("Write failed: " + result.message);
      }

      setisScanning(false);

      return unsubscribe;
    });
  }, []);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
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
      <Button
        buttonType="secondary"
        buttonLabel="Attach artwork to NFC tag later"
        onClick={handleAddArtwork}
      />
    </div>
  );
};

export default Step6;
