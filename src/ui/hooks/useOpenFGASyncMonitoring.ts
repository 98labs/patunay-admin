import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabase';

export interface SyncEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource_id: string;
  organization_id?: string;
  user_id?: string;
  sync_data?: any;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
  created_at: string;
  synced_at?: string;
}

export interface SyncStats {
  total: number;
  pending: number;
  success: number;
  failed: number;
  recentEvents: SyncEvent[];
}

/**
 * Hook for monitoring OpenFGA synchronization status
 */
export function useOpenFGASyncMonitoring() {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    total: 0,
    pending: 0,
    success: 0,
    failed: 0,
    recentEvents: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get overall stats
      const { data: allEvents, error: statsError } = await supabase
        .from('openfga_sync_events')
        .select('status')
        .order('created_at', { ascending: false });

      if (statsError) throw statsError;

      // Get recent events (last 50)
      const { data: recentEvents, error: recentError } = await supabase
        .from('openfga_sync_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (recentError) throw recentError;

      // Calculate stats
      const stats = {
        total: allEvents?.length || 0,
        pending: allEvents?.filter(e => e.status === 'pending').length || 0,
        success: allEvents?.filter(e => e.status === 'success').length || 0,
        failed: allEvents?.filter(e => e.status === 'failed').length || 0,
        recentEvents: recentEvents || [],
      };

      setSyncStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markEventProcessed = useCallback(
    async (eventId: string, status: 'success' | 'failed', errorMessage?: string) => {
      try {
        const { error } = await supabase.rpc('mark_sync_event_processed', {
          p_event_id: eventId,
          p_status: status,
          p_error_message: errorMessage || null,
        });

        if (error) throw error;

        // Refresh stats after marking event
        await fetchSyncStats();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to mark event as processed');
      }
    },
    [fetchSyncStats]
  );

  const getPendingEvents = useCallback(async (limit = 100) => {
    try {
      const { data, error } = await supabase.rpc('get_pending_sync_events', {
        p_limit: limit,
      });

      if (error) throw error;

      return data || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch pending events');
    }
  }, []);

  const retryFailedEvent = useCallback(
    async (eventId: string) => {
      try {
        // Reset event status to pending for retry
        const { error } = await supabase
          .from('openfga_sync_events')
          .update({
            status: 'pending',
            error_message: null,
            synced_at: null,
          })
          .eq('id', eventId);

        if (error) throw error;

        // Refresh stats
        await fetchSyncStats();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to retry event');
      }
    },
    [fetchSyncStats]
  );

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    fetchSyncStats();
    const interval = setInterval(fetchSyncStats, 30000);
    return () => clearInterval(interval);
  }, [fetchSyncStats]);

  return {
    syncStats,
    isLoading,
    error,
    fetchSyncStats,
    markEventProcessed,
    getPendingEvents,
    retryFailedEvent,
  };
}

/**
 * Hook for handling OpenFGA sync errors with user notifications
 */
export function useOpenFGASyncErrorHandler() {
  const [syncErrors, setSyncErrors] = useState<Array<{
    id: string;
    message: string;
    timestamp: Date;
    eventId?: string;
  }>>([]);

  const addSyncError = useCallback((message: string, eventId?: string) => {
    const error = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: new Date(),
      eventId,
    };
    
    setSyncErrors(prev => [error, ...prev.slice(0, 9)]); // Keep last 10 errors
    
    // Auto-remove error after 10 seconds
    setTimeout(() => {
      setSyncErrors(prev => prev.filter(e => e.id !== error.id));
    }, 10000);
  }, []);

  const clearSyncError = useCallback((errorId: string) => {
    setSyncErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearAllSyncErrors = useCallback(() => {
    setSyncErrors([]);
  }, []);

  return {
    syncErrors,
    addSyncError,
    clearSyncError,
    clearAllSyncErrors,
  };
}