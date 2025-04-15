import { useState } from "react";

import { useNfcWebSocket } from "@hooks";

const NfcListener = () => {
  const [cardInfo, setCardInfo] = useState<any | null>(null);
  const [status, setStatus] = useState("Waiting...");

  useNfcWebSocket((event) => {
    console.log(`useNfcWebSocket triggered: ${JSON.stringify(event)}`);

    if (event.type === "CARD_DETECTED") {
      setStatus("Card detected!");
      setCardInfo(event.card);
    } else if (event.type === "CARD_READ") {
      setStatus("Card read");
      setCardInfo(event);
    } else if (event.type === "CARD_WRITE") {
      setStatus("Card written");
      setCardInfo(event);
    } else if (event.type === "CARD_REMOVED") {
      setStatus("Card removed");
      setCardInfo(null);
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">NFC Status: {status}</h2>
      {cardInfo && (
        <pre className="mt-2 bg-gray-100 p-2 rounded">
          {JSON.stringify(cardInfo, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default NfcListener;
