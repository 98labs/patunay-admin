import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { 
  startNfcOperation, 
  completeNfcOperation, 
  failNfcOperation, 
  clearCurrentOperation,
  setNfcError,
  cardDetected,
  readerConnected,
  readerDisconnected,
  setReaderConnectionState
} from './slice';
import { NfcReaderConnectionState } from './types';

// NFC Event Listener Middleware
// This middleware handles setting up and managing Electron IPC listeners for NFC events
export const nfcEventMiddleware: Middleware<{}, RootState> = (store) => {
  let isListenersSetup = false;

  const setupNfcListeners = () => {
    if (isListenersSetup || !window.electron) {
      return;
    }

    console.log('Setting up NFC event listeners...');

    // NFC Write Result Listener
    window.electron.subscribeNfcWriteResult?.((result) => {
      console.log('NFC Write Result:', result);
      
      const state = store.getState();
      const currentOperation = state.nfc.currentOperation;
      
      if (currentOperation && currentOperation.type === 'write') {
        if (result.success) {
          store.dispatch(completeNfcOperation({
            operationId: currentOperation.id,
            result
          }));
        } else {
          store.dispatch(failNfcOperation({
            operationId: currentOperation.id,
            error: result.message || 'Write operation failed'
          }));
        }
      }
    });

    // NFC Card Detection Listener
    window.electron.subscribeNfcCardDetection?.((cardData) => {
      console.log('NFC Card Detected:', cardData);
      
      store.dispatch(cardDetected(cardData));
      
      const state = store.getState();
      const currentOperation = state.nfc.currentOperation;
      
      if (currentOperation && currentOperation.type === 'read') {
        store.dispatch(completeNfcOperation({
          operationId: currentOperation.id,
          result: cardData
        }));
      }
    });

    // NFC Reader Connection Listeners
    window.electron.subscribeNfcReaderConnected?.((status) => {
      console.log('NFC Reader Connected:', status);
      store.dispatch(readerConnected(status));
    });

    window.electron.subscribeNfcReaderDisconnected?.((status) => {
      console.log('NFC Reader Disconnected:', status);
      store.dispatch(readerDisconnected(status));
    });

    // NFC Operation Error Listener
    window.electron.subscribeNfcOperationError?.((error) => {
      console.log('NFC Operation Error:', error);
      
      const state = store.getState();
      const currentOperation = state.nfc.currentOperation;
      
      if (currentOperation) {
        store.dispatch(failNfcOperation({
          operationId: currentOperation.id,
          error: error.message
        }));
      } else {
        store.dispatch(setNfcError(error));
      }
    });

    // NFC Service Error Listener
    window.electron.subscribeNfcServiceError?.((error) => {
      console.log('NFC Service Error:', error);
      store.dispatch(setNfcError(error));
      store.dispatch(setReaderConnectionState(NfcReaderConnectionState.ERROR));
    });

    isListenersSetup = true;
    console.log('NFC event listeners setup complete');
  };

  return (next) => (action) => {
    const result = next(action);

    // Setup listeners on first NFC-related action or when the app starts
    if (!isListenersSetup && window.electron) {
      setupNfcListeners();
    }

    return result;
  };
};

// Operation Timeout Middleware
// Automatically fails operations that exceed the timeout duration
export const nfcTimeoutMiddleware: Middleware<{}, RootState> = (store) => {
  const activeTimeouts = new Map<string, NodeJS.Timeout>();

  return (next) => (action) => {
    const result = next(action);
    
    // Start timeout when operation begins
    if (startNfcOperation.match(action)) {
      const state = store.getState();
      const operation = state.nfc.currentOperation;
      const timeoutMs = state.nfc.operationTimeoutMs;
      
      if (operation) {
        const timeoutId = setTimeout(() => {
          console.log(`NFC operation ${operation.id} timed out after ${timeoutMs}ms`);
          store.dispatch(failNfcOperation({
            operationId: operation.id,
            error: `Operation timed out after ${timeoutMs / 1000} seconds`
          }));
          activeTimeouts.delete(operation.id);
        }, timeoutMs);
        
        activeTimeouts.set(operation.id, timeoutId);
      }
    }
    
    // Clear timeout when operation completes or fails
    if (completeNfcOperation.match(action) || failNfcOperation.match(action)) {
      const operationId = action.payload.operationId;
      const timeoutId = activeTimeouts.get(operationId);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        activeTimeouts.delete(operationId);
      }
    }
    
    // Clear timeout when operation is manually cleared
    if (clearCurrentOperation.match(action)) {
      const state = store.getState();
      const operation = state.nfc.currentOperation;
      
      if (operation) {
        const timeoutId = activeTimeouts.get(operation.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          activeTimeouts.delete(operation.id);
        }
      }
    }

    return result;
  };
};

// Auto-cleanup Middleware
// Automatically clears completed operations after a delay for better UX
export const nfcAutoCleanupMiddleware: Middleware<{}, RootState> = (store) => {
  const CLEANUP_DELAY = 3000; // 3 seconds

  return (next) => (action) => {
    const result = next(action);
    
    // Auto-clear successful operations after delay
    if (completeNfcOperation.match(action)) {
      setTimeout(() => {
        const state = store.getState();
        const currentOperation = state.nfc.currentOperation;
        
        // Only clear if it's still the same operation and it's completed
        if (currentOperation && 
            currentOperation.id === action.payload.operationId &&
            currentOperation.status === 'success') {
          store.dispatch(clearCurrentOperation());
        }
      }, CLEANUP_DELAY);
    }

    return result;
  };
};

// Combined NFC Middleware
export const nfcMiddleware = [
  nfcEventMiddleware,
  nfcTimeoutMiddleware,
  nfcAutoCleanupMiddleware
];