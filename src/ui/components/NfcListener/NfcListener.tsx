import { useEffect, useState } from "react";

interface CardData {
  uid: string;
}

const NfcListener = () => {
  const [cardData, setCardData] = useState<CardData | null>(null);

  useEffect(() => {
    window.electron.subscribeNfcCardDetection((card: CardData) => {
      console.log("Card received in frontend:", card);
      setCardData(card);
    });
  }, []);

  return (
    <div className="p-4 rounded-lg shadow bg-white">
      <h2 className="text-lg font-bold mb-2">NFC Card Info</h2>
      {cardData ? (
        <div>
          <p>
            <strong>UID:</strong> {cardData.uid}
          </p>
        </div>
      ) : (
        <p>No card scanned yet.</p>
      )}
    </div>
  );
};

export default NfcListener;
