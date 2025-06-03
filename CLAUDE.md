# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Mode
- `npm run dev` - Start both React dev server and Electron in parallel (DevTools enabled by default)
- `npm run dev:devtools` - Explicitly enable DevTools (same as dev but clearer intent)
- `npm run dev:react` - Start only the React dev server (Vite on port 5173)
- `npm run dev:electron` - Start only Electron (requires transpiled code)
- `npm run devmac:electron` - macOS-specific Electron dev command

**DevTools Control:**
- DevTools open automatically in development mode
- To disable: `DISABLE_DEVTOOLS=true npm run dev`
- To force enable: `ENABLE_DEVTOOLS=true npm run dev` (or use `npm run dev:devtools`)

### Building
- `npm run build` - Full production build (clean + transpile + build React + Electron builder)
- `npm run build:react` - Build only the React frontend
- `npm run build:electron` - Build only Electron (transpile + electron-builder)
- `npm run transpile:electron` - Compile TypeScript for Electron main process

### Distribution
- `npm run dist:mac` - Build and package for macOS ARM64
- `npm run dist:win` - Build and package for Windows x64
- `npm run dist:linux` - Build and package for Linux x64

### Code Quality
- `npm run lint` - Run ESLint
- `npm run clean` - Remove all build artifacts

## Architecture Overview

### Application Structure
This is an Electron-based desktop application for artwork management and NFC tag functionality. The app uses a dual-process architecture:

**Main Process (Electron):**
- Entry point: `src/electron/main.ts`
- Handles NFC communication via `nfc-pcsc` library
- Manages system resources and statistics
- Auto-updater functionality
- Window creation and lifecycle

**Renderer Process (React):**
- Entry point: `src/ui/main.tsx`
- React 19 + TypeScript + Vite
- Router: React Router with HashRouter (App.tsx) and createBrowserRouter (router/index.tsx)
- State management: Redux Toolkit
- UI Framework: Tailwind CSS + DaisyUI

### Key Components

**NFC Integration:**
- `src/electron/nfc/nfcService.ts` - Core NFC read/write functionality
- Supports both read and write modes for NFC tags
- Communicates with renderer via IPC

**Database:**
- Supabase client configured in `src/ui/supabase/index.ts`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- RPC functions in `src/ui/supabase/rpc/` for data operations

**Page Structure:**
- Authentication: Login page
- Dashboard with nested routes:
  - `/dashboard` - Main dashboard
  - `/dashboard/artworks` - Artwork management and registration
  - `/dashboard/admin` - Admin functions (NFC tags, team, devices)

**State Management:**
- Redux store in `src/ui/lib/store.ts`
- Feature-specific slices in page directories
- Local storage keys defined in `src/ui/content/LocalStorageKeys.ts`

### Development Environment Setup
The application loads from `http://localhost:5173/login` in development mode, with the React dev server running on Vite. The Electron main process must be transpiled from TypeScript before running.

### Build Process
1. TypeScript compilation for Electron main process
2. React build via Vite
3. Electron Builder packages the application
4. Assets from `src/assets` are included as extra resources