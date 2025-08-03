import { describe, it, expect, vi } from 'vitest';
import { userManagementService, roleManagementService } from './edgeFunctions';

// Mock supabase
vi.mock('../supabase', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token'
          }
        }
      })
    }
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('Edge Functions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('User Management Service', () => {
    it('should create a user', async () => {
      const mockResponse = { id: '123', email: 'test@example.com' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await userManagementService.createUser({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'staff'
      });

      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user-management'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          }),
          body: expect.stringContaining('"action":"create"')
        })
      );
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Insufficient permissions' })
      });

      const result = await userManagementService.createUser({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.error).toBe('Insufficient permissions');
      expect(result.data).toBeUndefined();
    });

    it('should list users with filters', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: 'admin' },
        { id: '2', email: 'user2@example.com', role: 'staff' }
      ];
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers, count: 2 })
      });

      const result = await userManagementService.listUsers({
        filters: { role: 'admin' },
        pagination: { page: 1, pageSize: 10 }
      });

      expect(result.data).toEqual({ data: mockUsers, count: 2 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user-management'),
        expect.objectContaining({
          body: expect.stringContaining('"role":"admin"')
        })
      );
    });
  });

  describe('Role Management Service', () => {
    it('should assign a role', async () => {
      const mockResponse = { id: '123', role: 'admin' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await roleManagementService.assignRole('123', 'admin');

      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/role-management'),
        expect.objectContaining({
          body: expect.stringContaining('"action":"assign"')
        })
      );
    });

    it('should grant permissions', async () => {
      const mockResponse = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await roleManagementService.grantPermission('123', 'users.create');

      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/role-management'),
        expect.objectContaining({
          body: expect.stringContaining('"permission":"users.create"')
        })
      );
    });

    it('should list permissions', async () => {
      const mockPermissions = {
        role: 'admin',
        defaultPermissions: ['users.read', 'users.write'],
        explicitPermissions: [{ permission: 'system.admin' }],
        allPermissions: ['users.read', 'users.write', 'system.admin']
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPermissions
      });

      const result = await roleManagementService.listPermissions('123');

      expect(result.data).toEqual(mockPermissions);
    });
  });
});