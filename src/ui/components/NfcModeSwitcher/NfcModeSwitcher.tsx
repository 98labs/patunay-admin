import { NfcModeEntity } from "@typings";
import { useEffect, useState } from "react";

interface CardData {
  uid: string;
}

const NfcModeSwitcher = () => {
  const [cardData, setCardData] = useState<any | null>(null);
  const [mode, setMode] = useState<NfcModeEntity>(NfcModeEntity.Read);
  const [textToWrite, setTextToWrite] = useState("");

  const handleModeChange = () => {
    if (mode === NfcModeEntity.Write && textToWrite.trim() === "") {
      alert("Please enter something to write.");
      return;
    }

    window.electron.setMode(mode, textToWrite);
  };

  useEffect(() => {
    window.electron.subscribeNfcCardDetection((card: CardData) => {
      setCardData(card);
    });
  }, []);

  return (
    <div className="p-4 border rounded max-w-md flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Select NFC Mode</h2>
      <div className="flex gap-4">
        <label>
          <input
            type="radio"
            name="nfc-mode"
            value={NfcModeEntity.Read}
            checked={mode === NfcModeEntity.Read}
            onChange={() => setMode(NfcModeEntity.Read)}
          />
          <span className="ml-2">Read</span>
        </label>
        <label>
          <input
            type="radio"
            name="nfc-mode"
            value={NfcModeEntity.Write}
            checked={mode === NfcModeEntity.Write}
            onChange={() => setMode(NfcModeEntity.Write)}
          />
          <span className="ml-2">Write</span>
        </label>
      </div>

      {mode === NfcModeEntity.Read && <div>{cardData}</div>}

      {mode === NfcModeEntity.Write && (
        <input
          className="border px-2 py-1 rounded"
          placeholder="Enter text to write"
          value={textToWrite}
          onChange={(e) => setTextToWrite(e.target.value)}
        />
      )}

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleModeChange}
      >
        Activate {mode.toUpperCase()} Mode
      </button>
    </div>
  );
};

export default NfcModeSwitcher;
