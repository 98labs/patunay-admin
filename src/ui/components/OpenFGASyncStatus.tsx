import React, { useState } from 'react';
import { useOpenFGASyncMonitoring, useOpenFGASyncErrorHandler } from '../hooks/useOpenFGASyncMonitoring';

interface OpenFGASyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

const OpenFGASyncStatus: React.FC<OpenFGASyncStatusProps> = ({
  className = '',
  showDetails = false,
}) => {
  const {
    syncStats,
    isLoading,
    error,
    fetchSyncStats,
    retryFailedEvent,
  } = useOpenFGASyncMonitoring();
  
  const { syncErrors, clearSyncError } = useOpenFGASyncErrorHandler();
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const getSyncHealthStatus = () => {
    if (syncStats.failed > 0) return 'error';
    if (syncStats.pending > 5) return 'warning';
    return 'healthy';
  };

  const healthStatus = getSyncHealthStatus();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-red-600 text-lg mr-2">⚠️</span>
            <span className="font-medium text-red-800">OpenFGA Sync Error</span>
          </div>
          <button
            onClick={fetchSyncStats}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg ${getHealthColor()} ${className}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {healthStatus === 'healthy' ? '🟢' : healthStatus === 'warning' ? '🟡' : '🔴'}
            </span>
            <h3 className="font-medium">OpenFGA Sync Status</h3>
            {isLoading && <span className="ml-2 text-sm">Loading...</span>}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm underline opacity-75 hover:opacity-100"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">{syncStats.total}</div>
            <div className="opacity-75">Total</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">{syncStats.success}</div>
            <div className="opacity-75">Success</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-yellow-600">{syncStats.pending}</div>
            <div className="opacity-75">Pending</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-red-600">{syncStats.failed}</div>
            <div className="opacity-75">Failed</div>
          </div>
        </div>
      </div>

      {/* Sync Errors */}
      {syncErrors.length > 0 && (
        <div className="border-t p-4 bg-red-50">
          <h4 className="font-medium text-red-800 mb-2">Recent Sync Errors</h4>
          <div className="space-y-2">
            {syncErrors.map(error => (
              <div key={error.id} className="flex items-start justify-between text-sm">
                <div className="flex-1">
                  <p className="text-red-700">{error.message}</p>
                  <p className="text-red-500 text-xs">{error.timestamp.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => clearSyncError(error.id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Event List */}
      {isExpanded && (
        <div className="border-t bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Recent Sync Events</h4>
              <button
                onClick={fetchSyncStats}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Refresh
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {syncStats.recentEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">{getStatusIcon(event.status)}</span>
                    <div>
                      <div className="text-sm font-medium">
                        {event.event_type} {event.resource_type}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {event.resource_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(event.created_at)}
                    </div>
                  </div>
                  
                  {event.status === 'failed' && (
                    <button
                      onClick={() => retryFailedEvent(event.id)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ))}
              
              {syncStats.recentEvents.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No sync events found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenFGASyncStatus;