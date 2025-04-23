// global.d.ts
import { CardData } from "./preload"; // Adjust the import as necessary for your CardData type

declare global {
  interface Window {
    electron: {
      subscribeStatistics: (callback: (statistics: any) => void) => void;
      getStaticData: () => Promise<any>;
      subscribeNfcCardDetection: (callback: (card: CardData) => void) => void; // Add NFC card detection here
    };
  }
}

export {};
