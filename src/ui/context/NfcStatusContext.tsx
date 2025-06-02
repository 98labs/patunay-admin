import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { NfcDeviceStatus } from '../../shared/types/electron';
import { useLogger } from '../hooks/useLogger';

interface NfcStatusContextType {
  deviceStatus: NfcDeviceStatus;
  isLoading: boolean;
  refreshDeviceStatus: () => void;
  isNfcAvailable: boolean;
  nfcFeaturesEnabled: boolean;
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
  const logger = useLogger('NfcStatusProvider');

  // Fetch initial device status
  const fetchDeviceStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.debug('Fetching NFC device status via IPC');
      
      if (window.electron?.getNfcDeviceStatus) {
        const status = await window.electron.getNfcDeviceStatus();
        logger.info('NFC device status received via IPC', status);
        setDeviceStatus(status);
      } else {
        logger.warn('NFC device status API not available');
        setDeviceStatus(defaultDeviceStatus);
      }
    } catch (error) {
      logger.error('Failed to fetch NFC device status', error);
      setDeviceStatus(defaultDeviceStatus);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove logger dependency to prevent infinite loop

  // Manual refresh function
  const refreshDeviceStatus = useCallback(() => {
    logger.info('Manual NFC device status refresh requested');
    
    if (window.electron?.refreshNfcDeviceStatus) {
      window.electron.refreshNfcDeviceStatus();
    } else {
      logger.warn('NFC device status refresh API not available');
      // Fallback to fetching current status
      fetchDeviceStatus();
    }
  }, [fetchDeviceStatus]); // Remove logger dependency

  // Set up event listeners for device status changes
  useEffect(() => {
    logger.debug('Setting up NFC device status listeners');

    // Subscribe to device status updates
    const handleDeviceStatusChange = (status: NfcDeviceStatus) => {
      logger.info('Received NFC device status update from main process', status);
      setDeviceStatus(status);
      setIsLoading(false);
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

  const contextValue: NfcStatusContextType = {
    deviceStatus,
    isLoading,
    refreshDeviceStatus,
    isNfcAvailable,
    nfcFeaturesEnabled
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