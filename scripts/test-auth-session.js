#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

async function testAuthSession() {
  console.log('Testing auth session flow...\n');

  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error getting session:', sessionError.message);
    } else {
      console.log('Current session:', currentSession ? `User ${currentSession.user.email} is logged in` : 'No active session');
    }

    // 2. Test login
    console.log('\n2. Testing login...');
    const testEmail = process.argv[2] || 'test@example.com';
    const testPassword = process.argv[3] || 'testpassword';
    
    console.log(`Attempting login with: ${testEmail}`);
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('Login error:', loginError.message);
      return;
    }

    console.log('Login successful!');
    console.log('Session token:', loginData.session?.access_token?.substring(0, 20) + '...');
    console.log('User ID:', loginData.user?.id);
    console.log('User email:', loginData.user?.email);

    // 3. Verify session is stored
    console.log('\n3. Verifying session storage...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const { data: { session: verifiedSession }, error: verifyError } = await supabase.auth.getSession();
    if (verifyError) {
      console.error('Error verifying session:', verifyError.message);
    } else {
      console.log('Session verified:', verifiedSession ? 'Session is properly stored' : 'Session NOT found!');
    }

    // 4. Test profile fetch
    console.log('\n4. Testing profile fetch...');
    if (loginData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError.message);
      } else {
        console.log('Profile fetched successfully:', {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_active: profile.is_active
        });
      }
    }

    // 5. Test auth state listener
    console.log('\n5. Setting up auth state listener...');
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
    });

    // 6. Test session refresh
    console.log('\n6. Testing session refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error('Refresh error:', refreshError.message);
    } else {
      console.log('Session refreshed successfully');
    }

    // 7. Test logout
    console.log('\n7. Testing logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      console.error('Logout error:', logoutError.message);
    } else {
      console.log('Logged out successfully');
    }

    // 8. Verify session is cleared
    console.log('\n8. Verifying session is cleared...');
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    console.log('Final session check:', finalSession ? 'Session still exists!' : 'Session properly cleared');

    // Cleanup
    authListener.subscription.unsubscribe();

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testAuthSession();