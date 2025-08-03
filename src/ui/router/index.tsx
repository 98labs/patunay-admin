import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import Providers from "../Providers";
import SuspenseWrapper from "../layouts/SuspenseWrapper";
import { UserManagementRoute, NfcManagementRoute, ArtworkManagementRoute } from "../components/ProtectedRoute";
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
  NotFoundPage,
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
        element: (() => {
          return <Navigate to="/login" />;
        })(),
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
              <NfcManagementRoute>
                <SuspenseWrapper>
                  <Devices />
                </SuspenseWrapper>
              </NfcManagementRoute>
            ),
          },
          {
            path: "/dashboard/admin/nfc-tags",
            element: (
              <NfcManagementRoute>
                <SuspenseWrapper>
                  <NfcTags />
                </SuspenseWrapper>
              </NfcManagementRoute>
            ),
          },
          {
            path: "/dashboard/artworks/register",
            element: (
              <ArtworkManagementRoute>
                <SuspenseWrapper>
                  <RegisterArtwork />
                </SuspenseWrapper>
              </ArtworkManagementRoute>
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
              <UserManagementRoute>
                <SuspenseWrapper>
                  <UserManagement />
                </SuspenseWrapper>
              </UserManagementRoute>
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
