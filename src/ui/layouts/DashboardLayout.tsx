import { useEffect, useState } from "react";
import { Sidebar, NotificationMessage, NfcWarningBanner } from "@components";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useDispatch } from "react-redux";
import { setUser, setSession } from "../store/features/auth";

const DashboardLayout = () => {
  const { session } = useSession();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    if (session?.user) {
      dispatch(setUser(session.user));
    }
    if (session) {
      dispatch(setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }));
    }
  }, [session, dispatch]);

  if (!session) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-base-100 dark:bg-base-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col overflow-auto p-6 bg-base-100 dark:bg-base-100">
        {/* Topbar */}
        <header className="text-base-content dark:text-base-content md:hidden">
          <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              className="md:hidden text-2xl text-base-content dark:text-base-content hover:text-primary dark:hover:text-primary transition-colors duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>
        </header>
        <div className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-4 w-full max-w-9xl mx-auto">
            <NfcWarningBanner className="mb-4" />
            <NotificationMessage />
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
