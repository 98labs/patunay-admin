#!/usr/bin/env node

import { OpenFgaClient } from '@openfga/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENFGA_API_URL = process.env.VITE_OPENFGA_API_URL || 'http://localhost:8080';

async function setupOpenFGA() {
  console.log('Setting up OpenFGA...');
  
  const client = new OpenFgaClient({
    apiUrl: OPENFGA_API_URL,
  });

  try {
    // Use existing store from environment or create new one
    let storeId = process.env.VITE_OPENFGA_STORE_ID;
    
    if (!storeId) {
      console.log('Creating OpenFGA store...');
      const { id: newStoreId } = await client.createStore({
        name: 'Patunay Admin Authorization',
      });
      storeId = newStoreId;
      console.log(`Store created with ID: ${storeId}`);
    } else {
      console.log(`Using existing store: ${storeId}`);
    }

    // Set the store ID for subsequent operations
    client.storeId = storeId;

    // Read the model file
    const modelPath = path.join(__dirname, '..', 'openfga', 'model.fga');
    const model = fs.readFileSync(modelPath, 'utf8');

    // Create the authorization model
    console.log('Creating authorization model...');
    const { authorization_model_id: modelId } = await client.writeAuthorizationModel({
      type_definitions: parseModel(model),
      schema_version: '1.1',
    });
    console.log(`Model created with ID: ${modelId}`);

    // Update .env file with the IDs
    console.log('\nAdd these values to your .env file:');
    console.log(`VITE_OPENFGA_STORE_ID=${storeId}`);
    console.log(`VITE_OPENFGA_MODEL_ID=${modelId}`);

    // Create initial data for testing
    console.log('\nCreating sample data...');
    await createSampleData(client);

    console.log('\nOpenFGA setup completed successfully!');
  } catch (error) {
    console.error('Error setting up OpenFGA:', error);
    process.exit(1);
  }
}

function parseModel(modelContent) {
  // Parse the OpenFGA model DSL into type definitions
  const typeDefinitions = [
    {
      type: 'user',
      relations: {}
    },
    {
      type: 'organization',
      relations: {
        super_admin: { this: {} },
        admin: { this: {} },
        staff: { this: {} },
        viewer: { this: {} },
        issuer: { this: {} },
        appraiser: { this: {} },
        member: {
          union: {
            child: [
              { computedUserset: { relation: 'admin' } },
              { computedUserset: { relation: 'staff' } },
              { computedUserset: { relation: 'viewer' } },
              { computedUserset: { relation: 'issuer' } },
              { computedUserset: { relation: 'appraiser' } }
            ]
          }
        }
      },
      metadata: {
        relations: {
          super_admin: { directly_related_user_types: [{ type: 'user' }] },
          admin: { directly_related_user_types: [{ type: 'user' }] },
          staff: { directly_related_user_types: [{ type: 'user' }] },
          viewer: { directly_related_user_types: [{ type: 'user' }] },
          issuer: { directly_related_user_types: [{ type: 'user' }] },
          appraiser: { directly_related_user_types: [{ type: 'user' }] }
        }
      }
    },
    {
      type: 'artwork',
      relations: {
        organization: { this: {} },
        can_view: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'member' } } },
        can_create: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'staff' } } }
            ]
          }
        },
        can_update: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'staff' } } }
            ]
          }
        },
        can_delete: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } }
      }
    },
    {
      type: 'appraisal',
      relations: {
        organization: { this: {} },
        creator: { this: {} },
        can_view: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'member' } } },
              { computedUserset: { relation: 'creator' } }
            ]
          }
        },
        can_create: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'staff' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'appraiser' } } }
            ]
          }
        },
        can_update: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'staff' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'appraiser' } } },
              { computedUserset: { relation: 'creator' } }
            ]
          }
        },
        can_delete: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } }
      }
    },
    {
      type: 'nfc_tag',
      relations: {
        organization: { this: {} },
        can_view: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'member' } } },
        can_attach: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'issuer' } } }
            ]
          }
        },
        can_detach: {
          union: {
            child: [
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
              { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'issuer' } } }
            ]
          }
        }
      }
    },
    {
      type: 'user_management',
      relations: {
        organization: { this: {} },
        can_manage_users: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
        can_invite_users: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
        can_remove_users: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } },
        can_update_roles: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } }
      }
    },
    {
      type: 'organization_settings',
      relations: {
        organization: { this: {} },
        can_view: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'member' } } },
        can_update: { tupleToUserset: { tupleset: { relation: 'organization' }, computedUserset: { relation: 'admin' } } }
      }
    },
    {
      type: 'global_system',
      relations: {
        super_user: { this: {} },
        can_access_all_organizations: { computedUserset: { relation: 'super_user' } },
        can_manage_system: { computedUserset: { relation: 'super_user' } }
      }
    }
  ];

  return typeDefinitions;
}

async function createSampleData(client) {
  // Create sample organization
  const orgId = 'org_123';
  const userId = 'user_456';
  
  await client.write({
    writes: [
      {
        user: `user:${userId}`,
        relation: 'admin',
        object: `organization:${orgId}`,
      },
      {
        user: `organization:${orgId}`,
        relation: 'organization',
        object: `user_management:${orgId}`,
      },
      {
        user: `organization:${orgId}`,
        relation: 'organization',
        object: `organization_settings:${orgId}`,
      },
    ],
  });
  
  console.log('Sample data created:');
  console.log(`- User ${userId} is admin of organization ${orgId}`);
}

// Run setup
setupOpenFGA();