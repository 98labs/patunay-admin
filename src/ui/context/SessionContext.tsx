import { createContext, useContext, useEffect, useState, useMemo } from "react";
import supabase from "../supabase";
import { Loading } from "@components";
import { Session } from "@supabase/supabase-js";

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SessionProvider: Session loaded', session ? 'Authenticated' : 'Not authenticated');
      setSession(session);
      setIsLoading(false);
    }).catch(error => {
      console.error('SessionProvider: Error getting session', error);
      setIsLoading(false);
    });

    const authStateListener = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
  }, []);

  const contextValue = useMemo(() => ({ session }), [session]);

  return (
    <SessionContext.Provider value={contextValue}>
      {isLoading ? <Loading /> : children}
    </SessionContext.Provider>
  );
};
