import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import Providers from "../Providers";
import SuspenseWrapper from "../layouts/SuspenseWrapper";
import { SuperUserRoute, UserManagementRoute, NfcManagementRoute, ArtworkManagementRoute, OrganizationRoute } from "../components/ProtectedRoute";
import {
  Dashboard,
  Artworks,
  RegisterArtwork,
  SearchArtwork,
  DetailedArtwork,
  Appraisals,
  Admin,
  NfcTags,
  UserManagement,
  Devices,
  Login,
  NotFoundPage,
  OrganizationManagementPage,
  MigrationVerificationPage,
  OrganizationPage,
  MembersPage,
  StatisticsPage,
  SettingsPage,
  SuperAdmin,
  SuperAdminDashboard,
  SystemStatistics,
  LocationsPage,
  LocationUsersPage
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
            path: "/dashboard/appraisals",
            element: (
              <SuspenseWrapper>
                <Appraisals />
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
          // Super Admin routes
          {
            path: "/dashboard/super-admin",
            element: (
              <SuperUserRoute>
                <SuspenseWrapper>
                  <SuperAdminDashboard />
                </SuspenseWrapper>
              </SuperUserRoute>
            ),
          },
          {
            path: "/dashboard/super-admin/organizations",
            element: (
              <SuperUserRoute>
                <SuspenseWrapper>
                  <OrganizationManagementPage />
                </SuspenseWrapper>
              </SuperUserRoute>
            ),
          },
          {
            path: "/dashboard/super-admin/users",
            element: (
              <SuperUserRoute>
                <SuspenseWrapper>
                  <SuperAdmin />
                </SuspenseWrapper>
              </SuperUserRoute>
            ),
          },
          {
            path: "/dashboard/super-admin/statistics",
            element: (
              <SuperUserRoute>
                <SuspenseWrapper>
                  <SystemStatistics />
                </SuspenseWrapper>
              </SuperUserRoute>
            ),
          },
          {
            path: "/dashboard/super-admin/migration-verification",
            element: (
              <SuperUserRoute>
                <SuspenseWrapper>
                  <MigrationVerificationPage />
                </SuspenseWrapper>
              </SuperUserRoute>
            ),
          },
          {
            path: "/dashboard/organization",
            element: (
              <OrganizationRoute>
                <SuspenseWrapper>
                  <OrganizationPage />
                </SuspenseWrapper>
              </OrganizationRoute>
            ),
          },
          {
            path: "/dashboard/organization/members",
            element: (
              <OrganizationRoute>
                <SuspenseWrapper>
                  <MembersPage />
                </SuspenseWrapper>
              </OrganizationRoute>
            ),
          },
          {
            path: "/dashboard/organization/statistics",
            element: (
              <OrganizationRoute>
                <SuspenseWrapper>
                  <StatisticsPage />
                </SuspenseWrapper>
              </OrganizationRoute>
            ),
          },
          {
            path: "/dashboard/organization/settings",
            element: (
              <OrganizationRoute>
                <SuspenseWrapper>
                  <SettingsPage />
                </SuspenseWrapper>
              </OrganizationRoute>
            ),
          },
          {
            path: "/dashboard/organization/locations",
            element: (
              <OrganizationRoute>
                <SuspenseWrapper>
                  <LocationsPage />
                </SuspenseWrapper>
              </OrganizationRoute>
            ),
          },
          {
            path: "/dashboard/organization/locations/:id",
            element: (
              <OrganizationRoute>
                <SuspenseWrapper>
                  <LocationUsersPage />
                </SuspenseWrapper>
              </OrganizationRoute>
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
