import { NfcEventEntity } from "../../typings";
import { useEffect } from "react";

export const useNfcWebSocket = (onMessage: (event: NfcEventEntity) => void) => {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NfcEventEntity;
        console.log(`parsed data: ${JSON.stringify(data)}`);

        onMessage(data);
        console.log(`after onMessage: ${JSON.stringify(data)}`);
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
