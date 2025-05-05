import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import Providers from "../Providers";

const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const Admin = lazy(() => import("../pages/Admin"));
const Artworks = lazy(() => import("../pages/Artworks"));
const DetailedArtwork = lazy(
  () => import("../pages/DetailedArtwork/DetailArtwork")
);
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Devices = lazy(() => import("../pages/Devices"));
const Login = lazy(() => import("../pages/Login"));
const NfcTags = lazy(() => import("../pages/NfcTags"));
const RegisterArtwork = lazy(() => import("../pages/RegisterArtwork"));
const SearchArtwork = lazy(() => import("../pages/SearchArtwork"));
const Team = lazy(() => import("../pages/Team"));
// const HomePage = lazy(() => import('../pages/HomePage'));
const NotFoundPage = lazy(() => import("../pages/404Page"));

const router = createBrowserRouter([
  // I recommend you reflect the routes here in the pages folder
  {
    path: "/",
    element: <Providers />,
    children: [
      // Public routes
      {
        path: "/",
        element: <Navigate to="/login" />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/sign-up",
        element: <Login />,
      },
      // Auth Protected routes
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard/admin",
            element: <Admin />,
          },
          {
            path: "/dashboard/artworks",
            element: <Artworks />,
          },
          {
            path: "/dashboard/artworks/:id",
            element: <DetailedArtwork />,
          },
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/dashboard/admin/device",
            element: <Devices />,
          },
          {
            path: "/dashboard/admin/nfc-tags",
            element: <NfcTags />,
          },
          {
            path: "/dashboard/artworks/register",
            element: <RegisterArtwork />,
          },
          {
            path: "/dashboard/artworks/search",
            element: <SearchArtwork />,
          },
          {
            path: "/dashboard/admin/team",
            element: <Team />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" />,
  },
]);

export default router;
