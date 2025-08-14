import { useState } from 'react';
import { Sidebar, NotificationMessage, NfcWarningBanner, NetworkStatus } from '@components';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const DashboardLayout = () => {
  const { session } = useSession();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!session) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="bg-base-100 dark:bg-base-100 flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="bg-base-100 dark:bg-base-100 flex h-screen flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="text-base-content dark:text-base-content flex-shrink-0 md:hidden">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4">
            <button
              className="text-base-content dark:text-base-content hover:text-primary dark:hover:text-primary text-2xl transition-colors duration-200 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-9xl mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
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
          className="fixed inset-0 z-40 bg-black/50 md:hidden dark:bg-black/70"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
