export interface ElectronAPI {
  getStaticData: () => Promise<StaticData>;
  subscribeStatistics: (callback: (statistics: Statistics) => void) => void;
  subscribeNfcWriteResult: (callback: (result: WriteResult) => void) => void;
  subscribeNfcCardDetection: (callback: (card: CardData) => void) => void;
  writeOnTag: (data?: string) => void;
}
