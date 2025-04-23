import electron from "electron";

export interface CardData {
  uid: string;
}

interface ElectronAPI {
  subscribeStatistics: (callback: (statistics: Statistics) => void) => void;
  getStaticData: () => Promise<StaticData>;
  subscribeNfcCardDetection: (callback: (card: CardData) => void) => void;
}

interface Window {
  electron: ElectronAPI;
}

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeStatistics: (callback: (statistics: any) => void) => {
    electron.ipcRenderer.on("statistics", (_: any, stats: any) => {
      callback(stats);
    });
  },
  getStaticData: () => electron.ipcRenderer.invoke("getStaticData"),

  subscribeNfcCardDetection: (callback: (card: CardData) => void) => {
    electron.ipcRenderer.on("nfc-card-detected", (_event, card: CardData) => {
      callback(card);
    });
  },
} satisfies Window["electron"]);
