import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import {
  Admin,
  Artworks,
  Dashboard,
  Devices,
  Login,
  NfcTags,
  RegisterArtwork,
  SearchArtwork,
  Team,
} from "./pages";
import { DashboardLayout } from "./layouts";

function App() {
  return (
    <BrowserRouter>
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

          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
