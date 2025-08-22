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
  Login,
  NotFoundPage,
} from "./LazyComponents";
import UserTableSkeleton from "../pages/UserManagement/components/UserTableSkeleton";
import NfcTagsSkeleton from "../pages/NfcTags/components/NfcTagsSkeleton";
import ArtworksSkeleton from "../pages/Artworks/components/ArtworksSkeleton";

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
              <SuspenseWrapper fallback={
                <div className="space-y-6">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                  <div className="flex gap-4">
                    <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                  </div>
                  <ArtworksSkeleton />
                  <div className="flex justify-center gap-2">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
                  </div>
                </div>
              }>
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
            path: "/dashboard/admin/nfc-tags",
            element: (
              <NfcManagementRoute>
                <SuspenseWrapper fallback={
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                      </div>
                    </div>
                    <NfcTagsSkeleton />
                  </div>
                }>
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
                <SuspenseWrapper fallback={
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mb-2" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64" />
                      </div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                    </div>
                    <UserTableSkeleton />
                  </div>
                }>
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
