import { useState, useCallback } from 'react';
import { runSupabaseDiagnostic, type SupabaseDiagnosticReport } from '../utils/supabaseDiagnostic';

export const useSupabaseDiagnostic = () => {
  const [report, setReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const diagnosticReport = await runSupabaseDiagnostic();
      setReport(diagnosticReport);
      
      // Log to console for debugging
      console.log('Supabase Diagnostic Report:', diagnosticReport);
      
      // Check if there are any critical errors
      const hasErrors = diagnosticReport.results.some(r => r.status === 'error');
      if (hasErrors) {
        console.warn('Supabase diagnostic found errors. Check the report for details.');
      }
      
      return diagnosticReport;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during diagnostic');
      setError(error);
      console.error('Failed to run Supabase diagnostic:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    report,
    isRunning,
    error,
    runDiagnostic,
    clearReport,
    hasErrors: report ? report.summary.failed > 0 : false,
    hasWarnings: report ? report.summary.warnings > 0 : false,
  };
};