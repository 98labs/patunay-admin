import { useCallback } from 'react';
import {
  useCreateArtworkMutation,
  useUpdateArtworkMutation,
  useDeleteArtworkMutation,
  useUpsertAppraisalMutation,
  type CreateArtworkRequest,
  type UpdateArtworkRequest,
  type DeleteArtworkRequest,
  type AppraisalRequest,
} from '../store/api/artworkApi';
import { useResourceSync } from './useOpenFGASync';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../store/features/auth/authSlice';

/**
 * Enhanced artwork operations that automatically sync with OpenFGA
 */
export function useArtworkWithSync() {
  const { user } = useAppSelector(selectAuth);
  const {
    syncArtworkCreation,
    syncAppraisalCreation,
    syncResourceDeletion,
  } = useResourceSync();

  const [createArtworkMutation] = useCreateArtworkMutation();
  const [updateArtworkMutation] = useUpdateArtworkMutation();
  const [deleteArtworkMutation] = useDeleteArtworkMutation();
  const [upsertAppraisalMutation] = useUpsertAppraisalMutation();

  const createArtwork = useCallback(
    async (request: CreateArtworkRequest) => {
      try {
        // Create artwork in Supabase
        const result = await createArtworkMutation(request).unwrap();
        
        if (result.data?.id && user?.organization_id) {
          // Sync with OpenFGA
          await syncArtworkCreation(result.data.id, user.organization_id);
          console.log('✅ Artwork synced with OpenFGA:', result.data.id);
        }
        
        return result;
      } catch (error) {
        console.error('❌ Failed to create artwork or sync with OpenFGA:', error);
        throw error;
      }
    },
    [createArtworkMutation, syncArtworkCreation, user?.organization_id]
  );

  const updateArtwork = useCallback(
    async (request: UpdateArtworkRequest) => {
      try {
        // Update artwork in Supabase
        const result = await updateArtworkMutation(request).unwrap();
        
        // Note: For updates, we don't need to sync relationships unless ownership changes
        // If organization transfer is needed, we'd call syncResourceTransfer here
        
        return result;
      } catch (error) {
        console.error('❌ Failed to update artwork:', error);
        throw error;
      }
    },
    [updateArtworkMutation]
  );

  const deleteArtwork = useCallback(
    async (request: DeleteArtworkRequest) => {
      try {
        // Delete artwork in Supabase
        const result = await deleteArtworkMutation(request).unwrap();
        
        // Sync deletion with OpenFGA
        await syncResourceDeletion('artwork', request.id);
        console.log('✅ Artwork deletion synced with OpenFGA:', request.id);
        
        return result;
      } catch (error) {
        console.error('❌ Failed to delete artwork or sync with OpenFGA:', error);
        throw error;
      }
    },
    [deleteArtworkMutation, syncResourceDeletion]
  );

  const upsertAppraisal = useCallback(
    async (request: AppraisalRequest) => {
      try {
        // Create/update appraisal in Supabase
        const result = await upsertAppraisalMutation(request).unwrap();
        
        if (user?.organization_id && user?.id) {
          // Generate appraisal ID for sync (in real app, you'd get this from the response)
          const appraisalId = `appraisal_${request.artworkId}_${Date.now()}`;
          
          // Sync with OpenFGA
          await syncAppraisalCreation(appraisalId, user.organization_id, user.id);
          console.log('✅ Appraisal synced with OpenFGA:', appraisalId);
        }
        
        return result;
      } catch (error) {
        console.error('❌ Failed to upsert appraisal or sync with OpenFGA:', error);
        throw error;
      }
    },
    [upsertAppraisalMutation, syncAppraisalCreation, user?.organization_id, user?.id]
  );

  return {
    createArtwork,
    updateArtwork,
    deleteArtwork,
    upsertAppraisal,
  };
}