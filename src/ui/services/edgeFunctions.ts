import supabase from '../supabase';

const EDGE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: string;
}

async function callEdgeFunction<T = any>(
  functionName: string,
  body: any
): Promise<EdgeFunctionResponse<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Not authenticated' };
    }

    console.log(`Calling Edge Function: ${functionName}`, body);

    const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Edge function ${functionName} error:`, result);
      return { error: result.error || result.message || 'Request failed' };
    }

    return { data: result };
  } catch (error) {
    console.error(`Edge function ${functionName} error:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// User Management Functions
export const userManagementService = {
  async createUser(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    phone?: string;
    avatar_url?: string;
    permissions?: string[];
  }) {
    return callEdgeFunction('user-management', {
      action: 'create',
      data: userData,
    });
  },

  async updateUser(userId: string, userData: {
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    phone?: string;
    avatar_url?: string;
    is_active?: boolean;
    permissions?: string[];
  }) {
    return callEdgeFunction('user-management', {
      action: 'update',
      userId,
      data: userData,
    });
  },

  async disableUser(userId: string) {
    return callEdgeFunction('user-management', {
      action: 'disable',
      userId,
    });
  },

  async enableUser(userId: string) {
    return callEdgeFunction('user-management', {
      action: 'enable',
      userId,
    });
  },

  async deleteUser(userId: string) {
    return callEdgeFunction('user-management', {
      action: 'delete',
      userId,
    });
  },

  async listUsers(options?: {
    filters?: {
      role?: string;
      is_active?: boolean;
      search?: string;
    };
    pagination?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  }) {
    return callEdgeFunction('user-management', {
      action: 'list',
      filters: options?.filters,
      pagination: options?.pagination,
    });
  },

  async getUser(userId: string) {
    return callEdgeFunction('user-management', {
      action: 'get',
      userId,
    });
  },
};

// Role Management Functions
export const roleManagementService = {
  async assignRole(userId: string, role: string) {
    return callEdgeFunction('role-management', {
      action: 'assign',
      userId,
      role,
    });
  },

  async revokeRole(userId: string) {
    return callEdgeFunction('role-management', {
      action: 'revoke',
      userId,
    });
  },

  async grantPermission(userId: string, permission: string) {
    return callEdgeFunction('role-management', {
      action: 'grant-permission',
      userId,
      permission,
    });
  },

  async revokePermission(userId: string, permission: string) {
    return callEdgeFunction('role-management', {
      action: 'revoke-permission',
      userId,
      permission,
    });
  },

  async listPermissions(userId: string) {
    return callEdgeFunction('role-management', {
      action: 'list-permissions',
      userId,
    });
  },
};

// Export all services
export const edgeFunctions = {
  users: userManagementService,
  roles: roleManagementService,
};