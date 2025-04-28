import { NfcModeEntity } from "./enums/nfcMode";
import { CardData } from "./CardData";

declare global {
  interface Window {
    electron: {
      subscribeStatistics: (callback: (statistics: any) => void) => void;
      getStaticData: () => Promise<any>;

      setMode: (mode: NfcModeEntity, data?: string) => void;
      subscribeNfcCardDetection: (callback: (card: CardData) => void) => void;
    };
  }
}

export {};
