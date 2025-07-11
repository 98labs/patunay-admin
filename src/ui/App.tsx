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

            <Route path="*" element={<Login />} />
          </Route>

          <Route path="*" element={<Login />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
