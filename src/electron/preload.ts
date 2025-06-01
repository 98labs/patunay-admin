import { contextBridge, ipcRenderer } from "electron";
import type { 
  ElectronAPI, 
  Statistics, 
  StaticData, 
  WriteResult, 
  CardData,
  NfcOperationError,
  NfcReaderStatus,
  NfcServiceError
} from "../shared/types/electron.js";
import { NfcModeEntity } from "../ui/typings/enums/nfcEnum.js";

// Implement the complete ElectronAPI
const electronAPI: ElectronAPI = {
  // System information
  getStaticData: (): Promise<StaticData> => ipcRenderer.invoke("getStatisticData"),
  
  // Logging support
  ipcRenderer: {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data)
  },
  
  subscribeStatistics: (callback: (statistics: Statistics) => void): void => {
    ipcRenderer.on("statistics", (_, stats: Statistics) => {
      callback(stats);
    });
  },

  // NFC operations
  setMode: (mode: NfcModeEntity, data?: string): void => {
    ipcRenderer.send("nfc-set-mode", { mode, data });
  },

  writeOnTag: (data?: string): void => {
    ipcRenderer.send("nfc-write-tag", { data });
  },

  subscribeNfcWriteResult: (callback: (result: WriteResult) => void): void => {
    ipcRenderer.on("nfc-write-result", (_, result: WriteResult) => {
      callback(result);
    });
  },

  subscribeNfcCardDetection: (callback: (data: CardData) => void): void => {
    ipcRenderer.on("nfc-card-detected", (_, data: CardData) => {
      callback(data);
    });
  },

  // Enhanced NFC event listeners for better error handling
  subscribeNfcOperationError: (callback: (error: NfcOperationError) => void): void => {
    ipcRenderer.on("nfc-operation-error", (_, error: NfcOperationError) => {
      callback(error);
    });
  },

  subscribeNfcReaderConnected: (callback: (status: NfcReaderStatus) => void): void => {
    ipcRenderer.on("nfc-reader-connected", (_, status: NfcReaderStatus) => {
      callback(status);
    });
  },

  subscribeNfcReaderDisconnected: (callback: (status: NfcReaderStatus) => void): void => {
    ipcRenderer.on("nfc-reader-disconnected", (_, status: NfcReaderStatus) => {
      callback(status);
    });
  },

  subscribeNfcServiceError: (callback: (error: NfcServiceError) => void): void => {
    ipcRenderer.on("nfc-service-error", (_, error: NfcServiceError) => {
      callback(error);
    });
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electron", electronAPI);
