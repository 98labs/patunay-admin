import { lazy } from 'react';

// Lazy load page components for code splitting
export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const Artworks = lazy(() => import('../pages/Artworks'));
export const RegisterArtwork = lazy(() => import('../pages/RegisterArtwork'));
export const SearchArtwork = lazy(() => import('../pages/SearchArtwork'));
export const DetailedArtwork = lazy(() => import('../pages/DetailedArtwork'));
export const Appraisals = lazy(() => import('../pages/Appraisals'));
export const Admin = lazy(() => import('../pages/Admin'));
export const NfcTags = lazy(() => import('../pages/NfcTags'));
export const UserManagement = lazy(() => import('../pages/UserManagement'));
export const Devices = lazy(() => import('../pages/Devices'));
export const Login = lazy(() => import('../pages/Login'));
export const NotFoundPage = lazy(() => import('../pages/404Page'));

// New multi-tenant components
export const OrganizationManagementPage = lazy(() => import('../pages/OrganizationManagementPage'));
export const MigrationVerificationPage = lazy(() => import('../pages/MigrationVerificationPage'));
export const OrganizationPage = lazy(() => import('../pages/Organization'));
export const MembersPage = lazy(() => import('../pages/Members'));
export const StatisticsPage = lazy(() => import('../pages/OrganizationStatistics'));
export const SettingsPage = lazy(() => import('../pages/OrganizationSettings'));
export const SuperAdmin = lazy(() => import('../pages/SuperAdmin/SuperAdmin'));
export const SuperAdminDashboard = lazy(() => import('../pages/SuperAdmin/SuperAdminDashboard'));
export const SystemStatistics = lazy(() => import('../pages/SuperAdmin/SystemStatistics'));
export const DebugPermissions = lazy(() => import('../pages/SuperAdmin/DebugPermissions'));

// Location management components
export const LocationsPage = lazy(() => import('../pages/Locations'));
export const LocationUsersPage = lazy(() => import('../pages/LocationUsers'));