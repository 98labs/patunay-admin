#!/usr/bin/env node

import { OpenFgaClient } from '@openfga/sdk';

const OPENFGA_API_URL = process.env.VITE_OPENFGA_API_URL || 'http://localhost:8080';

async function checkHealth() {
  try {
    const response = await fetch(`${OPENFGA_API_URL}/healthz`);
    const data = await response.text();
    console.log('Health check:', data);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function listStores() {
  const client = new OpenFgaClient({
    apiUrl: OPENFGA_API_URL,
  });

  try {
    console.log('Listing existing stores...');
    const response = await client.listStores();
    console.log('Stores:', response.stores);
    return response.stores;
  } catch (error) {
    console.error('Failed to list stores:', error.message);
    return [];
  }
}

async function createStore() {
  const client = new OpenFgaClient({
    apiUrl: OPENFGA_API_URL,
  });

  try {
    console.log('Creating new store...');
    const { id: storeId } = await client.createStore({
      name: 'Patunay Admin Authorization',
    });
    console.log(`Store created with ID: ${storeId}`);
    return storeId;
  } catch (error) {
    console.error('Failed to create store:', error.message);
    if (error.responseData) {
      console.error('Response data:', error.responseData);
    }
    return null;
  }
}

async function createModel(storeId) {
  const client = new OpenFgaClient({
    apiUrl: OPENFGA_API_URL,
    storeId: storeId,
  });

  try {
    console.log('Creating authorization model...');
    
    // Simplified model for testing
    const { authorization_model_id: modelId } = await client.writeAuthorizationModel({
      type_definitions: [
        {
          type: 'user',
          relations: {},
        },
        {
          type: 'organization',
          relations: {
            member: {
              this: {}
            },
            admin: {
              this: {}
            }
          },
          metadata: {
            relations: {
              member: { directly_related_user_types: [{type: 'user'}] },
              admin: { directly_related_user_types: [{type: 'user'}] }
            }
          }
        }
      ],
      schema_version: '1.1',
    });
    
    console.log(`Model created with ID: ${modelId}`);
    return modelId;
  } catch (error) {
    console.error('Failed to create model:', error.message);
    if (error.responseData) {
      console.error('Response data:', error.responseData);
    }
    return null;
  }
}

async function main() {
  console.log('OpenFGA Setup Script');
  console.log('====================');
  console.log(`API URL: ${OPENFGA_API_URL}`);
  console.log('');

  // Check health
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.error('OpenFGA server is not healthy. Please check if it\'s running.');
    process.exit(1);
  }

  // List existing stores
  const stores = await listStores();
  
  let storeId;
  if (stores && stores.length > 0) {
    console.log(`Found ${stores.length} existing store(s).`);
    storeId = stores[0].id;
    console.log(`Using existing store: ${storeId}`);
  } else {
    // Create new store
    storeId = await createStore();
    if (!storeId) {
      console.error('Failed to create store. Exiting.');
      process.exit(1);
    }
  }

  // Create model
  const modelId = await createModel(storeId);
  if (!modelId) {
    console.error('Failed to create model. Exiting.');
    process.exit(1);
  }

  console.log('\n✅ Setup completed successfully!');
  console.log('\nAdd these values to your .env.local file:');
  console.log(`VITE_OPENFGA_STORE_ID=${storeId}`);
  console.log(`VITE_OPENFGA_MODEL_ID=${modelId}`);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});