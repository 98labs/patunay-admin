#!/usr/bin/env node

/**
 * Script to create test users for development
 * Run with: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users to create
const testUsers = [
  {
    email: 'admin@patunay.com',
    password: 'admin123',
    user_metadata: {
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    }
  },
  {
    email: 'staff@patunay.com',
    password: 'staff123',
    user_metadata: {
      first_name: 'Staff',
      last_name: 'User',
      role: 'staff'
    }
  }
];

async function createTestUsers() {
  console.log('Creating test users...\n');

  for (const userData of testUsers) {
    try {
      // Create user
      const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.user_metadata
      });

      if (createError) {
        if (createError.message.includes('already exists')) {
          console.log(`✓ User ${userData.email} already exists`);
          
          // Update the user's profile to ensure correct role
          const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(userData.email);
          if (existingUser && existingUser.user) {
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                role: userData.user_metadata.role,
                first_name: userData.user_metadata.first_name,
                last_name: userData.user_metadata.last_name,
                is_active: true
              })
              .eq('id', existingUser.user.id);
              
            if (!updateError) {
              console.log(`  → Updated profile with role: ${userData.user_metadata.role}`);
            }
          }
        } else {
          console.error(`✗ Error creating ${userData.email}:`, createError.message);
        }
        continue;
      }

      console.log(`✓ Created user: ${userData.email}`);
      console.log(`  → Password: ${userData.password}`);
      console.log(`  → Role: ${userData.user_metadata.role}`);

    } catch (error) {
      console.error(`✗ Unexpected error for ${userData.email}:`, error.message);
    }
  }

  console.log('\nTest users setup complete!');
  console.log('\nYou can now login with:');
  console.log('- Admin: admin@patunay.com / admin123');
  console.log('- Staff: staff@patunay.com / staff123');
}

// Run the script
createTestUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });