import { lazy } from 'react'
import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import "./styles/dark-mode-fixes.css";
import { ErrorBoundary } from "@components";

const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const Admin = lazy(() => import('./pages/Admin'));
const Artworks = lazy(() => import('./pages/Artworks'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Devices = lazy(() => import('./pages/Devices'));
const Login = lazy(() => import('./pages/Login'));
const NfcTags = lazy(() => import('./pages/NfcTags'));
const RegisterArtwork = lazy(() => import('./pages/RegisterArtwork'));
const SearchArtwork = lazy(() => import('./pages/SearchArtwork'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Appraisals = lazy(() => import('./pages/Appraisals'));

// Organization pages
const OrganizationPage = lazy(() => import('./pages/Organization/OrganizationPage'));
const MembersPage = lazy(() => import('./pages/Members/MembersPage'));
const Locations = lazy(() => import('./pages/Locations/Locations'));
const OrganizationStatisticsPage = lazy(() => import('./pages/OrganizationStatistics/OrganizationStatisticsPage'));
const OrganizationSettingsPage = lazy(() => import('./pages/OrganizationSettings/OrganizationSettingsPage'));

// Super Admin pages
const OrganizationManagementPage = lazy(() => import('./pages/OrganizationManagementPage/OrganizationManagementPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdmin/SuperAdmin'));
const SystemStatistics = lazy(() => import('./pages/SuperAdmin/SystemStatistics'));

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            <ErrorBoundary>
              <Login />
            </ErrorBoundary>
          } />
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <DashboardLayout />
            </ErrorBoundary>
          }>
            <Route index element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            } />

            <Route path="artworks" element={
              <ErrorBoundary>
                <Artworks />
              </ErrorBoundary>
            } />
            <Route path="artworks/register" element={
              <ErrorBoundary>
                <RegisterArtwork />
              </ErrorBoundary>
            } />
            <Route path="artworks/search" element={
              <ErrorBoundary>
                <SearchArtwork />
              </ErrorBoundary>
            } />

            <Route path="admin" element={
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            } />
            <Route path="admin/nfc-tags" element={
              <ErrorBoundary>
                <NfcTags />
              </ErrorBoundary>
            } />
            <Route path="admin/devices" element={
              <ErrorBoundary>
                <Devices />
              </ErrorBoundary>
            } />
            <Route path="admin/users" element={
              <ErrorBoundary>
                <UserManagement />
              </ErrorBoundary>
            } />

            <Route path="appraisals" element={
              <ErrorBoundary>
                <Appraisals />
              </ErrorBoundary>
            } />

            {/* Organization Routes */}
            <Route path="organization" element={
              <ErrorBoundary>
                <OrganizationPage />
              </ErrorBoundary>
            } />
            <Route path="organization/members" element={
              <ErrorBoundary>
                <MembersPage />
              </ErrorBoundary>
            } />
            <Route path="organization/locations" element={
              <ErrorBoundary>
                <Locations />
              </ErrorBoundary>
            } />
            <Route path="organization/statistics" element={
              <ErrorBoundary>
                <OrganizationStatisticsPage />
              </ErrorBoundary>
            } />
            <Route path="organization/settings" element={
              <ErrorBoundary>
                <OrganizationSettingsPage />
              </ErrorBoundary>
            } />

            {/* Super Admin Routes */}
            <Route path="super-admin/organizations" element={
              <ErrorBoundary>
                <OrganizationManagementPage />
              </ErrorBoundary>
            } />
            <Route path="super-admin/users" element={
              <ErrorBoundary>
                <SuperAdminPage />
              </ErrorBoundary>
            } />
            <Route path="super-admin/statistics" element={
              <ErrorBoundary>
                <SystemStatistics />
              </ErrorBoundary>
            } />

            <Route path="*" element={<Login />} />
          </Route>

          <Route path="*" element={<Login />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
