import React, { useState, useEffect } from 'react';
import { useNfcStatus } from '../../context/NfcStatusContext';
import { useLogger } from '../../hooks/useLogger';

interface NfcWarningBannerProps {
  className?: string;
}

export const NfcWarningBanner: React.FC<NfcWarningBannerProps> = ({ className = '' }) => {
  const { isNfcAvailable, deviceStatus, refreshDeviceStatus, isLoading, lastManualRefreshFailed, clearManualRefreshFailed } = useNfcStatus();
  const logger = useLogger('NfcWarningBanner');
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when NFC status changes or manual refresh fails
  useEffect(() => {
    if (isNfcAvailable) {
      setIsDismissed(false);
    }
    // Force show banner when manual refresh fails
    if (lastManualRefreshFailed) {
      setIsDismissed(false);
      // Auto-clear the manual refresh failed state after 5 seconds
      const timer = setTimeout(() => {
        clearManualRefreshFailed();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNfcAvailable, lastManualRefreshFailed, clearManualRefreshFailed]);

  const handleRefresh = () => {
    logger.info('User clicked refresh NFC device status');
    refreshDeviceStatus();
  };

  const handleDismiss = () => {
    logger.info('User dismissed NFC warning banner');
    setIsDismissed(true);
    // Also clear the manual refresh failed state when dismissing
    if (lastManualRefreshFailed) {
      clearManualRefreshFailed();
    }
  };

  // Log current status for debugging
  console.log('NfcWarningBanner status:', { isNfcAvailable, isLoading, deviceStatus });

  // Show banner if:
  // 1. NFC is not available and not dismissed
  // 2. Manual refresh failed (even if previously dismissed)
  const shouldShowBanner = (!isNfcAvailable && !isDismissed) || lastManualRefreshFailed;
  
  // Don't show banner if still loading
  if (isLoading || !shouldShowBanner) {
    return null;
  }

  const getStatusMessage = () => {
    if (!deviceStatus.initialized) {
      return 'NFC service failed to initialize';
    }
    if (deviceStatus.readers.length === 0) {
      return 'NFC device NOT found';
    }
    return 'NFC device not available';
  };

  const getDetailMessage = () => {
    if (!deviceStatus.initialized) {
      return 'Please check your NFC reader connection and restart the application.';
    }
    return 'Please connect an NFC reader (e.g., ACS ACR122U PICC Interface) to enable NFC features.';
  };

  return (
    <div className={`bg-warning text-warning-content p-4 border-l-4 border-warning ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">NFC Not Available</h3>
            <p className="text-sm opacity-90 mt-1">{getDetailMessage()}</p>
            {deviceStatus.readers.length > 0 && (
              <p className="text-xs opacity-75 mt-1">
                Detected readers: {deviceStatus.readers.join(', ')}
              </p>
            )}
            <p className="text-xs opacity-75 mt-1">
              Debug: available={deviceStatus.available ? 'true' : 'false'}, initialized={deviceStatus.initialized ? 'true' : 'false'}, readers={deviceStatus.readers.length}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-sm btn-ghost hover:bg-warning-content hover:bg-opacity-20"
            title="Refresh NFC device status"
            aria-label="Refresh NFC device status"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isLoading ? 'Checking...' : 'Refresh'}
          </button>
          <button
            onClick={handleDismiss}
            className="btn btn-sm btn-ghost hover:bg-warning-content hover:bg-opacity-20"
            title="Dismiss warning"
            aria-label="Dismiss NFC warning"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NfcWarningBanner;