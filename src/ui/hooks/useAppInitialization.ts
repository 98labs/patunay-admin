import { useEffect } from 'react';
import { startSyncProcessor } from '../services/openfga/syncProcessor';

/**
 * Hook to initialize application-wide services
 */
export function useAppInitialization() {
  useEffect(() => {
    // Initialize OpenFGA sync processor
    console.log('🚀 Initializing OpenFGA sync processor...');
    startSyncProcessor();

    // Cleanup on unmount
    return () => {
      // Note: We don't stop the processor on unmount as it should run continuously
      // If you need to stop it, call stopSyncProcessor() explicitly
    };
  }, []);
}