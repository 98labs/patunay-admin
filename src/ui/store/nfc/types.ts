// NFC State Management Types
import { NfcModeEntity } from "../../typings/enums/nfcEnum";
import type { 
  CardData, 
  WriteResult, 
  NfcOperationError, 
  NfcReaderStatus, 
  NfcServiceError 
} from "../../../shared/types/electron";

// NFC Operation Status
export enum NfcOperationStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  WRITING = 'writing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// NFC Reader Connection State
export enum NfcReaderConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// NFC Operation History Entry
export interface NfcOperationHistoryEntry {
  id: string;
  timestamp: number;
  operation: 'read' | 'write';
  status: 'success' | 'error';
  cardUid?: string;
  data?: string;
  error?: string;
}

// Current NFC Operation
export interface CurrentNfcOperation {
  id: string;
  type: 'read' | 'write';
  status: NfcOperationStatus;
  startTime: number;
  cardUid?: string;
  dataToWrite?: string;
  error?: string;
  progress?: number; // For operations that have progress indication
}

// NFC State Interface
export interface NfcState {
  // Connection state
  readerConnectionState: NfcReaderConnectionState;
  connectedReaderName: string | null;
  
  // Operation state
  currentMode: NfcModeEntity;
  currentOperation: CurrentNfcOperation | null;
  
  // Card state
  detectedCard: CardData | null;
  lastReadData: string | null;
  
  // Operation history
  operationHistory: NfcOperationHistoryEntry[];
  
  // Error state
  lastError: NfcServiceError | NfcOperationError | null;
  
  // Settings
  autoSwitchToReadMode: boolean;
  operationTimeoutMs: number;
  maxHistoryEntries: number;
}

// Action Payloads
export interface StartNfcOperationPayload {
  type: 'read' | 'write';
  dataToWrite?: string;
  operationId?: string;
}

export interface CompleteNfcOperationPayload {
  operationId: string;
  result: WriteResult | CardData;
}

export interface FailNfcOperationPayload {
  operationId: string;
  error: string;
}