import { useEffect, useState } from 'react';
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
import supabase from '../../supabase';

export const AuthDebug = () => {
  const { user, isAdmin, isStaff, isAuthenticated, isLoading } = useAuth();
  const [jwtData, setJwtData] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [permissionsData, setPermissionsData] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Get session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      // Decode JWT
      if (currentSession?.access_token) {
        try {
          // Parse JWT payload (base64 decode)
          const payload = JSON.parse(
            atob(currentSession.access_token.split('.')[1])
          );
          setJwtData(payload);
        } catch (error) {
          console.error('Error decoding JWT:', error);
        }
      }
      
      // Get profile data directly
      if (currentSession?.user?.id) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
            
          setProfileData({ profile, profileError });
          
          // Get permissions
          const { data: permissions, error: permError } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', currentSession.user.id);
            
          setPermissionsData({ permissions, permError });
        } catch (error) {
          console.error('Error fetching profile/permissions:', error);
        }
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <div className="p-4 bg-base-200 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Auth Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Auth Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Is Staff:</strong> {isStaff ? 'Yes' : 'No'}
        </div>
      </div>
      
      {user && (
        <div className="mt-4">
          <h4 className="font-semibold">User Profile Data:</h4>
          <pre className="text-xs bg-base-300 p-2 rounded overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.email,
              role: user.role,
              permissions: user.permissions,
              is_active: user.is_active
            }, null, 2)}
          </pre>
        </div>
      )}
      
      {jwtData && (
        <div className="mt-4">
          <h4 className="font-semibold">JWT Payload:</h4>
          <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(jwtData, null, 2)}
          </pre>
        </div>
      )}
      
      {session && (
        <div className="mt-4">
          <h4 className="font-semibold">Session Info:</h4>
          <pre className="text-xs bg-base-300 p-2 rounded overflow-auto">
            {JSON.stringify({
              user_id: session.user?.id,
              email: session.user?.email,
              role: session.user?.role,
              expires_at: session.expires_at
            }, null, 2)}
          </pre>
        </div>
      )}
      
      {profileData && (
        <div className="mt-4">
          <h4 className="font-semibold">Direct Profile Query:</h4>
          <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}
      
      {permissionsData && (
        <div className="mt-4">
          <h4 className="font-semibold">Direct Permissions Query:</h4>
          <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(permissionsData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;