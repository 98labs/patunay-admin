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
- `npm run type-check` - Run TypeScript type checking
- `npm run validate` - Run all validation checks (lint, type-check, tests)
- `npm run clean` - Remove all build artifacts

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
- **nfc-pcsc**: NFC tag communication
- **@reduxjs/toolkit**: State management
- **react-router-dom**: Client-side routing
- **react-hook-form**: Form handling
- **@tanstack/react-table**: Data tables
- **date-fns**: Date manipulation
- **lucide-react**: Icon library

### Database & Authentication
- **Supabase** for PostgreSQL database with Row Level Security (RLS)
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- RPC functions wrapped in `src/ui/supabase/rpc/`
- Multi-tenant architecture with organization-based access control
- Edge functions for privileged operations (user creation)

### Multi-Tenant RBAC System
**User Roles (Hierarchical):**
1. `super_user` - System-wide admin access
2. `admin` - Organization admin
3. `issuer` - Can issue artworks and manage NFC tags
4. `appraiser` - Can create and manage appraisals
5. `staff` - General staff access
6. `viewer` - Read-only access

**Key Features:**
- Organization-based multi-tenancy
- Location/branch-based access control
- Cross-organizational permissions
- Permission guards on UI components

**Database Tables:**
- `organizations` - Organization entities
- `organization_users` - User-organization membership
- `locations` - Organization branches/locations
- `location_users` - User-location assignments
- `cross_org_permissions` - Cross-organization access
- `profiles` - User profiles with roles

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
- Lazy loading for route-based code splitting
- Error boundaries for graceful error handling
- Suspense wrappers for loading states

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
- `/dashboard` - Main dashboard
- `/dashboard/artworks` - Artwork management
- `/dashboard/register-artwork` - Multi-step artwork registration
- `/dashboard/search-artwork` - Search with NFC support
- `/dashboard/admin` - Admin functions
- `/dashboard/nfc-tags` - NFC tag management
- `/dashboard/user-management` - User and role management
- `/dashboard/organizations` - Organization management
- `/dashboard/locations` - Location management
- `/dashboard/super-admin` - Super admin panel

### Build & Deployment
**Build Output:**
- `dist-react/` - Built React application
- `dist-electron/` - Compiled Electron code
- `dist/` - Packaged applications

**Build Configuration:**
- Electron Builder config in `package.json` build section
- Alternative config in `electron-builder.json`
- Icons in `build/` directory

**Auto-Update:**
- Uses electron-updater for automatic updates
- Update configuration in `electron-builder.json`

### Development Best Practices
1. **TypeScript:** Use strict type checking
2. **Components:** Follow atomic design principles
3. **State:** Use RTK Query for server state, Redux for client state
4. **Errors:** Implement proper error boundaries
5. **Logging:** Use structured logging with categories
6. **Security:** Follow RLS patterns, sanitize inputs
7. **Performance:** Lazy load routes, memoize expensive operations

### Common Tasks

**Adding a New Page:**
1. Create component in `src/ui/pages/YourPage/`
2. Add to `LazyComponents.tsx`
3. Add route in `router/index.tsx`
4. Add navigation item if needed

**Adding an API Endpoint:**
1. Add RPC function in `src/ui/supabase/rpc/`
2. Create RTK Query endpoint in appropriate API file
3. Use in components with generated hooks

**Managing State:**
1. Server state: Use RTK Query
2. UI state: Use component state or Redux slice
3. Global UI state: Create Redux slice in `store/features/`

**Working with NFC:**
1. Check NFC status with `useNfc()` hook
2. Use `NfcListener` component for automatic detection
3. Handle NFC events via Redux middleware
4. Monitor status with `NfcStatusIndicator`

### Environment Variables
**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional:**
- `NODE_ENV` - development/production
- `DISABLE_DEVTOOLS` - Disable DevTools in development
- `ENABLE_DEVTOOLS` - Force enable DevTools

**Build-time Variables:**
- Environment variables for electron-builder in `electron-builder.env`
- Sample provided in `electron-builder.env.sample`

### Database Migrations
**Location:** `supabase/migrations/`

**Key Migrations:**
- `20250626_multi_tenant_rbac_final.sql` - Multi-tenant RBAC setup
- `20250802232355_create_dashboard_statistics_views.sql` - Dashboard views

**Running Migrations:**
```bash
# Apply migrations
supabase db push

# Reset database (caution!)
supabase db reset
```

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

### Security Considerations
**Row Level Security (RLS):**
- All database tables have RLS policies
- Organization-scoped data access
- Cross-org permissions require explicit grants

**Client Security:**
- No service role key in client code
- Edge functions for privileged operations
- Input sanitization for all user inputs
- XSS protection via React

**Authentication Flow:**
- Supabase Auth handles authentication
- Session stored in localStorage
- Auto-refresh tokens
- Permission checks on every request

### Performance Optimization
**Bundle Optimization:**
- Route-based code splitting
- Vendor chunks separation
- Tree shaking enabled
- Date-fns instead of moment.js

**Runtime Optimization:**
- React.memo for expensive components
- useMemo/useCallback for computations
- Virtual scrolling for large lists
- Debounced search inputs

### Troubleshooting

**NFC Issues:**
- Ensure NFC reader is connected
- Check system permissions for USB devices
- Restart the application if NFC stops responding
- Check logs for detailed error messages

**Build Issues:**
- Run `npm run clean` before rebuilding
- Check Node version compatibility (18+)
- Ensure all environment variables are set
- Check electron-builder logs in `release/`

**Authentication Issues:**
- Check Supabase connection
- Verify RLS policies in database
- Check user roles and permissions
- Review auth logs in DevTools

### Key Files Reference
- Main process entry: `src/electron/main.ts`
- Renderer entry: `src/ui/main.tsx`
- Router config: `src/ui/router/index.tsx`
- Store config: `src/ui/store/store.ts`
- Supabase client: `src/ui/supabase/index.ts`
- NFC service: `src/electron/nfc/nfcService.ts`
- Build config: `package.json` (build section)
