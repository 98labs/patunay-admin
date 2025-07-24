import { OpenFgaClient } from '@openfga/sdk';

const OPENFGA_API_URL = import.meta.env.VITE_OPENFGA_API_URL || 'http://localhost:8080';
const OPENFGA_STORE_ID = import.meta.env.VITE_OPENFGA_STORE_ID || '';
const OPENFGA_AUTHORIZATION_MODEL_ID = import.meta.env.VITE_OPENFGA_MODEL_ID || '';

export const openfgaClient = new OpenFgaClient({
  apiUrl: OPENFGA_API_URL,
  storeId: OPENFGA_STORE_ID,
  authorizationModelId: OPENFGA_AUTHORIZATION_MODEL_ID,
});

export interface OpenFGATuple {
  user: string;
  relation: string;
  object: string;
}

export interface CheckPermissionParams {
  user: string;
  relation: string;
  object: string;
}

export class OpenFGAService {
  private client: OpenFgaClient;

  constructor() {
    this.client = openfgaClient;
  }

  /**
   * Check if a user has a specific permission
   */
  async check(params: CheckPermissionParams): Promise<boolean> {
    try {
      const { allowed } = await this.client.check({
        user: params.user,
        relation: params.relation,
        object: params.object,
      });
      return allowed;
    } catch (error) {
      console.error('OpenFGA check error:', error);
      return false;
    }
  }

  /**
   * Write authorization tuples (grant permissions)
   */
  async write(tuples: OpenFGATuple[]): Promise<void> {
    try {
      await this.client.write({
        writes: tuples.map(t => ({
          user: t.user,
          relation: t.relation,
          object: t.object,
        })),
      });
    } catch (error) {
      console.error('OpenFGA write error:', error);
      throw error;
    }
  }

  /**
   * Delete authorization tuples (revoke permissions)
   */
  async delete(tuples: OpenFGATuple[]): Promise<void> {
    try {
      await this.client.write({
        deletes: tuples.map(t => ({
          user: t.user,
          relation: t.relation,
          object: t.object,
        })),
      });
    } catch (error) {
      console.error('OpenFGA delete error:', error);
      throw error;
    }
  }

  /**
   * List all objects a user has access to with a specific relation
   */
  async listObjects(user: string, relation: string, type: string): Promise<string[]> {
    try {
      const response = await this.client.listObjects({
        user,
        relation,
        type,
      });
      return response.objects;
    } catch (error) {
      console.error('OpenFGA listObjects error:', error);
      return [];
    }
  }

  /**
   * List all users who have a specific relation to an object
   */
  async listUsers(object: string, relation: string, userFilter?: { type: string }): Promise<{ users: string[] }> {
    try {
      const response = await this.client.listUsers({
        object: { type: object.split(':')[0], id: object.split(':')[1] },
        relation,
        userFilter: userFilter ? [userFilter] : undefined,
      });
      return response;
    } catch (error) {
      console.error('OpenFGA listUsers error:', error);
      return { users: [] };
    }
  }

  /**
   * Batch check multiple permissions
   */
  async batchCheck(checks: CheckPermissionParams[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // OpenFGA doesn't have native batch check, so we'll use Promise.all
    const promises = checks.map(async (check) => {
      const key = `${check.user}#${check.relation}@${check.object}`;
      const allowed = await this.check(check);
      results.set(key, allowed);
    });

    await Promise.all(promises);
    return results;
  }
}

export const openFGA = new OpenFGAService();