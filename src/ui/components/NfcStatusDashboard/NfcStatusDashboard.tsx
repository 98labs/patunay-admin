import { useNfc } from '../../hooks/useNfc';
import { NfcOperationStatus } from '../../store/nfc/types';

interface NfcStatusDashboardProps {
  className?: string;
  showHistory?: boolean;
  showStats?: boolean;
}

const NfcStatusDashboard = ({ 
  className = '', 
  showHistory = true, 
  showStats = true 
}: NfcStatusDashboardProps) => {
  const {
    nfcSummary,
    operationHistory,
    operationStats,
    clearHistory,
    removeHistoryItem
  } = useNfc();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready': return 'badge-success';
      case 'active': return 'badge-warning';
      case 'error': return 'badge-error';
      case 'disconnected': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'read': return '📖';
      case 'write': return '✏️';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOperationStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">NFC Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat">
              <div className="stat-title">Connection</div>
              <div className="stat-value text-lg flex items-center gap-2">
                <span className={`badge ${getStatusBadgeColor(nfcSummary.connection.state)}`}>
                  {nfcSummary.connection.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {nfcSummary.connection.readerName && (
                <div className="stat-desc">{nfcSummary.connection.readerName}</div>
              )}
            </div>

            <div className="stat">
              <div className="stat-title">Operation</div>
              <div className="stat-value text-lg">
                {nfcSummary.operation.isActive ? (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="capitalize">{nfcSummary.operation.type}</span>
                  </div>
                ) : (
                  <span className="text-base-content/50">Idle</span>
                )}
              </div>
              {nfcSummary.operation.progress > 0 && (
                <div className="stat-desc">
                  <progress 
                    className="progress progress-primary w-full" 
                    value={nfcSummary.operation.progress} 
                    max="100"
                  ></progress>
                </div>
              )}
            </div>

            <div className="stat">
              <div className="stat-title">Card</div>
              <div className="stat-value text-lg">
                {nfcSummary.card.isPresent ? (
                  <span className="badge badge-success">Detected</span>
                ) : (
                  <span className="badge badge-ghost">None</span>
                )}
              </div>
              {nfcSummary.card.uid && (
                <div className="stat-desc font-mono text-xs">{nfcSummary.card.uid}</div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {nfcSummary.error && (
            <div className="alert alert-error mt-4">
              <span>{nfcSummary.error.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Operation Statistics</h2>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="stat-title">Total Operations</div>
                <div className="stat-value text-primary">{operationStats.total}</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-success">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="stat-title">Successful</div>
                <div className="stat-value text-success">{operationStats.successful}</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-error">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="stat-title">Failed</div>
                <div className="stat-value text-error">{operationStats.failed}</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-info">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="stat-title">Success Rate</div>
                <div className="stat-value text-info">{operationStats.successRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operation History */}
      {showHistory && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Operation History</h2>
              {operationHistory.length > 0 && (
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={clearHistory}
                >
                  Clear History
                </button>
              )}
            </div>

            {operationHistory.length === 0 ? (
              <div className="text-center text-base-content/50 py-8">
                No operations recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Operation</th>
                      <th>Status</th>
                      <th>Card UID</th>
                      <th>Data</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationHistory.slice(0, 10).map((entry) => (
                      <tr key={entry.id}>
                        <td className="text-xs font-mono">
                          {formatTimestamp(entry.timestamp)}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span>{getOperationIcon(entry.operation)}</span>
                            <span className="capitalize">{entry.operation}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span>{getOperationStatusIcon(entry.status)}</span>
                            <span className={`badge ${entry.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                              {entry.status}
                            </span>
                          </div>
                        </td>
                        <td className="font-mono text-xs">
                          {entry.cardUid || '-'}
                        </td>
                        <td className="max-w-xs truncate text-xs">
                          {entry.data || entry.error || '-'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={() => removeHistoryItem(entry.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {operationHistory.length > 10 && (
                  <div className="text-center text-sm text-base-content/50 mt-4">
                    Showing latest 10 of {operationHistory.length} operations
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NfcStatusDashboard;