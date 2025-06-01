// Use shared types for consistency between Electron and UI processes
import type { ElectronAPI } from "../../shared/types/electron";

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
