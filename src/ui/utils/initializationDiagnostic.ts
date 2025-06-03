import { runSupabaseDiagnostic } from './supabaseDiagnostic';

/**
 * Run a quick diagnostic check on app initialization
 * This helps identify configuration issues early
 */
export async function runInitializationDiagnostic() {
  const isDevelopment = import.meta.env.DEV;
  
  if (!isDevelopment) {
    // Only run in development mode
    return;
  }

  try {
    console.log('Running initialization diagnostic...');
    const report = await runSupabaseDiagnostic();
    
    // Check for critical errors
    const criticalErrors = report.results.filter(r => 
      r.status === 'error' && 
      ['Environment Variables', 'URL Validation', 'Database Connectivity'].includes(r.step)
    );

    if (criticalErrors.length > 0) {
      console.error('⚠️ Critical Supabase configuration errors detected:');
      criticalErrors.forEach(error => {
        console.error(`  - ${error.step}: ${error.message}`);
        if (error.details) {
          console.error('    Details:', error.details);
        }
      });
      console.error('\nPlease check your .env file and Supabase configuration.');
      console.error('Run the connection diagnostic from the login page for more details.');
    } else if (report.summary.failed > 0) {
      console.warn(`⚠️ Supabase diagnostic found ${report.summary.failed} errors. Check the login page diagnostic for details.`);
    } else {
      console.log('✅ Supabase connection healthy');
    }
  } catch (error) {
    console.error('Failed to run initialization diagnostic:', error);
  }
}