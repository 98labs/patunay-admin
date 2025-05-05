import { useEffect, useState } from "react";
import { Sidebar, NotificationMessage } from "@components";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useDispatch } from "react-redux";
import { setUser } from "../pages/Login/slice";


const DashboardLayout = () => {
  const { session } = useSession();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  if (!session) {
    return <Navigate to="/login" />;
  }
  useEffect(() => {
    dispatch(setUser(session.user))
  }, [])

    return (
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col overflow-auto p-6 bg-base-100">
          {/* Topbar */}
          <header className="text-base-content md:hidden">
            <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
              <button
                className="md:hidden text-2xl"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
            </div>
          </header>
          <div className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-4 w-full max-w-9xl mx-auto">
              <NotificationMessage />
                <Outlet />
            </div>
          </div>
        </main>
      </div>
    );
};

export default DashboardLayout;
