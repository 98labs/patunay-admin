import { useState } from "react";
import { Sidebar, NotificationMessage, NfcWarningBanner, NetworkStatus } from "@components";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const DashboardLayout = () => {
  const { session } = useSession();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
            <div className="text-base-content">
              <NetworkStatus />
              <NfcWarningBanner className="mb-4" />
              <NotificationMessage />
              <Outlet />
            </div>
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
