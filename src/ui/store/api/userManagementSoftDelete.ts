import { api } from './baseApi';
import supabase from '../../supabase';
import { softDeleteUser as rpcSoftDeleteUser } from '../../supabase/rpc';

// Soft delete user (safer alternative to hard delete)
export const softDeleteUser = api.injectEndpoints({
  endpoints: (builder) => ({
    // Soft delete user (mark as deleted instead of removing)
    softDeleteUser: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            console.log('Soft deleting user:', userId);

            // Use the secure RPC function to soft delete user
            const { data, error } = await rpcSoftDeleteUser(userId);
            
            if (error) {
              console.error('Error soft deleting user:', error);
              throw new Error(error.message);
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
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Not authenticated');

            console.log('Restoring user:', userId);

            // Use regular client with proper permissions to restore user
            const { error: updateError } = await supabase
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