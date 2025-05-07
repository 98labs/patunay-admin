import { NfcModeEntity } from "./enums/nfcMode";

interface CardData {
  uid: string;
}

declare global {
  interface Window {
    electron: {
      subscribeStatistics: (callback: (statistics: any) => void) => void;
      getStaticData: () => Promise<any>;

      setMode: (mode: NfcModeEntity, data?: string) => void;
      writeOnTag: (data?: string) => void;
      subscribeNfcWriteResult: (
        callback: (result: {
          success: boolean;
          message: string;
          data?: string;
          error?: string;
        }) => void
      ) => void;
      subscribeNfcCardDetection: (
        callback: (data: { uid: string; data: any }) => void
      ) => void;
    };
  }
}

export {};
