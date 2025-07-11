import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { NfcOperationStatus, NfcReaderConnectionState } from './types';

// Base selector
const selectNfcState = (state: RootState) => state.nfc;

// Connection selectors
export const selectReaderConnectionState = createSelector(
  [selectNfcState],
  (nfc) => nfc.readerConnectionState
);

export const selectConnectedReaderName = createSelector(
  [selectNfcState],
  (nfc) => nfc.connectedReaderName
);

export const selectIsReaderConnected = createSelector(
  [selectReaderConnectionState],
  (connectionState) => connectionState === NfcReaderConnectionState.CONNECTED
);

// Mode selectors
export const selectCurrentNfcMode = createSelector(
  [selectNfcState],
  (nfc) => nfc.currentMode
);

// Operation selectors
export const selectCurrentOperation = createSelector(
  [selectNfcState],
  (nfc) => nfc.currentOperation
);

export const selectIsOperationActive = createSelector(
  [selectCurrentOperation],
  (operation) => operation !== null
);

export const selectIsScanning = createSelector(
  [selectCurrentOperation],
  (operation) => operation?.status === NfcOperationStatus.SCANNING
);

export const selectIsWriting = createSelector(
  [selectCurrentOperation],
  (operation) => operation?.status === NfcOperationStatus.WRITING
);

export const selectOperationProgress = createSelector(
  [selectCurrentOperation],
  (operation) => operation?.progress || 0
);

export const selectOperationStatus = createSelector(
  [selectCurrentOperation],
  (operation) => operation?.status || NfcOperationStatus.IDLE
);

export const selectOperationError = createSelector(
  [selectCurrentOperation],
  (operation) => operation?.error
);

// Card selectors
export const selectDetectedCard = createSelector(
  [selectNfcState],
  (nfc) => nfc.detectedCard
);

export const selectLastReadData = createSelector(
  [selectNfcState],
  (nfc) => nfc.lastReadData
);

export const selectIsCardDetected = createSelector(
  [selectDetectedCard],
  (card) => card !== null
);

// History selectors
export const selectOperationHistory = createSelector(
  [selectNfcState],
  (nfc) => nfc.operationHistory
);

export const selectRecentOperations = createSelector(
  [selectOperationHistory],
  (history) => history.slice(0, 10) // Last 10 operations
);

export const selectSuccessfulOperations = createSelector(
  [selectOperationHistory],
  (history) => history.filter(op => op.status === 'success')
);

export const selectFailedOperations = createSelector(
  [selectOperationHistory],
  (history) => history.filter(op => op.status === 'error')
);

export const selectOperationStats = createSelector(
  [selectOperationHistory],
  (history) => {
    const total = history.length;
    const successful = history.filter(op => op.status === 'success').length;
    const failed = history.filter(op => op.status === 'error').length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    return {
      total,
      successful,
      failed,
      successRate: Math.round(successRate * 100) / 100
    };
  }
);

// Error selectors
export const selectLastError = createSelector(
  [selectNfcState],
  (nfc) => nfc.lastError
);

export const selectHasError = createSelector(
  [selectLastError],
  (error) => error !== null
);

// Settings selectors
export const selectNfcSettings = createSelector(
  [selectNfcState],
  (nfc) => ({
    autoSwitchToReadMode: nfc.autoSwitchToReadMode,
    operationTimeoutMs: nfc.operationTimeoutMs,
    maxHistoryEntries: nfc.maxHistoryEntries
  })
);

// Composite selectors
export const selectNfcStatus = createSelector(
  [
    selectReaderConnectionState,
    selectCurrentOperation,
    selectDetectedCard,
    selectLastError
  ],
  (connectionState, operation, card, error) => ({
    isConnected: connectionState === NfcReaderConnectionState.CONNECTED,
    isOperationActive: operation !== null,
    isCardDetected: card !== null,
    hasError: error !== null,
    status: error ? 'error' : 
             operation ? 'active' : 
             connectionState === NfcReaderConnectionState.CONNECTED ? 'ready' : 'disconnected'
  })
);

export const selectCanStartOperation = createSelector(
  [selectIsReaderConnected, selectIsOperationActive],
  (isConnected, isActive) => isConnected && !isActive
);

export const selectNfcSummary = createSelector(
  [
    selectReaderConnectionState,
    selectConnectedReaderName,
    selectCurrentOperation,
    selectDetectedCard,
    selectOperationStats,
    selectLastError
  ],
  (connectionState, readerName, operation, card, stats, error) => ({
    connection: {
      state: connectionState,
      readerName,
      isConnected: connectionState === NfcReaderConnectionState.CONNECTED
    },
    operation: {
      current: operation,
      isActive: operation !== null,
      type: operation?.type,
      status: operation?.status,
      progress: operation?.progress || 0
    },
    card: {
      detected: card,
      isPresent: card !== null,
      uid: card?.uid
    },
    statistics: stats,
    error: error
  })
);