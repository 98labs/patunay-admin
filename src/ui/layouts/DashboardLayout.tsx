import { useEffect } from "react";
import { Sidebar, NotificationMessage } from "@components";
import { Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import NotFoundPage from "../pages/404Page";
import { useDispatch } from "react-redux";
import { setUser } from "../pages/Login/slice";


const DashboardLayout = () => {
  const { session } = useSession();
  const dispatch = useDispatch();
  if (!session) {
    return <NotFoundPage />;
  }
  useEffect(() => {
    dispatch(setUser(session.user))
  }, [])

    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 bg-base-100">
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
