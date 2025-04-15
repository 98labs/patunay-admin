import { useEffect } from "react";

interface NfcEvent {
  type: "CARD_DETECTED" | "CARD_REMOVED";
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
      } catch (e) {
        console.error("Invalid WebSocket message:", event.data);
      }
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
