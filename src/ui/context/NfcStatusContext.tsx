import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { NfcDeviceStatus } from '../../shared/types/electron';
import { useLogger } from '../hooks/useLogger';
import { LogCategory } from '../../shared/logging/types';

interface NfcStatusContextType {
  deviceStatus: NfcDeviceStatus;
  isLoading: boolean;
  refreshDeviceStatus: () => void;
  isNfcAvailable: boolean;
  nfcFeaturesEnabled: boolean;
  lastManualRefreshFailed: boolean;
  clearManualRefreshFailed: () => void;
}

const defaultDeviceStatus: NfcDeviceStatus = {
  available: false,
  readers: [],
  initialized: false
};

const NfcStatusContext = createContext<NfcStatusContextType | undefined>(undefined);

interface NfcStatusProviderProps {
  children: ReactNode;
}

export const NfcStatusProvider: React.FC<NfcStatusProviderProps> = ({ children }) => {
  const [deviceStatus, setDeviceStatus] = useState<NfcDeviceStatus>(defaultDeviceStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [lastManualRefreshFailed, setLastManualRefreshFailed] = useState(false);
  const logger = useLogger('NfcStatusProvider');

  // Fetch initial device status
  const fetchDeviceStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.debug('Fetching NFC device status via IPC');
      
      if (window.electron?.getNfcDeviceStatus) {
        const status = await window.electron.getNfcDeviceStatus();
        logger.info('NFC device status received via IPC', LogCategory.NFC, status);
        setDeviceStatus(status);
      } else {
        logger.warn('NFC device status API not available');
        setDeviceStatus(defaultDeviceStatus);
      }
    } catch (error) {
      logger.error('Failed to fetch NFC device status', LogCategory.NFC, undefined, error as Error);
      setDeviceStatus(defaultDeviceStatus);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove logger dependency to prevent infinite loop

  // Manual refresh function
  const refreshDeviceStatus = useCallback(async () => {
    logger.info('Manual NFC device status refresh requested');
    
    if (window.electron?.refreshNfcDeviceStatus) {
      window.electron.refreshNfcDeviceStatus();
      // Wait a bit for the status to update
      setTimeout(async () => {
        // Fetch the latest status
        if (window.electron?.getNfcDeviceStatus) {
          const latestStatus = await window.electron.getNfcDeviceStatus();
          if (!latestStatus.available || latestStatus.readers.length === 0) {
            setLastManualRefreshFailed(true);
          }
        }
      }, 1500);
    } else {
      logger.warn('NFC device status refresh API not available');
      // Fallback to fetching current status
      await fetchDeviceStatus();
      // Check the current device status after fetch
      setTimeout(() => {
        // Use a ref to get the latest state
        setDeviceStatus(current => {
          if (!current.available || current.readers.length === 0) {
            setLastManualRefreshFailed(true);
          }
          return current;
        });
      }, 100);
    }
  }, [fetchDeviceStatus]); // Remove logger dependency

  // Set up event listeners for device status changes
  useEffect(() => {
    logger.debug('Setting up NFC device status listeners');

    // Subscribe to device status updates
    const handleDeviceStatusChange = (status: NfcDeviceStatus) => {
      logger.info('Received NFC device status update from main process', LogCategory.NFC, status);
      setDeviceStatus(status);
      setIsLoading(false);
      // Clear manual refresh failed state if NFC becomes available
      if (status.available && status.readers.length > 0) {
        setLastManualRefreshFailed(false);
      }
    };

    if (window.electron?.subscribeNfcDeviceStatus) {
      window.electron.subscribeNfcDeviceStatus(handleDeviceStatusChange);
    }

    // Fetch initial status ONLY ONCE
    fetchDeviceStatus();

    return () => {
      logger.debug('Cleaning up NFC device status listeners');
      // Note: The current IPC implementation doesn't provide a way to unsubscribe
      // This is generally okay for context providers that live for the app lifetime
    };
  }, []); // Empty dependency array - this should only run once on mount

  // Computed values
  const isNfcAvailable = deviceStatus.available && deviceStatus.readers.length > 0;
  const nfcFeaturesEnabled = isNfcAvailable && deviceStatus.initialized;

  // Log status changes for debugging
  useEffect(() => {
    logger.debug(`NFC status: available=${isNfcAvailable}, enabled=${nfcFeaturesEnabled}, readers=${deviceStatus.readers.length}`);
  }, [deviceStatus, isNfcAvailable, nfcFeaturesEnabled, isLoading]); // Remove logger dependency

  // Function to clear manual refresh failed state
  const clearManualRefreshFailed = useCallback(() => {
    setLastManualRefreshFailed(false);
  }, []);

  const contextValue: NfcStatusContextType = {
    deviceStatus,
    isLoading,
    refreshDeviceStatus,
    isNfcAvailable,
    nfcFeaturesEnabled,
    lastManualRefreshFailed,
    clearManualRefreshFailed
  };

  return (
    <NfcStatusContext.Provider value={contextValue}>
      {children}
    </NfcStatusContext.Provider>
  );
};

export const useNfcStatus = (): NfcStatusContextType => {
  const context = useContext(NfcStatusContext);
  if (context === undefined) {
    throw new Error('useNfcStatus must be used within a NfcStatusProvider');
  }
  return context;
};

export default NfcStatusContext;