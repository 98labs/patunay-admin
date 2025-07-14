import { useNfc } from '../../hooks/useNfc';
import { NfcOperationStatus } from '../../store/nfc/types';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';

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

  // Column definitions for history table
  const historyColumns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Time',
      accessorKey: 'timestamp',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono">
          {formatTimestamp(getValue() as number)}
        </span>
      ),
    },
    {
      header: 'Operation',
      accessorKey: 'operation',
      cell: ({ getValue }) => {
        const operation = getValue() as string;
        return (
          <div className="flex items-center gap-2">
            <span>{getOperationIcon(operation)}</span>
            <span className="capitalize">{operation}</span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <div className="flex items-center gap-2">
            <span>{getOperationStatusIcon(status)}</span>
            <span className={`badge ${status === 'success' ? 'badge-success' : 'badge-error'}`}>
              {status}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Card UID',
      accessorKey: 'cardUid',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">
          {getValue() || '-'}
        </span>
      ),
    },
    {
      header: 'Data',
      id: 'data',
      cell: ({ row }) => (
        <span className="max-w-xs truncate text-xs">
          {row.original.data || row.original.error || '-'}
        </span>
      ),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <button 
          className="btn btn-ghost btn-xs"
          onClick={() => removeHistoryItem(row.original.id)}
        >
          ✕
        </button>
      ),
    },
  ], [removeHistoryItem]);

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

            <DataTable
              columns={historyColumns}
              data={operationHistory.slice(0, 10)}
              enablePagination={false}
              enableSorting={false}
              emptyMessage="No operations recorded yet"
            />
            {operationHistory.length > 10 && (
              <div className="text-center text-sm text-base-content/50 mt-4">
                Showing latest 10 of {operationHistory.length} operations
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NfcStatusDashboard;