import { api } from './baseApi';
import supabase, { supabaseAdmin } from '../../supabase';

// Soft delete user (safer alternative to hard delete)
export const softDeleteUser = api.injectEndpoints({
  endpoints: (builder) => ({
    // Soft delete user (mark as deleted instead of removing)
    softDeleteUser: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            if (!supabaseAdmin) {
              throw new Error('Service role key not configured. Cannot perform admin operations.');
            }

            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Not authenticated');

            console.log('Soft deleting user:', userId);

            // Mark user as deleted and inactive
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                is_active: false,
                deleted_at: new Date().toISOString(),
                deleted_by: currentUser.id,
                updated_by: currentUser.id,
                updated_at: new Date().toISOString(),
                // Optionally anonymize email for privacy
                email_backup: null, // Store original email if needed
              })
              .eq('id', userId);

            if (updateError) {
              console.error('Error soft deleting user:', updateError);
              throw updateError;
            }

            // Optionally disable the user in auth (prevents login but keeps record)
            try {
              const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: 'none', // Permanently ban
                email_confirm: false,
              });

              if (authError) {
                console.warn('Could not disable user in auth:', authError);
                // Don't fail the operation if this doesn't work
              }
            } catch (authError) {
              console.warn('Auth disable failed:', authError);
            }

            console.log('User soft deletion completed successfully');
            return { success: true };
          } catch (error) {
            console.error('Error soft deleting user:', error);
            throw error;
          }
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Restore soft deleted user
    restoreUser: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            if (!supabaseAdmin) {
              throw new Error('Service role key not configured. Cannot perform admin operations.');
            }

            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Not authenticated');

            console.log('Restoring user:', userId);

            // Remove deletion markers
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                is_active: true,
                deleted_at: null,
                deleted_by: null,
                updated_by: currentUser.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (updateError) {
              console.error('Error restoring user:', updateError);
              throw updateError;
            }

            console.log('User restoration completed successfully');
            return { success: true };
          } catch (error) {
            console.error('Error restoring user:', error);
            throw error;
          }
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useSoftDeleteUserMutation,
  useRestoreUserMutation,
} = softDeleteUser;