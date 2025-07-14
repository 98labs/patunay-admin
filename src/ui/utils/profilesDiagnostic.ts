import supabase, { supabaseAdmin } from '../supabase';

export const runProfilesDiagnostic = async () => {
  console.log('=== Running Profiles Table Diagnostic ===');
  
  try {
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Not authenticated:', userError);
      return;
    }
    console.log('✅ Current user:', user.email, 'ID:', user.id);
    
    // 2. Try simple profile query
    console.log('\n--- Testing simple profile query ---');
    const { data: simpleData, error: simpleError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
    } else {
      console.log('✅ User profile found:', simpleData);
    }
    
    // 3. Try to get all profiles (limited)
    console.log('\n--- Testing profiles list query ---');
    const { data: listData, error: listError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (listError) {
      console.error('❌ List query failed:', listError);
    } else {
      console.log('✅ Found profiles:', listData?.length || 0);
    }
    
    // 4. Try with count
    console.log('\n--- Testing profiles with count ---');
    const { data: countData, error: countError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
    } else {
      console.log('✅ Count query succeeded. Total profiles:', count);
    }
    
    // 5. Try with service role if available
    if (supabaseAdmin) {
      console.log('\n--- Testing with service role ---');
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (adminError) {
        console.error('❌ Service role query failed:', adminError);
      } else {
        console.log('✅ Service role query succeeded. Found:', adminData?.length || 0);
      }
    } else {
      console.log('\n⚠️  Service role not configured');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
  
  console.log('\n=== Diagnostic Complete ===');
};