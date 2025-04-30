import electron from "electron";
import { ElectronAPI } from "./types/electronApi.js";

interface Window {
  electron: ElectronAPI;
}

electron.contextBridge.exposeInMainWorld("electron", {
  getStaticData: () => electron.ipcRenderer.invoke("getStaticData"),
  subscribeStatistics: (callback: (statistics: any) => void) => {
    electron.ipcRenderer.on("statistics", (_: any, stats: any) => {
      callback(stats);
    });
  },
  subscribeNfcWriteResult: (
    callback: (result: {
      success: boolean;
      message: string;
      data?: string;
      error?: string;
    }) => void
  ) =>
    electron.ipcRenderer.on("nfc-write-result", (_event, result) => {
      callback(result);
    }),
  subscribeNfcCardDetection: (callback: (card: CardData) => void) => {
    electron.ipcRenderer.on("nfc-card-detected", (_event, card: CardData) => {
      callback(card);
    });
  },
  writeOnTag: (data?: string) => {
    electron.ipcRenderer.send("nfc-write-tag", { data });
  },
} satisfies Window["electron"]);
