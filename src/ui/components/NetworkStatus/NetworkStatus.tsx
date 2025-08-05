import React from 'react';
import { useNetworkStatus } from '../../utils/networkErrorHandler';
import { WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const isOnline = useNetworkStatus();
  
  if (isOnline) {
    return null; // Don't show anything when online
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fade-in">
      <div className="bg-warning text-warning-content px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <WifiOff className="w-5 h-5" />
        <span className="text-sm font-medium">No internet connection</span>
      </div>
    </div>
  );
};

export const NetworkStatusBanner: React.FC = () => {
  const isOnline = useNetworkStatus();
  
  if (isOnline) {
    return null;
  }
  
  return (
    <div className="bg-warning text-warning-content px-4 py-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>You are currently offline. Some features may not be available.</span>
      </div>
    </div>
  );
};