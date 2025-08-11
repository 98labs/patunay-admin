# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Mode
- `npm run dev` - Start both React dev server and Electron in parallel
- `npm run dev:devtools` - Start with DevTools explicitly enabled
- `npm run dev:react` - Start only the React dev server (Vite on port 5173)
- `npm run dev:electron` - Start only Electron (requires transpiled code)
- `npm run dev:electron:devtools` - Start Electron with DevTools enabled

**DevTools Control:**
- DevTools open automatically in development mode
- To disable: `DISABLE_DEVTOOLS=true npm run dev`
- To force enable: `ENABLE_DEVTOOLS=true npm run dev`

### Building
- `npm run build` - Full production build (clean + build React & Electron + package)
- `npm run build:validate` - Run validation checks before building
- `npm run build:react` - Build only the React frontend
- `npm run build:electron` - Build only Electron (TypeScript compilation)

### Distribution
- `npm run dist:mac` - Build and package for macOS ARM64
- `npm run dist:win` - Build and package for Windows x64
- `npm run dist:linux` - Build and package for Linux x64

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking for both UI and Electron
- `npm run validate` - Run all validation checks (lint, type-check, tests)
- `npm run clean` - Remove all build artifacts

**Important:** Always run `npm run validate` before committing to ensure code quality and tests pass.

## Architecture Overview

### Application Structure
This is an Electron-based desktop application for artwork management with NFC tag integration. The app uses a dual-process architecture:

**Main Process (Electron):**
- Entry point: `src/electron/main.ts`
- Handles NFC communication via `nfc-pcsc` library
- Manages system resources and statistics
- Auto-updater functionality via electron-updater
- Window creation and lifecycle management
- IPC communication with renderer process

**Renderer Process (React):**
- Entry point: `src/ui/main.tsx`
- React 19 + TypeScript + Vite
- State management: Redux Toolkit with RTK Query
- UI Framework: Tailwind CSS + DaisyUI
- Router: React Router with createBrowserRouter
- Component structure: Atomic design pattern

### Key Dependencies
- **@supabase/supabase-js**: Database and authentication
- **nfc-pcsc**: NFC tag communication (Electron main process only)
- **@reduxjs/toolkit**: State management with RTK Query
- **react-router-dom**: Client-side routing with createBrowserRouter
- **react-hook-form**: Form handling with Zod validation
- **@tanstack/react-table**: Data tables with sorting/filtering
- **date-fns**: Date manipulation utilities
- **lucide-react**: Icon library
- **tailwindcss + daisyui**: Styling framework and component library
- **electron-updater**: Auto-update functionality

### Database & Authentication
- **Supabase** for PostgreSQL database with Row Level Security (RLS)
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- RPC functions wrapped in `src/ui/supabase/rpc/`
- **Single-tenant architecture** (simplified from multi-tenant as of Aug 2025)

### RBAC System (Role-Based Access Control)
**User Roles (Hierarchical):**
1. `admin` - Full administrative access
2. `issuer` - Can issue artworks and manage NFC tags
3. `appraiser` - Can create and manage appraisals
4. `staff` - General staff access
5. `viewer` - Read-only access

**Key Features:**
- Single-tenant system (no organization/location management)
- Role-based permissions
- Fine-grained user permissions via `user_permissions` table
- Permission guards on UI components

### State Management Architecture
- **Redux Toolkit** store in `src/ui/store/`
- **RTK Query** APIs in `src/ui/store/api/`
- Feature slices use Redux Toolkit's createSlice
- Middleware for logging and error handling

### Component Architecture
**Directory Structure:**
```
src/ui/
├── components/      # Reusable UI components
├── pages/          # Route-based page components
├── layouts/        # Layout components
├── hooks/          # Custom React hooks
├── context/        # React contexts
├── store/          # Redux store and slices
├── supabase/       # Database operations
└── utils/          # Utility functions
```

**Component Patterns:**
- Each component in its own folder with `ComponentName.tsx` and `index.ts`
- Lazy loading for route-based code splitting (see `LazyComponents.tsx`)
- Error boundaries for graceful error handling (`EnhancedErrorBoundary`)
- Suspense wrappers for loading states (`SuspenseWrapper`)
- Path aliases: `@components`, `@pages`, `@hooks`, `@typings` for clean imports

### NFC Integration
**Main Process:**
- `src/electron/nfc/nfcService.ts` - Core NFC service
- Supports read/write operations
- Real-time status monitoring
- Error handling and recovery

**Renderer Process:**
- `NfcStatusContext` for global NFC state
- `useNfc` hook for NFC operations
- Real-time status updates via IPC

### Key Application Routes
- `/login` - Authentication
- `/dashboard` - Main dashboard with statistics
- `/dashboard/artworks` - Artwork management and listing
- `/dashboard/artworks/:id` - Detailed artwork view
- `/dashboard/artworks/register` - Multi-step artwork registration
- `/dashboard/artworks/search` - Search artworks with NFC support
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/nfc-tags` - NFC tag management
- `/dashboard/admin/users` - User and role management

### Build & Deployment
**Build Output:**
- `dist-react/` - Built React application (Vite output)
- `dist-electron/` - Compiled Electron code (TypeScript → JavaScript)
- `dist/` - Packaged applications (electron-builder output)

**Vite Configuration:**
- Manual chunk splitting for optimal loading (see `vite.config.ts`)
- Path aliases for clean imports
- Bundle size optimization with chunk size warnings

**Auto-Update:**
- Uses electron-updater for automatic updates
- Update configuration in `electron-builder.json`
- Platform-specific builds: macOS (ARM64), Windows (x64), Linux (x64)

### Development Best Practices
1. **TypeScript:** Use strict type checking (see `eslint.config.js`)
2. **Components:** Follow atomic design principles, each in own folder
3. **State:** Use RTK Query for server state, Redux for client state
4. **Errors:** Implement proper error boundaries (`EnhancedErrorBoundary`)
5. **Logging:** Use structured logging with categories (renderer + electron)
6. **Security:** Follow RLS patterns, sanitize inputs, use Zod validation
7. **Performance:** Lazy load routes, memoize expensive operations, manual chunking
8. **Code Quality:** Always run `npm run validate` before committing

### Common Tasks

**Adding a New Page:**
1. Create component in `src/ui/pages/YourPage/` with `YourPage.tsx` and `index.ts`
2. Add lazy-loaded export to `LazyComponents.tsx`
3. Add route in `router/index.tsx` with proper error boundary
4. Add navigation item in `Sidebar.tsx` if needed
5. Add permission guards using `PermissionGuard` if required

**Adding an API Endpoint:**
1. Add RPC function in `src/ui/supabase/rpc/` with proper error handling
2. Create RTK Query endpoint in appropriate API file (`artworkApi.ts`, etc.)
3. Use in components with generated hooks (`useGetArtworksQuery`, etc.)
4. Follow existing patterns for optimistic updates and cache invalidation

**Adding NFC Functionality:**
1. Extend `nfcService.ts` in Electron main process
2. Update IPC types in `src/electron/types/electronApi.ts`
3. Update renderer hooks in `src/ui/hooks/useNfc.ts`
4. Test with NFC status context for real-time updates

**Managing State:**
1. Server state: Use RTK Query with proper cache management
2. UI state: Use component state or React Context
3. Global UI state: Create Redux slice in `store/features/`
4. Form state: Use react-hook-form with Zod validation

### Environment Variables
**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional:**
- `NODE_ENV` - development/production
- `DISABLE_DEVTOOLS` - Disable DevTools in development
- `ENABLE_DEVTOOLS` - Force enable DevTools
- `VITE_NETWORK_TEST_ENDPOINT` - Endpoint for network connectivity checks
- `VITE_NETWORK_TEST_INTERVAL` - Interval for network checks (ms)
- `VITE_LOG_LEVEL` - Logging level (debug/info/warn/error)

### Database Schema (Key Tables)
- `profiles` - User profiles with roles and permissions
- `artworks` - Artwork metadata and information
- `nfc_tags` - NFC tag registry (formerly `tags`)
- `artwork_images` - Artwork image files (formerly `assets`)
- `artwork_appraisers` - Appraisal information
- `user_permissions` - Fine-grained permission assignments
- `user_sessions` - Active user sessions
- `locations` - Physical locations (retained for future use)
- `location_users` - User-location assignments

### Supabase Edge Functions
Located in `supabase/functions/`:
- `create-user` - Create new users with profiles
- `role-management` - Manage user roles and permissions
- `user-management` - General user management operations

### Storage Buckets
- `artifacts` - Artwork images and files (public access)
- `user-avatars` - User profile pictures (public access, 5MB limit)

### Debugging Tips
1. Check browser DevTools console for React errors
2. Check Electron main process console for system errors
3. Redux DevTools for state debugging
4. Network tab for API calls
5. Application logs in:
   - macOS: `~/Library/Logs/patunay-app/`
   - Windows: `%USERPROFILE%\AppData\Roaming\patunay-app\logs\`
   - Linux: `~/.config/patunay-app/logs/`

### Testing Strategy
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Mock Supabase calls in tests
- Test utilities in `src/ui/test/`