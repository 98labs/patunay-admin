// Shared types between Electron main process and renderer process
// This ensures type consistency across the entire application

import { NfcModeEntity } from "../../ui/typings/enums/nfcEnum";

// Statistics data from main process
export interface Statistics {
  cpuUsage: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
}

// Static data from main process
export interface StaticData {
  appVersion: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
}

// NFC card data structure
export interface CardData {
  uid: string;
  data?: string;
}

// NFC write operation result
export interface WriteResult {
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}

// NFC operation error details
export interface NfcOperationError {
  type: string;
  message: string;
  uid?: string;
  mode?: NfcModeEntity;
}

// NFC reader connection status
export interface NfcReaderStatus {
  readerName: string;
  status: 'connected' | 'disconnected';
}

// NFC service error
export interface NfcServiceError {
  type: string;
  message: string;
}

// NFC device status
export interface NfcDeviceStatus {
  available: boolean;
  readers: string[];
  initialized: boolean;
}

// Complete Electron API interface
export interface ElectronAPI {
  // System information
  getStaticData: () => Promise<StaticData>;
  subscribeStatistics: (callback: (statistics: Statistics) => void) => void;

  // Logging support
  ipcRenderer: {
    send: (channel: string, data: any) => void;
  };

  // NFC operations
  setMode: (mode: NfcModeEntity, data?: string) => void;
  writeOnTag: (data?: string) => void;
  subscribeNfcWriteResult: (callback: (result: WriteResult) => void) => void;
  subscribeNfcCardDetection: (callback: (data: CardData) => void) => void;
  
  // NFC event listeners (for improved error handling)
  subscribeNfcOperationError?: (callback: (error: NfcOperationError) => void) => void;
  subscribeNfcReaderConnected?: (callback: (status: NfcReaderStatus) => void) => void;
  subscribeNfcReaderDisconnected?: (callback: (status: NfcReaderStatus) => void) => void;
  subscribeNfcServiceError?: (callback: (error: NfcServiceError) => void) => void;
  
  // NFC device status management
  getNfcDeviceStatus?: () => Promise<NfcDeviceStatus>;
  refreshNfcDeviceStatus?: () => void;
  subscribeNfcDeviceStatus?: (callback: (status: NfcDeviceStatus) => void) => void;
}

export {};