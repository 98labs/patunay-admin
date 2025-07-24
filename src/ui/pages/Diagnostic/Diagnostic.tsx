import { PageHeader, SupabaseDiagnostic } from "@components";
import { useEffect } from "react";
import { runAndLogDiagnostic } from "../../utils/supabaseDiagnostic";

const Diagnostic = () => {
  useEffect(() => {
    // Automatically run diagnostic in console on page load
    runAndLogDiagnostic().catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Diagnostic"
        description="Test your Supabase connection and authentication setup"
      />
      
      <div className="grid gap-6">
        <SupabaseDiagnostic />
        
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Console Output</h3>
            <p className="text-sm opacity-70">
              A detailed diagnostic report has also been logged to your browser console. 
              Press F12 to open developer tools and check the console tab for more information.
            </p>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Common Issues</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Missing Environment Variables:</strong>
                <p className="opacity-70">Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file</p>
              </div>
              <div>
                <strong>Invalid URL Format:</strong>
                <p className="opacity-70">The Supabase URL should be in format: https://[project-id].supabase.co</p>
              </div>
              <div>
                <strong>Auth Service Errors:</strong>
                <p className="opacity-70">Check if your Supabase project is active and auth settings are configured</p>
              </div>
              <div>
                <strong>Database Connection Failed:</strong>
                <p className="opacity-70">Verify your anon key has proper permissions and RLS policies are set</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;