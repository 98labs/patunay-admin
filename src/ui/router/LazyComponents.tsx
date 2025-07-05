import { lazy } from 'react';

// Lazy load page components for code splitting
export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const Artworks = lazy(() => import('../pages/Artworks'));
export const RegisterArtwork = lazy(() => import('../pages/RegisterArtwork'));
export const SearchArtwork = lazy(() => import('../pages/SearchArtwork'));
export const DetailedArtwork = lazy(() => import('../pages/DetailedArtwork'));
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
export const StatisticsPage = lazy(() => import('../pages/Statistics'));
export const SettingsPage = lazy(() => import('../pages/Settings'));
export const SuperAdmin = lazy(() => import('../pages/SuperAdmin'));