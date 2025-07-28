import { openFGASync } from './sync';
import supabase from '../../supabase';
import type { SyncEvent } from '../../hooks/useOpenFGASyncMonitoring';

/**
 * Background processor for OpenFGA sync events
 */
export class OpenFGASyncProcessor {
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly PROCESS_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.startProcessing();
  }

  /**
   * Start the background sync processor
   */
  startProcessing() {
    if (this.processInterval) {
      return;
    }

    console.log('🔄 Starting OpenFGA sync processor...');
    this.processInterval = setInterval(() => {
      this.processPendingEvents();
    }, this.PROCESS_INTERVAL);
  }

  /**
   * Stop the background sync processor
   */
  stopProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('⏹️ Stopped OpenFGA sync processor');
    }
  }

  /**
   * Process pending sync events
   */
  private async processPendingEvents() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending events
      const { data: events, error } = await supabase.rpc('get_pending_sync_events', {
        p_limit: this.BATCH_SIZE,
      });

      if (error) {
        console.error('❌ Failed to fetch pending sync events:', error);
        return;
      }

      if (!events || events.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${events.length} pending sync events...`);

      // Process each event
      for (const event of events) {
        await this.processSyncEvent(event);
      }
    } catch (error) {
      console.error('❌ Error processing sync events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single sync event
   */
  private async processSyncEvent(event: any) {
    try {
      console.log(`🔄 Processing sync event: ${event.event_type} ${event.resource_type} ${event.resource_id}`);

      let success = false;

      switch (event.resource_type) {
        case 'artwork':
          success = await this.processArtworkEvent(event);
          break;
        case 'organization_user':
          success = await this.processOrganizationUserEvent(event);
          break;
        case 'appraisal':
          success = await this.processAppraisalEvent(event);
          break;
        case 'organization':
          success = await this.processOrganizationEvent(event);
          break;
        default:
          console.warn(`⚠️ Unknown resource type: ${event.resource_type}`);
          success = false;
      }

      // Mark event as processed
      await this.markEventProcessed(event.id, success ? 'success' : 'failed');

    } catch (error) {
      console.error(`❌ Failed to process sync event ${event.id}:`, error);
      await this.markEventProcessed(
        event.id, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Process artwork sync events
   */
  private async processArtworkEvent(event: any): Promise<boolean> {
    const { event_type, resource_id, organization_id, sync_data } = event;

    switch (event_type) {
      case 'create':
        if (organization_id) {
          await openFGASync.syncResourceCreation('artwork', resource_id, organization_id);
          return true;
        }
        break;

      case 'transfer':
        if (sync_data?.old_organization_id && sync_data?.new_organization_id) {
          // Remove from old org and add to new org
          await openFGASync.syncResourceDeletion('artwork', resource_id);
          await openFGASync.syncResourceCreation('artwork', resource_id, sync_data.new_organization_id);
          return true;
        }
        break;

      case 'delete':
        await openFGASync.syncResourceDeletion('artwork', resource_id);
        return true;
    }

    return false;
  }

  /**
   * Process organization user sync events
   */
  private async processOrganizationUserEvent(event: any): Promise<boolean> {
    const { event_type, user_id, organization_id, sync_data } = event;

    if (!user_id || !organization_id) {
      return false;
    }

    switch (event_type) {
      case 'user_add':
        if (sync_data?.role && sync_data?.is_active) {
          await openFGASync.syncUserRole(user_id, organization_id, sync_data.role);
          return true;
        }
        break;

      case 'user_role_update':
        if (sync_data?.new_role && sync_data?.is_active) {
          await openFGASync.syncUserRole(user_id, organization_id, sync_data.new_role);
          return true;
        } else if (!sync_data?.is_active) {
          await openFGASync.syncUserRemoval(user_id, organization_id);
          return true;
        }
        break;

      case 'user_remove':
        await openFGASync.syncUserRemoval(user_id, organization_id);
        return true;
    }

    return false;
  }

  /**
   * Process appraisal sync events
   */
  private async processAppraisalEvent(event: any): Promise<boolean> {
    const { event_type, resource_id, organization_id, user_id, sync_data } = event;

    switch (event_type) {
      case 'create':
        if (organization_id && user_id) {
          await openFGASync.syncResourceCreation('appraisal', resource_id, organization_id, user_id);
          return true;
        }
        break;

      case 'delete':
        await openFGASync.syncResourceDeletion('appraisal', resource_id);
        return true;
    }

    return false;
  }

  /**
   * Process organization sync events
   */
  private async processOrganizationEvent(event: any): Promise<boolean> {
    const { event_type, resource_id, user_id } = event;

    switch (event_type) {
      case 'create':
        await openFGASync.syncOrganizationAccess(resource_id);
        
        // If a user created the org, make them an admin
        if (user_id) {
          await openFGASync.syncUserRole(user_id, resource_id, 'admin');
        }
        
        return true;
    }

    return false;
  }

  /**
   * Mark sync event as processed
   */
  private async markEventProcessed(eventId: string, status: 'success' | 'failed', errorMessage?: string) {
    try {
      const { error } = await supabase.rpc('mark_sync_event_processed', {
        p_event_id: eventId,
        p_status: status,
        p_error_message: errorMessage || null,
      });

      if (error) {
        console.error('❌ Failed to mark sync event as processed:', error);
      } else {
        console.log(`✅ Marked sync event ${eventId} as ${status}`);
      }
    } catch (error) {
      console.error('❌ Error marking sync event as processed:', error);
    }
  }

  /**
   * Manually process all pending events (for testing/debugging)
   */
  async processAllPending(): Promise<void> {
    console.log('🔄 Manually processing all pending sync events...');
    await this.processPendingEvents();
  }
}

// Create a singleton instance
export const syncProcessor = new OpenFGASyncProcessor();

// Export functions to control the processor
export const startSyncProcessor = () => syncProcessor.startProcessing();
export const stopSyncProcessor = () => syncProcessor.stopProcessing();
export const processAllPendingEvents = () => syncProcessor.processAllPending();