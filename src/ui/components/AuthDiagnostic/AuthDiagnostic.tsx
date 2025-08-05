import { useState } from "react";
import supabase from "../../supabase";

interface DiagnosticResult {
  step: string;
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}

export const AuthDiagnostic = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Check Supabase connection
    try {
      const { error } = await supabase.from('profiles').select('count').single();
      newResults.push({
        step: "Supabase Connection",
        success: !error,
        message: error ? `Failed: ${error.message}` : "Success: Connected to Supabase",
        error
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        newResults.push({
          step: "Supabase Connection",
          success: false,
          message: `Exception: ${err.message}`,
          error: err
        });
      }
    }

    // Test 2: Check if auth is working
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      newResults.push({
        step: "Auth Service",
        success: !error,
        message: error ? `Failed: ${error.message}` : `Success: ${user ? 'User logged in' : 'No user logged in'}`,
        error
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        newResults.push({
          step: "Auth Service",
          success: false,
          message: `Exception: ${err.message}`,
          error: err
        });
      }
    }

    // Test 3: Try to check auth configuration
    try {
      const { data, error } = await supabase.auth.getSession();
      newResults.push({
        step: "Session Check",
        success: !error,
        message: error ? `Failed: ${error.message}` : `Success: ${data.session ? 'Active session' : 'No active session'}`,
        error
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        newResults.push({
          step: "Session Check",
          success: false,
          message: `Exception: ${err.message}`,
          error: err
        });
      }
    }

    // Test 4: Check profiles table structure
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      newResults.push({
        step: "Profiles Table",
        success: !error,
        message: error ? `Failed: ${error.message}` : "Success: Profiles table accessible",
        error
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        newResults.push({
          step: "Profiles Table",
          success: false,
          message: `Exception: ${err.message}`,
          error: err
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const handleTestLogin = async () => {
    try {
      console.log('Testing login with test credentials...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'brian.tanseng@gmail.com',
        password: 'test123' // You'll need to use the actual password
      });
      
      if (error) {
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          cause: error.cause,
          stack: error.stack
        });
        alert(`Login failed: ${error.message}`);
      } else {
        console.log('Login successful:', data);
        alert('Login successful!');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Login exception:', err);
        alert(`Login exception: ${err.message}`);
      }
    }
  };

  return (
    <div className="p-4 bg-base-200 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Authentication Diagnostic</h3>
      
      <div className="flex gap-2 mb-4">
        <button 
          className="btn btn-primary btn-sm"
          onClick={runDiagnostic}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run Diagnostic"}
        </button>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleTestLogin}
        >
          Test Login
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-2 rounded ${result.success ? 'bg-success/20' : 'bg-error/20'}`}
            >
              <div className="flex items-center gap-2">
                <span className={result.success ? 'text-success' : 'text-error'}>
                  {result.success ? '✓' : '✗'}
                </span>
                <span className="font-medium">{result.step}:</span>
                <span className="text-sm">{result.message}</span>
              </div>
              {result.error && (
                <pre className="text-xs mt-1 overflow-auto">
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};