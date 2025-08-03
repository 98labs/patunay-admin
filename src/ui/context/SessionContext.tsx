import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import supabase from "../supabase";
import { Loading } from "@components";
import { Session } from "@supabase/supabase-js";
import { initializeAuth } from "../store/features/auth/authSlice";
import { AppDispatch } from "../store/store";

const SessionContext = createContext<{
  session: Session | null;
}>({
  session: null,
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

type Props = { children: React.ReactNode };
export const SessionProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  

  useEffect(() => {
    // Initialize theme from localStorage or default to light
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    // Also set the class for Tailwind dark mode
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    console.log('SessionContext: Initializing auth...');
    
    // Add auth state listener first to catch any auth events
    const authStateListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('SessionContext: Auth state changed:', event, !!session);
        setSession(session);
        setIsLoading(false);
        
        // Update Redux auth state on auth changes
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
          console.log('SessionContext: Dispatching initializeAuth');
          dispatch(initializeAuth());
        } else if (event === 'SIGNED_OUT') {
          console.log('SessionContext: User signed out');
          // The auth slice will handle clearing on initializeAuth returning null
        }
      }
    );
    
    // Get initial session
    console.log('SessionContext: Getting initial session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SessionContext: Initial session:', !!session);
      setSession(session);
      setIsLoading(false);
      
      // Initialize Redux auth state if session exists
      if (session) {
        console.log('SessionContext: Initializing Redux auth');
        dispatch(initializeAuth());
      }
    }).catch(error => {
      console.error('SessionContext: Error getting session:', error);
      setIsLoading(false);
    });

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
  }, [dispatch]);

  const contextValue = useMemo(() => ({ session }), [session]);

  return (
    <SessionContext.Provider value={contextValue}>
      {isLoading ? <Loading /> : children}
    </SessionContext.Provider>
  );
};
