import { useEffect } from "react";

interface NfcEvent {
  type: "CARD_DETECTED" | "CARD_REMOVED" | "CARD_READ" | "CARD_WRITE";
  card: any;
  data?: string;
}

export const useNfcWebSocket = (onMessage: (event: NfcEvent) => void) => {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NfcEvent;
        console.log(`parsed data: ${JSON.stringify(data)}`);

        onMessage(data);
        console.log(`after onMessage: ${JSON.stringify(data)}`);
      } catch (e) {
        console.error("Invalid WebSocket message:", event.data);
      }
    };
    const something = {
      type: "CARD_READ",
      data: "10:24:48 GMT",
      card: {
        atr: {
          type: "Buffer",
          data: [
            59, 143, 128, 1, 128, 79, 12, 160, 0, 0, 3, 6, 3, 0, 3, 0, 0, 0, 0,
            104,
          ],
        },
        standard: "TAG_ISO_14443_3",
        type: "TAG_ISO_14443_3",
        uid: "04811c01064803",
      },
    };
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [onMessage]);
};
