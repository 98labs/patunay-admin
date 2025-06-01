import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { NfcModeEntity } from '../typings/enums/nfcEnum';
import {
  startNfcOperation,
  setNfcMode,
  clearCurrentOperation,
  clearNfcError,
  updateSettings,
  clearOperationHistory,
  removeHistoryEntry,
  resetNfcState
} from '../store/nfc';
import {
  selectNfcStatus,
  selectCurrentOperation,
  selectDetectedCard,
  selectOperationHistory,
  selectNfcSettings,
  selectLastError,
  selectIsReaderConnected,
  selectCanStartOperation,
  selectOperationStats,
  selectNfcSummary
} from '../store/nfc/selectors';
import type { StartNfcOperationPayload } from '../store/nfc/types';

export const useNfc = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const nfcStatus = useSelector(selectNfcStatus);
  const currentOperation = useSelector(selectCurrentOperation);
  const detectedCard = useSelector(selectDetectedCard);
  const operationHistory = useSelector(selectOperationHistory);
  const settings = useSelector(selectNfcSettings);
  const lastError = useSelector(selectLastError);
  const isReaderConnected = useSelector(selectIsReaderConnected);
  const canStartOperation = useSelector(selectCanStartOperation);
  const operationStats = useSelector(selectOperationStats);
  const nfcSummary = useSelector(selectNfcSummary);

  // Action creators
  const startReadOperation = useCallback(() => {
    if (!canStartOperation) {
      console.warn('Cannot start NFC operation: reader not connected or operation already active');
      return;
    }

    dispatch(startNfcOperation({
      type: 'read'
    }));

    // Trigger Electron NFC mode change
    if (window.electron?.setMode) {
      window.electron.setMode(NfcModeEntity.Read);
    }
  }, [dispatch, canStartOperation]);

  const startWriteOperation = useCallback((data: string) => {
    if (!canStartOperation) {
      console.warn('Cannot start NFC operation: reader not connected or operation already active');
      return;
    }

    if (!data || data.trim().length === 0) {
      console.warn('Cannot start write operation: no data provided');
      return;
    }

    const operationPayload: StartNfcOperationPayload = {
      type: 'write',
      dataToWrite: data
    };

    dispatch(startNfcOperation(operationPayload));

    // Trigger Electron NFC write
    if (window.electron?.writeOnTag) {
      window.electron.writeOnTag(data);
    }
  }, [dispatch, canStartOperation]);

  const cancelOperation = useCallback(() => {
    dispatch(clearCurrentOperation());
    
    // Reset to read mode
    dispatch(setNfcMode(NfcModeEntity.Read));
    if (window.electron?.setMode) {
      window.electron.setMode(NfcModeEntity.Read);
    }
  }, [dispatch]);

  const setMode = useCallback((mode: NfcModeEntity) => {
    dispatch(setNfcMode(mode));
    
    if (window.electron?.setMode) {
      window.electron.setMode(mode);
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearNfcError());
  }, [dispatch]);

  const updateNfcSettings = useCallback((newSettings: Partial<typeof settings>) => {
    dispatch(updateSettings(newSettings));
  }, [dispatch, settings]);

  const clearHistory = useCallback(() => {
    dispatch(clearOperationHistory());
  }, [dispatch]);

  const removeHistoryItem = useCallback((historyId: string) => {
    dispatch(removeHistoryEntry(historyId));
  }, [dispatch]);

  const resetNfc = useCallback(() => {
    dispatch(resetNfcState());
  }, [dispatch]);

  // Utility functions
  const isOperationActive = currentOperation !== null;
  const isScanning = currentOperation?.status === 'scanning';
  const isWriting = currentOperation?.status === 'writing';
  const isCardPresent = detectedCard !== null;
  const hasError = lastError !== null;

  const getOperationStatusText = useCallback(() => {
    if (!isReaderConnected) return 'Reader disconnected';
    if (hasError) return `Error: ${lastError?.message}`;
    if (isWriting) return 'Writing to card...';
    if (isScanning) return 'Scanning for card...';
    if (isCardPresent) return `Card detected: ${detectedCard?.uid}`;
    return 'Ready';
  }, [isReaderConnected, hasError, isWriting, isScanning, isCardPresent, lastError, detectedCard]);

  return {
    // State
    nfcStatus,
    currentOperation,
    detectedCard,
    operationHistory,
    settings,
    lastError,
    operationStats,
    nfcSummary,

    // Computed state
    isReaderConnected,
    canStartOperation,
    isOperationActive,
    isScanning,
    isWriting,
    isCardPresent,
    hasError,

    // Actions
    startReadOperation,
    startWriteOperation,
    cancelOperation,
    setMode,
    clearError,
    updateNfcSettings,
    clearHistory,
    removeHistoryItem,
    resetNfc,

    // Utilities
    getOperationStatusText
  };
};