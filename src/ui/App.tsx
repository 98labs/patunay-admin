import { lazy } from 'react'
import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";

const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const Admin = lazy(() => import('./pages/Admin'));
const Artworks = lazy(() => import('./pages/Artworks'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Devices = lazy(() => import('./pages/Devices'));
const Login = lazy(() => import('./pages/Login'));
const NfcTags = lazy(() => import('./pages/NfcTags'));
const RegisterArtwork = lazy(() => import('./pages/RegisterArtwork'));
const SearchArtwork = lazy(() => import('./pages/SearchArtwork'));
const Team = lazy(() => import('./pages/Team'));

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="artworks" element={<Artworks />} />
          <Route path="artworks/register" element={<RegisterArtwork />} />
          <Route path="artworks/search" element={<SearchArtwork />} />

          <Route path="admin" element={<Admin />} />
          <Route path="admin/nfc-tags" element={<NfcTags />} />
          <Route path="admin/team" element={<Team />} />
          <Route path="admin/devices" element={<Devices />} />

          <Route path="*" element={<Login />} />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
