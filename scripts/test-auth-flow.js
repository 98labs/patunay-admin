#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.development.local') });
dotenv.config({ path: join(__dirname, '..', '.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('\n🔍 Testing Authentication Flow\n');
  
  // Test credentials (update these with valid test credentials)
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword';
  
  try {
    // 1. Test login
    console.log('1. Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('   User ID:', loginData.user?.id);
    console.log('   Email:', loginData.user?.email);
    console.log('   Session:', loginData.session ? 'Present' : 'Missing');
    
    // 2. Test getting session
    console.log('\n2. Testing getSession...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Get session failed:', sessionError.message);
    } else {
      console.log('✅ Session retrieved:', session ? 'Present' : 'Missing');
    }
    
    // 3. Test fetching profile
    if (session?.user) {
      console.log('\n3. Testing profile fetch...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile fetch failed:', profileError.message);
        console.error('   Error details:', profileError);
      } else {
        console.log('✅ Profile fetched successfully');
        console.log('   Role:', profile.role);
        console.log('   Active:', profile.is_active);
        console.log('   Name:', profile.first_name, profile.last_name);
      }
      
      // 4. Test current_user_profile view
      console.log('\n4. Testing current_user_profile view...');
      const { data: viewProfile, error: viewError } = await supabase
        .from('current_user_profile')
        .select('*')
        .single();
      
      if (viewError) {
        console.error('❌ View fetch failed:', viewError.message);
        console.error('   Error details:', viewError);
      } else {
        console.log('✅ View fetched successfully');
        console.log('   Data:', viewProfile);
      }
      
      // 5. Test organization fetch
      console.log('\n5. Testing organization fetch...');
      const { data: orgs, error: orgsError } = await supabase
        .from('organization_users')
        .select('*, organization:organizations(*)')
        .eq('user_id', session.user.id)
        .eq('is_active', true);
      
      if (orgsError) {
        console.error('❌ Organizations fetch failed:', orgsError.message);
      } else {
        console.log('✅ Organizations fetched:', orgs?.length || 0, 'found');
        orgs?.forEach((org, i) => {
          console.log(`   Org ${i + 1}:`, org.organization?.name, `(Role: ${org.role})`);
        });
      }
    }
    
    // 6. Test logout
    console.log('\n6. Testing logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Logout failed:', logoutError.message);
    } else {
      console.log('✅ Logout successful');
    }
    
    // 7. Verify session is cleared
    console.log('\n7. Verifying session cleared...');
    const { data: { session: afterLogout } } = await supabase.auth.getSession();
    console.log('✅ Session after logout:', afterLogout ? 'Still present!' : 'Cleared');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the test
testAuthFlow().then(() => {
  console.log('\n✅ Auth flow test completed\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Auth flow test failed:', error);
  process.exit(1);
});