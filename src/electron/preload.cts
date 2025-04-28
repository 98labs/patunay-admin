import { CardData } from "./../types/CardData";
import { NfcModeEntity } from "./../types/enums/nfcMode";
import electron from "electron";

export interface Statistics {
  // Define the structure of statistics object, e.g.,:
  cpuUsage: number;
  memoryUsage: number;
  diskSpace: number;
}

export interface StaticData {
  // Define the structure of static data, e.g.:
  userId: string;
  username: string;
}

interface ElectronAPI {
  subscribeStatistics: (callback: (statistics: Statistics) => void) => void;
  getStaticData: () => Promise<StaticData>;
  setMode: (mode: NfcModeEntity, data?: string) => void;
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
  setMode: (mode: NfcModeEntity, data?: string) => {
    electron.ipcRenderer.send("nfc-set-mode", { mode, data });
  },
  subscribeNfcCardDetection: (callback: (card: CardData) => void) => {
    electron.ipcRenderer.on("nfc-card-detected", (_event, card: CardData) => {
      callback(card);
    });
  },
} satisfies Window["electron"]);
