import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { FormField, NotificationMessage } from "@components";
import { useSession } from "../../context/SessionContext";
import { InputType } from "@typings";
import { useLoginMutation } from "../../store/api/userApi";
import { showNotification } from "../../components/NotificationMessage/slice";
import { useSupabaseDiagnostic } from "../../hooks/useSupabaseDiagnostic";
import { initializeAuth } from "../../store/features/auth/authSliceV2";
import { AppDispatch } from "../../store/store";

import logo from "@/assets/logo/patunay-logo.png";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { session } = useSession();
  const [login, { isLoading }] = useLoginMutation();
  const { runDiagnostic, isRunning: isDiagnosticRunning } = useSupabaseDiagnostic();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  if (session) return <Navigate to="/dashboard" />;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await login({
        email: formValues.email,
        password: formValues.password,
      }).unwrap();
      
      dispatch(showNotification({
        message: "Successfully Login",
        status: "success",
      }));
      
      // Initialize auth state after successful login
      if (result.session) {
        console.log('Login: Session received, waiting for propagation');
        
        // Wait a bit longer for the auth state to fully propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Login: Initializing auth state');
        // Initialize auth state
        try {
          const authResult = await dispatch(initializeAuth()).unwrap();
          console.log('Login: Auth initialized successfully', authResult ? 'with user' : 'no user');
        } catch (authError) {
          console.error('Login: Failed to initialize auth', authError);
        }
        
        // The SessionContext will handle the redirect once it detects the session
      }
    } catch (error: any) {
      dispatch(showNotification({
        message: error.message || "Login failed",
        status: "error",
      }));
    }
  };

  const handleRunDiagnostic = async () => {
    try {
      const report = await runDiagnostic();
      if (report.summary.failed > 0) {
        dispatch(showNotification({
          message: `Diagnostic found ${report.summary.failed} errors. Check console for details.`,
          status: "error",
        }));
      } else {
        dispatch(showNotification({
          message: "Supabase connection is healthy",
          status: "success",
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        message: "Failed to run diagnostic",
        status: "error",
      }));
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-base-100 dark:bg-base-100">
      <NotificationMessage />
      <div className="m-auto flex flex-col items-center gap-8 p-8 bg-base-200 dark:bg-base-200 rounded-xl shadow-lg border border-base-300 dark:border-base-300 max-w-md w-full">
        <div className="flex flex-col gap-4 items-center text-center">
          <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-full">
            <img src={logo} className="w-16 h-16" alt="Patunay Logo" />
          </div>
          <h2 className="text-3xl font-semibold text-base-content dark:text-base-content">
            Welcome to Patunay
          </h2>
          <div className="text-sm text-base-content/60 dark:text-base-content/60">
            Version: {__APP_VERSION__}
          </div>
        </div>

        <div className="w-full">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <FormField
                label="Username"
                name="email"
                inputType={InputType.Email}
                hint="Enter your email"
                onInputChange={handleInputChange}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-base-content dark:text-base-content">
                </label>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold text-primary dark:text-primary hover:text-primary/80 dark:hover:text-primary/80"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <FormField
                label="Password"
                name="password"
                inputType={InputType.Password}
                hint="Enter your password"
                onInputChange={handleInputChange}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="divider text-base-content/40">Having trouble?</div>
          
          <button
            type="button"
            className="btn btn-ghost btn-sm w-full"
            onClick={handleRunDiagnostic}
            disabled={isDiagnosticRunning}
          >
            {isDiagnosticRunning ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Running diagnostic...
              </>
            ) : (
              "Run Connection Diagnostic"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
