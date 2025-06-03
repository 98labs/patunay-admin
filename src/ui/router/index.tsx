import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import Providers from "../Providers";
import SuspenseWrapper from "../layouts/SuspenseWrapper";
import {
  Dashboard,
  Artworks,
  RegisterArtwork,
  SearchArtwork,
  DetailedArtwork,
  Admin,
  NfcTags,

  UserManagement,
  Devices,
  Login,
  NotFoundPage
} from "./LazyComponents";

// Layout components are loaded separately for better optimization
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));

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
        element: (
          <SuspenseWrapper>
            <Login />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/sign-up",
        element: <Login />,
      },
      // Auth Protected routes
      {
        path: "/",
        element: (
          <SuspenseWrapper>
            <DashboardLayout />
          </SuspenseWrapper>
        ),
        children: [
          {
            path: "/dashboard/admin",
            element: (
              <SuspenseWrapper>
                <Admin />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/artworks",
            element: (
              <SuspenseWrapper>
                <Artworks />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/artworks/:id",
            element: (
              <SuspenseWrapper>
                <DetailedArtwork />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard",
            element: (
              <SuspenseWrapper>
                <Dashboard />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/admin/device",
            element: (
              <SuspenseWrapper>
                <Devices />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/admin/nfc-tags",
            element: (
              <SuspenseWrapper>
                <NfcTags />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/artworks/register",
            element: (
              <SuspenseWrapper>
                <RegisterArtwork />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/artworks/search",
            element: (
              <SuspenseWrapper>
                <SearchArtwork />
              </SuspenseWrapper>
            ),
          },
          {
            path: "/dashboard/admin/users",
            element: (
              <SuspenseWrapper>
                <UserManagement />
              </SuspenseWrapper>
            ),
          },
          {
            path: "*",
            element: (
              <SuspenseWrapper>
                <NotFoundPage />
              </SuspenseWrapper>
            ),
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
