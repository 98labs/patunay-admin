import supabase from '../supabase';

export interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export interface SupabaseDiagnosticReport {
  timestamp: string;
  environment: {
    url: string;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
  };
  results: DiagnosticResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

export async function runSupabaseDiagnostic(): Promise<SupabaseDiagnosticReport> {
  const results: DiagnosticResult[] = [];
  const startTime = new Date();

  // 1. Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  results.push({
    step: 'Environment Variables',
    status: supabaseUrl && supabaseAnonKey ? 'success' : 'error',
    message: supabaseUrl && supabaseAnonKey 
      ? 'Required environment variables are set' 
      : 'Missing required environment variables',
    details: {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      urlDomain: supabaseUrl ? new URL(supabaseUrl).hostname : null,
    }
  });

  // 2. Validate URL format
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      results.push({
        step: 'URL Validation',
        status: 'success',
        message: `Valid Supabase URL: ${url.hostname}`,
        details: {
          protocol: url.protocol,
          hostname: url.hostname,
          isSupabaseUrl: url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')
        }
      });
    } catch (error) {
      results.push({
        step: 'URL Validation',
        status: 'error',
        message: 'Invalid Supabase URL format',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  // 3. Test basic connectivity
  try {
    const healthCheckStart = Date.now();
    const { data, error } = await supabase.from('_test_connectivity').select('*').limit(1);
    const responseTime = Date.now() - healthCheckStart;

    if (error && error.code === '42P01') {
      // Table doesn't exist - this is expected and means we can connect
      results.push({
        step: 'Database Connectivity',
        status: 'success',
        message: `Connected to database (${responseTime}ms)`,
        details: { responseTime, error: 'Expected error - test table does not exist' }
      });
    } else if (error) {
      results.push({
        step: 'Database Connectivity',
        status: 'error',
        message: 'Failed to connect to database',
        details: { error: error.message, code: error.code, responseTime }
      });
    } else {
      results.push({
        step: 'Database Connectivity',
        status: 'success',
        message: `Connected to database (${responseTime}ms)`,
        details: { responseTime }
      });
    }
  } catch (error) {
    results.push({
      step: 'Database Connectivity',
      status: 'error',
      message: 'Network error or Supabase is unreachable',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // 4. Test auth service
  try {
    const authStart = Date.now();
    const { data: session, error } = await supabase.auth.getSession();
    const authTime = Date.now() - authStart;

    if (error) {
      results.push({
        step: 'Auth Service',
        status: 'error',
        message: 'Auth service error',
        details: { error: error.message, responseTime: authTime }
      });
    } else {
      results.push({
        step: 'Auth Service',
        status: 'success',
        message: `Auth service is responsive (${authTime}ms)`,
        details: { 
          hasSession: !!session?.session,
          responseTime: authTime,
          sessionUser: session?.session?.user?.email
        }
      });
    }
  } catch (error) {
    results.push({
      step: 'Auth Service',
      status: 'error',
      message: 'Failed to reach auth service',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // 5. Test a known table (profiles)
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      results.push({
        step: 'Profiles Table Access',
        status: 'error',
        message: 'Cannot access profiles table',
        details: { error: error.message, code: error.code }
      });
    } else {
      results.push({
        step: 'Profiles Table Access',
        status: 'success',
        message: `Profiles table accessible (${count || 0} records)`,
        details: { count }
      });
    }
  } catch (error) {
    results.push({
      step: 'Profiles Table Access',
      status: 'error',
      message: 'Failed to query profiles table',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // 6. Test RLS policies
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (currentUser?.user) {
      // Try to read current user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.user.id)
        .single();

      if (error) {
        results.push({
          step: 'RLS Policies',
          status: 'warning',
          message: 'RLS may be blocking profile access',
          details: { error: error.message, userId: currentUser.user.id }
        });
      } else {
        results.push({
          step: 'RLS Policies',
          status: 'success',
          message: 'RLS policies allow profile access',
          details: { profileId: data?.id }
        });
      }
    } else {
      results.push({
        step: 'RLS Policies',
        status: 'warning',
        message: 'Cannot test RLS - no authenticated user',
        details: {}
      });
    }
  } catch (error) {
    results.push({
      step: 'RLS Policies',
      status: 'error',
      message: 'Failed to test RLS policies',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // 7. Test storage connectivity (if applicable)
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      results.push({
        step: 'Storage Service',
        status: 'error',
        message: 'Storage service error',
        details: { error: error.message }
      });
    } else {
      results.push({
        step: 'Storage Service',
        status: 'success',
        message: `Storage service accessible (${data?.length || 0} buckets)`,
        details: { bucketCount: data?.length || 0 }
      });
    }
  } catch (error) {
    results.push({
      step: 'Storage Service',
      status: 'error',
      message: 'Failed to reach storage service',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // Calculate summary
  const summary = {
    passed: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    warnings: results.filter(r => r.status === 'warning').length,
  };

  return {
    timestamp: new Date().toISOString(),
    environment: {
      url: supabaseUrl || 'NOT SET',
      hasAnonKey: !!supabaseAnonKey,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
    },
    results,
    summary
  };
}

// Helper function to format diagnostic report for console
export function formatDiagnosticReport(report: SupabaseDiagnosticReport): string {
  const lines: string[] = [
    '=== Supabase Diagnostic Report ===',
    `Timestamp: ${report.timestamp}`,
    `Environment: ${report.environment.url}`,
    `Keys: Anon=${report.environment.hasAnonKey ? '✓' : '✗'}, Service=${report.environment.hasServiceRoleKey ? '✓' : '✗'}`,
    '',
    'Results:',
  ];

  report.results.forEach((result) => {
    const icon = result.status === 'success' ? '✓' : result.status === 'warning' ? '⚠' : '✗';
    lines.push(`  ${icon} ${result.step}: ${result.message}`);
    if (result.details && Object.keys(result.details).length > 0) {
      lines.push(`     Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n     ')}`);
    }
  });

  lines.push('');
  lines.push(`Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`);
  lines.push('===================');

  return lines.join('\n');
}

// Run diagnostic and log to console
export async function runAndLogDiagnostic(): Promise<SupabaseDiagnosticReport> {
  console.log('Starting Supabase diagnostic...');
  const report = await runSupabaseDiagnostic();
  console.log(formatDiagnosticReport(report));
  return report;
}