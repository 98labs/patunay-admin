import { useState } from 'react';
import { runSupabaseDiagnostic, type SupabaseDiagnosticReport } from '../../utils/supabaseDiagnostic';

export const SupabaseDiagnostic = () => {
  const [report, setReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await runSupabaseDiagnostic();
      setReport(diagnosticReport);
    } catch (error) {
      console.error('Failed to run diagnostic:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDetails = (index: number) => {
    setShowDetails(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Supabase Connection Diagnostic</h2>
        
        <div className="space-y-4">
          <p className="text-sm opacity-70">
            Run a comprehensive diagnostic to check your Supabase connection, authentication, and database access.
          </p>

          <button
            className={`btn btn-primary ${isRunning ? 'loading' : ''}`}
            onClick={runDiagnostic}
            disabled={isRunning}
          >
            {isRunning ? 'Running Diagnostic...' : 'Run Diagnostic'}
          </button>

          {report && (
            <div className="space-y-4 mt-6">
              {/* Environment Info */}
              <div className="alert alert-info">
                <div>
                  <h3 className="font-bold">Environment</h3>
                  <p className="text-sm">URL: {report.environment.url}</p>
                  <p className="text-sm">
                    Anon Key: {report.environment.hasAnonKey ? '✓ Present' : '✗ Missing'}
                  </p>
                  <p className="text-sm">
                    Service Role Key: {report.environment.hasServiceRoleKey ? '✓ Present' : '✗ Missing'}
                  </p>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Test Results</h3>
                {report.results.map((result, index) => (
                  <div key={index} className="collapse collapse-arrow bg-base-100">
                    <input
                      type="checkbox"
                      checked={showDetails[index] || false}
                      onChange={() => toggleDetails(index)}
                    />
                    <div className="collapse-title">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{result.step}</div>
                          <div className="text-sm opacity-70">{result.message}</div>
                        </div>
                      </div>
                    </div>
                    {result.details && (
                      <div className="collapse-content">
                        <pre className="text-xs bg-base-200 p-3 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Passed</div>
                  <div className="stat-value text-success">{report.summary.passed}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Failed</div>
                  <div className="stat-value text-error">{report.summary.failed}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Warnings</div>
                  <div className="stat-value text-warning">{report.summary.warnings}</div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-sm opacity-50">
                Generated at: {new Date(report.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};