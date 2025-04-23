import type { CardData } from "./preload"; // adjust the import path if needed

interface Window {
  electron: {
    subscribeStatistics: (callback: (statistics: Statistics) => void) => void;
    getStaticData: () => Promise<StaticData>;

    // ✅ Add this new method
    subscribeNfcCardDetection: (callback: (card: CardData) => void) => void;
  };
}
