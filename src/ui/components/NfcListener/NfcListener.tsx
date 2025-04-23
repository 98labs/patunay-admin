import { useEffect, useState } from "react";

interface CardData {
  uid: string;
}

const NfcListener = () => {
  const [cardData, setCardData] = useState<any | null>(null);

  useEffect(() => {
    window.electron.subscribeNfcCardDetection((card: CardData) => {
      setCardData(card);
    });
  }, []);

  return (
    <div className="p-4 rounded-lg shadow bg-white">
      <h2 className="text-lg font-bold mb-2">NFC Card Info</h2>
      {cardData ? (
        <div>
          <p>
            <strong>CARD:</strong> {cardData}
          </p>
        </div>
      ) : (
        <p>No card scanned yet.</p>
      )}
    </div>
  );
};

export default NfcListener;
