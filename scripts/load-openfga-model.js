#!/usr/bin/env node

import { OpenFgaClient } from '@openfga/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENFGA_API_URL = process.env.VITE_OPENFGA_API_URL || 'http://localhost:8080';
const STORE_ID = process.env.VITE_OPENFGA_STORE_ID || '01K0XC5E2R607K3SFSG8Q2CZW9';

async function loadModel() {
  const client = new OpenFgaClient({
    apiUrl: OPENFGA_API_URL,
    storeId: STORE_ID,
  });

  try {
    // Read the model JSON
    const modelPath = path.join(__dirname, 'openfga-model.json');
    const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));

    console.log('Loading OpenFGA model...');
    const { authorization_model_id: modelId } = await client.writeAuthorizationModel(modelData);
    
    console.log(`✅ Model loaded successfully!`);
    console.log(`Model ID: ${modelId}`);
    console.log(`\nUpdate your .env.local file:`);
    console.log(`VITE_OPENFGA_MODEL_ID=${modelId}`);

    // Create sample data
    console.log('\nCreating sample data...');
    await client.write({
      writes: [
        {
          user: 'user:test_admin',
          relation: 'admin',
          object: 'organization:test_org',
        },
        {
          user: 'organization:test_org',
          relation: 'organization',
          object: 'user_management:test_org',
        },
        {
          user: 'organization:test_org',
          relation: 'organization',
          object: 'organization_settings:test_org',
        },
      ],
    });
    
    console.log('Sample data created successfully!');

    // Test a permission check
    console.log('\nTesting permission check...');
    const { allowed } = await client.check({
      user: 'user:test_admin',
      relation: 'can_manage_users',
      object: 'user_management:test_org',
    });
    console.log(`Can test_admin manage users in test_org? ${allowed ? '✅ Yes' : '❌ No'}`);

  } catch (error) {
    console.error('Error loading model:', error.message);
    if (error.responseData) {
      console.error('Response:', JSON.stringify(error.responseData, null, 2));
    }
    process.exit(1);
  }
}

loadModel();