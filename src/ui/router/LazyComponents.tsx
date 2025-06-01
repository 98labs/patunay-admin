import { lazy } from 'react';

// Lazy load page components for code splitting
export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const Artworks = lazy(() => import('../pages/Artworks'));
export const RegisterArtwork = lazy(() => import('../pages/RegisterArtwork'));
export const SearchArtwork = lazy(() => import('../pages/SearchArtwork'));
export const DetailedArtwork = lazy(() => import('../pages/DetailedArtwork'));
export const Admin = lazy(() => import('../pages/Admin'));
export const NfcTags = lazy(() => import('../pages/NfcTags'));
export const Team = lazy(() => import('../pages/Team'));
export const Devices = lazy(() => import('../pages/Devices'));
export const Login = lazy(() => import('../pages/Login'));
export const NotFoundPage = lazy(() => import('../pages/404Page'));