import { Sidebar } from "@components";
import { Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import NotFoundPage from "../pages/404Page";

const DashboardLayout = () => {
  const { session } = useSession();
  if (!session) {
    return <NotFoundPage />;
  }
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 bg-base-100">
          <Outlet />
        </main>
      </div>
    );
};

export default DashboardLayout;
