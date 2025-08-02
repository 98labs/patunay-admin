import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import supabase from "../supabase";
import { Loading } from "@components";
import { Session } from "@supabase/supabase-js";
import { initializeAuth } from "../store/features/auth/authSliceV2";
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
  
  console.log('SessionProvider: Initializing');

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
    console.log('SessionProvider: Getting initial session');
    
    // Add auth state listener first to catch any auth events
    const authStateListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('SessionProvider: Auth state change event:', event, session ? 'Has session' : 'No session');
        setSession(session);
        setIsLoading(false);
        
        // Update Redux auth state on auth changes
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
          console.log('SessionProvider: Initializing Redux auth state for event:', event);
          dispatch(initializeAuth());
        } else if (event === 'SIGNED_OUT') {
          console.log('SessionProvider: User signed out, clearing auth state');
          // The auth slice will handle clearing on initializeAuth returning null
        }
      }
    );
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SessionProvider: Initial session loaded', session ? 'Authenticated' : 'Not authenticated');
      setSession(session);
      setIsLoading(false);
      
      // Initialize Redux auth state if session exists
      if (session) {
        console.log('SessionProvider: Initializing Redux auth state for existing session');
        dispatch(initializeAuth());
      }
    }).catch(error => {
      console.error('SessionProvider: Error getting session', error);
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
