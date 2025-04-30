import { Button, NfcListener, NfcModeSwitcher } from "@components";
import { NfcModeEntity } from "@typings";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  onDataChange: (data: { [key: string]: string }) => void;
  onPrev: () => void;
  onNext: () => void;
}

interface WriteResult {
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}

const Step6 = ({ onNext }: Props) => {
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
        onClick={onNext}
      />
    </div>
  );
};

export default Step6;
