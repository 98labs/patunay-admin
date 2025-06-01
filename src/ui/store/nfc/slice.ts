import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NfcModeEntity } from "../../typings/enums/nfcEnum";
import type { 
  CardData, 
  WriteResult, 
  NfcOperationError, 
  NfcReaderStatus, 
  NfcServiceError 
} from "../../../shared/types/electron";
import {
  NfcState,
  NfcOperationStatus,
  NfcReaderConnectionState,
  NfcOperationHistoryEntry,
  CurrentNfcOperation,
  StartNfcOperationPayload,
  CompleteNfcOperationPayload,
  FailNfcOperationPayload
} from './types';

// Initial state
const initialState: NfcState = {
  readerConnectionState: NfcReaderConnectionState.DISCONNECTED,
  connectedReaderName: null,
  currentMode: NfcModeEntity.Read,
  currentOperation: null,
  detectedCard: null,
  lastReadData: null,
  operationHistory: [],
  lastError: null,
  autoSwitchToReadMode: true,
  operationTimeoutMs: 30000, // 30 seconds
  maxHistoryEntries: 50
};

// Utility functions
const generateOperationId = (): string => {
  return `nfc_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createHistoryEntry = (
  operation: 'read' | 'write',
  status: 'success' | 'error',
  cardUid?: string,
  data?: string,
  error?: string
): NfcOperationHistoryEntry => ({
  id: generateOperationId(),
  timestamp: Date.now(),
  operation,
  status,
  cardUid,
  data,
  error
});

// NFC Slice
export const nfcSlice = createSlice({
  name: 'nfc',
  initialState,
  reducers: {
    // Reader connection management
    setReaderConnectionState: (state, action: PayloadAction<NfcReaderConnectionState>) => {
      state.readerConnectionState = action.payload;
      if (action.payload === NfcReaderConnectionState.DISCONNECTED) {
        state.connectedReaderName = null;
        state.currentOperation = null;
        state.detectedCard = null;
      }
    },

    readerConnected: (state, action: PayloadAction<NfcReaderStatus>) => {
      state.readerConnectionState = NfcReaderConnectionState.CONNECTED;
      state.connectedReaderName = action.payload.readerName;
      state.lastError = null;
    },

    readerDisconnected: (state, action: PayloadAction<NfcReaderStatus>) => {
      state.readerConnectionState = NfcReaderConnectionState.DISCONNECTED;
      state.connectedReaderName = null;
      state.currentOperation = null;
      state.detectedCard = null;
    },

    // Mode management
    setNfcMode: (state, action: PayloadAction<NfcModeEntity>) => {
      state.currentMode = action.payload;
      // Cancel current operation if mode changes
      if (state.currentOperation && state.currentOperation.type !== action.payload.toLowerCase()) {
        state.currentOperation = null;
      }
    },

    // Operation management
    startNfcOperation: (state, action: PayloadAction<StartNfcOperationPayload>) => {
      const { type, dataToWrite, operationId } = action.payload;
      
      state.currentOperation = {
        id: operationId || generateOperationId(),
        type,
        status: type === 'write' ? NfcOperationStatus.WRITING : NfcOperationStatus.SCANNING,
        startTime: Date.now(),
        dataToWrite,
        progress: 0
      };
      
      // Set mode based on operation
      state.currentMode = type === 'write' ? NfcModeEntity.Write : NfcModeEntity.Read;
      state.lastError = null;
    },

    updateOperationProgress: (state, action: PayloadAction<{ operationId: string; progress: number }>) => {
      if (state.currentOperation && state.currentOperation.id === action.payload.operationId) {
        state.currentOperation.progress = action.payload.progress;
      }
    },

    completeNfcOperation: (state, action: PayloadAction<CompleteNfcOperationPayload>) => {
      const { operationId, result } = action.payload;
      
      if (!state.currentOperation || state.currentOperation.id !== operationId) {
        return;
      }

      const operation = state.currentOperation;
      
      // Update operation status
      operation.status = NfcOperationStatus.SUCCESS;
      operation.progress = 100;

      // Handle result based on operation type
      if (operation.type === 'write') {
        const writeResult = result as WriteResult;
        if (writeResult.success) {
          // Add to history
          state.operationHistory.unshift(createHistoryEntry(
            'write',
            'success',
            operation.cardUid,
            writeResult.data
          ));
        }
      } else {
        const cardData = result as CardData;
        state.detectedCard = cardData;
        state.lastReadData = cardData.data || null;
        
        // Add to history
        state.operationHistory.unshift(createHistoryEntry(
          'read',
          'success',
          cardData.uid,
          cardData.data
        ));
      }

      // Limit history size
      if (state.operationHistory.length > state.maxHistoryEntries) {
        state.operationHistory = state.operationHistory.slice(0, state.maxHistoryEntries);
      }

      // Auto-switch to read mode if enabled
      if (state.autoSwitchToReadMode && operation.type === 'write') {
        state.currentMode = NfcModeEntity.Read;
      }

      // Clear current operation after a delay (handled by middleware or component)
      // For now, we'll keep it for UI feedback
    },

    failNfcOperation: (state, action: PayloadAction<FailNfcOperationPayload>) => {
      const { operationId, error } = action.payload;
      
      if (!state.currentOperation || state.currentOperation.id !== operationId) {
        return;
      }

      const operation = state.currentOperation;
      operation.status = NfcOperationStatus.ERROR;
      operation.error = error;

      // Add to history
      state.operationHistory.unshift(createHistoryEntry(
        operation.type,
        'error',
        operation.cardUid,
        undefined,
        error
      ));

      // Limit history size
      if (state.operationHistory.length > state.maxHistoryEntries) {
        state.operationHistory = state.operationHistory.slice(0, state.maxHistoryEntries);
      }
    },

    clearCurrentOperation: (state) => {
      state.currentOperation = null;
    },

    // Card detection
    cardDetected: (state, action: PayloadAction<CardData>) => {
      state.detectedCard = action.payload;
      
      // Update current operation if active
      if (state.currentOperation) {
        state.currentOperation.cardUid = action.payload.uid;
        if (state.currentOperation.type === 'read' && action.payload.data) {
          state.lastReadData = action.payload.data;
        }
      }
    },

    cardRemoved: (state) => {
      state.detectedCard = null;
    },

    // Error handling
    setNfcError: (state, action: PayloadAction<NfcServiceError | NfcOperationError>) => {
      state.lastError = action.payload;
      
      // If there's a current operation, mark it as failed
      if (state.currentOperation) {
        state.currentOperation.status = NfcOperationStatus.ERROR;
        state.currentOperation.error = action.payload.message;
      }
    },

    clearNfcError: (state) => {
      state.lastError = null;
    },

    // Settings
    updateSettings: (state, action: PayloadAction<Partial<Pick<NfcState, 'autoSwitchToReadMode' | 'operationTimeoutMs' | 'maxHistoryEntries'>>>) => {
      Object.assign(state, action.payload);
    },

    // History management
    clearOperationHistory: (state) => {
      state.operationHistory = [];
    },

    removeHistoryEntry: (state, action: PayloadAction<string>) => {
      state.operationHistory = state.operationHistory.filter(entry => entry.id !== action.payload);
    },

    // Reset state
    resetNfcState: (state) => {
      Object.assign(state, initialState);
    }
  }
});

// Export actions
export const {
  setReaderConnectionState,
  readerConnected,
  readerDisconnected,
  setNfcMode,
  startNfcOperation,
  updateOperationProgress,
  completeNfcOperation,
  failNfcOperation,
  clearCurrentOperation,
  cardDetected,
  cardRemoved,
  setNfcError,
  clearNfcError,
  updateSettings,
  clearOperationHistory,
  removeHistoryEntry,
  resetNfcState
} = nfcSlice.actions;

// Export reducer
export default nfcSlice.reducer;