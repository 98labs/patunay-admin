import React from 'react';
import { useNfcStatus } from '../../context/NfcStatusContext';
import { useLogger } from '../../hooks/useLogger';

interface NfcStatusIndicatorProps {
  className?: string;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export const NfcStatusIndicator: React.FC<NfcStatusIndicatorProps> = ({ 
  className = '', 
  showRefreshButton = true,
  compact = false 
}) => {
  const { isNfcAvailable, deviceStatus, refreshDeviceStatus, isLoading, nfcFeaturesEnabled } = useNfcStatus();
  const logger = useLogger('NfcStatusIndicator');

  const handleRefresh = () => {
    logger.info('User clicked refresh NFC device status from indicator');
    refreshDeviceStatus();
  };

  // Log current status for debugging only in development
  if (import.meta.env.MODE === 'development' && import.meta.env.VITE_DEBUG_NFC === 'true') {
    console.log('NfcStatusIndicator status:', { isNfcAvailable, nfcFeaturesEnabled, deviceStatus, isLoading });
  }

  const getStatusColor = () => {
    if (isLoading) return 'bg-base-content/50';
    if (isNfcAvailable && nfcFeaturesEnabled) return 'bg-success';
    if (deviceStatus.readers.length > 0 && !nfcFeaturesEnabled) return 'bg-warning';
    return 'bg-error';
  };

  const getStatusTextColor = () => {
    if (isLoading) return 'text-base-content/70';
    if (isNfcAvailable && nfcFeaturesEnabled) return 'text-success';
    if (deviceStatus.readers.length > 0 && !nfcFeaturesEnabled) return 'text-warning';
    return 'text-error';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (isNfcAvailable && nfcFeaturesEnabled) return 'NFC Ready';
    if (deviceStatus.readers.length > 0 && !nfcFeaturesEnabled) return 'NFC Initializing';
    return 'NFC Not Available';
  };

  const getDetailText = () => {
    if (isLoading) return 'Checking NFC device status';
    if (isNfcAvailable && nfcFeaturesEnabled) {
      return `Connected: ${deviceStatus.readers.join(', ')}`;
    }
    if (deviceStatus.readers.length > 0 && !nfcFeaturesEnabled) {
      return `Found: ${deviceStatus.readers.join(', ')} (initializing...)`;
    }
    if (!deviceStatus.initialized) {
      return 'NFC service failed to initialize';
    }
    return 'No NFC readers detected';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} title={getDetailText()} />
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-base-200 rounded"
            title="Refresh NFC status"
            aria-label="Refresh NFC status"
          >
            <svg
              className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  const isNfcNotAvailable = !isLoading && !isNfcAvailable && !nfcFeaturesEnabled;

  return (
    <div className={`p-3 rounded-lg bg-base-200 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2 flex-1">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          {isNfcNotAvailable ? (
            <div className="flex-1">
              <span className={`text-sm font-medium ${getStatusTextColor()}`}>{getStatusText()}</span>
              {!deviceStatus.initialized && (
                <p className="text-xs text-base-content opacity-70 mt-1">NFC service failed to initialize</p>
              )}
              {deviceStatus.initialized && deviceStatus.readers.length === 0 && (
                <p className="text-xs text-base-content opacity-70 mt-1">No NFC readers detected</p>
              )}
            </div>
          ) : (
            <>
              <span className={`text-sm font-medium ${getStatusTextColor()}`}>{getStatusText()}</span>
              <div className="flex-1">
                <p className="text-xs text-base-content opacity-70">{getDetailText()}</p>
              </div>
            </>
          )}
        </div>

        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-sm btn-outline btn-primary btn-circle"
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
          </button>
        )}
      </div>
    </div>
  );
};

export default NfcStatusIndicator;