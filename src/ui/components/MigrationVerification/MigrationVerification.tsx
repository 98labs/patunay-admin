import React, { useState } from 'react';
import supabase from '../../supabase';

interface VerificationResult {
  check: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export const MigrationVerification: React.FC = () => {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runVerification = async () => {
    setIsRunning(true);
    const checks: VerificationResult[] = [];

    try {
      // Check 1: Organizations table exists
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);
      
      checks.push({
        check: 'Organizations Table',
        status: orgError ? 'error' : 'success',
        message: orgError ? orgError.message : 'Table exists and accessible',
        details: { count: orgs?.length || 0 }
      });

      // Check 2: Organization Users table exists
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select('count')
        .limit(1);
      
      checks.push({
        check: 'Organization Users Table',
        status: orgUsersError ? 'error' : 'success',
        message: orgUsersError ? orgUsersError.message : 'Table exists and accessible',
        details: { count: orgUsers?.length || 0 }
      });

      // Check 3: Cross Org Permissions table exists
      const { data: crossOrg, error: crossOrgError } = await supabase
        .from('cross_org_permissions')
        .select('count')
        .limit(1);
      
      checks.push({
        check: 'Cross Org Permissions Table',
        status: crossOrgError ? 'error' : 'success',
        message: crossOrgError ? crossOrgError.message : 'Table exists and accessible',
        details: { count: crossOrg?.length || 0 }
      });

      // Check 4: Role Permissions table exists
      const { data: rolePerms, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('count')
        .limit(1);
      
      checks.push({
        check: 'Role Permissions Table',
        status: rolePermsError ? 'error' : 'success',
        message: rolePermsError ? rolePermsError.message : 'Table exists and accessible',
        details: { count: rolePerms?.length || 0 }
      });

      // Check 5: Profiles table has new columns
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .limit(1);
      
      checks.push({
        check: 'Profiles Table Updated',
        status: profilesError ? 'error' : 'success',
        message: profilesError ? profilesError.message : 'New columns exist (role, organization_id)',
        details: profiles?.[0] || null
      });

      // Check 6: Artworks table has organization_id
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('organization_id')
        .limit(1);
      
      checks.push({
        check: 'Artworks Table Updated',
        status: artworksError ? 'error' : 'success',
        message: artworksError ? artworksError.message : 'organization_id column exists',
        details: artworks?.[0] || null
      });

      // Check 7: Default organization exists
      const { data: defaultOrg, error: defaultOrgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', 'Default Organization')
        .single();
      
      checks.push({
        check: 'Default Organization Created',
        status: defaultOrgError ? 'error' : 'success',
        message: defaultOrgError ? 'Default organization not found' : 'Default organization exists',
        details: defaultOrg || null
      });

      // Check 8: Role permissions data exists
      const { data: rolePermissions, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('count');
      
      checks.push({
        check: 'Role Permissions Data',
        status: rolePermissionsError ? 'error' : 'success',
        message: rolePermissionsError ? rolePermissionsError.message : `${rolePermissions?.length || 0} role permissions loaded`,
        details: { count: rolePermissions?.length || 0 }
      });

      // Check 9: Test RPC functions
      try {
        const { data: rpcTest, error: rpcError } = await supabase
          .rpc('user_has_permission', {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_permission: 'test_permission'
          });
        
        checks.push({
          check: 'RPC Functions Available',
          status: rpcError ? 'error' : 'success',
          message: rpcError ? 'RPC functions not accessible' : 'RPC functions working',
          details: { result: rpcTest }
        });
      } catch (error) {
        checks.push({
          check: 'RPC Functions Available',
          status: 'error',
          message: 'Error testing RPC functions',
          details: { error: error.message }
        });
      }

    } catch (error) {
      checks.push({
        check: 'General Connection',
        status: 'error',
        message: `Connection error: ${error.message}`,
        details: error
      });
    }

    setResults(checks);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Migration Verification</h2>
        <p className="text-gray-600 mb-6">
          This tool verifies that the multi-tenant RBAC + ABAC schema migration was applied successfully.
        </p>

        <button
          onClick={runVerification}
          disabled={isRunning}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md mb-6"
        >
          {isRunning ? 'Running Verification...' : 'Run Verification'}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Verification Results</h3>
            
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.check}</h4>
                  <span className={`text-lg ${getStatusColor(result.status)}`}>
                    {getStatusIcon(result.status)}
                  </span>
                </div>
                
                <p className={`text-sm ${getStatusColor(result.status)}`}>
                  {result.message}
                </p>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer">
                      Show details
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="flex space-x-4 text-sm">
                <span className="text-green-600">
                  ✅ Passed: {results.filter(r => r.status === 'success').length}
                </span>
                <span className="text-red-600">
                  ❌ Failed: {results.filter(r => r.status === 'error').length}
                </span>
                <span className="text-yellow-600">
                  ⏳ Pending: {results.filter(r => r.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};