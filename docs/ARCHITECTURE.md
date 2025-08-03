# Patunay Admin Architecture

## Overview

Patunay Admin is a desktop application built with Electron and React for artwork authentication and management using NFC technology. The application follows a dual-process architecture with a clear separation between the main Electron process and the React renderer process.

## Technology Stack

### Core Technologies
- **Electron 33**: Cross-platform desktop application framework
- **React 19**: UI library with TypeScript
- **Vite**: Build tool and development server
- **TypeScript 5.8**: Type-safe development
- **Redux Toolkit**: State management with RTK Query
- **Supabase**: Backend as a Service (PostgreSQL + Auth)

### Key Libraries
- **nfc-pcsc**: NFC reader integration
- **react-router-dom v7**: Client-side routing
- **react-hook-form**: Form state management
- **@tanstack/react-table**: Data table functionality
- **Tailwind CSS + DaisyUI**: Styling framework
- **date-fns**: Date manipulation
- **lucide-react**: Icon library

## Application Architecture

### Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Process (Electron)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   main.ts   │  │ NFC Service  │  │ Resource Manager │  │
│  │             │  │              │  │                  │  │
│  │ - Window    │  │ - Device Mgmt│  │ - Stats          │  │
│  │ - IPC       │  │ - Read/Write │  │ - System Info    │  │
│  │ - Updates   │  │ - Status     │  │ - Logging        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ IPC Communication
┌─────────────────────────────┴───────────────────────────────┐
│                  Renderer Process (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Redux    │  │  RTK Query   │  │   Components     │  │
│  │    Store    │  │              │  │                  │  │
│  │ - Auth      │  │ - API Calls  │  │ - Pages          │  │
│  │ - NFC       │  │ - Caching    │  │ - UI Components  │  │
│  │ - UI State  │  │ - Mutations  │  │ - Hooks          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/WebSocket
┌─────────────────────────────┴───────────────────────────────┐
│                        Supabase Backend                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ PostgreSQL  │  │ Edge Functions│  │    Storage       │  │
│  │             │  │              │  │                  │  │
│  │ - Tables    │  │ - User Mgmt  │  │ - Artifacts      │  │
│  │ - RLS       │  │ - Role Mgmt  │  │ - User Avatars   │  │
│  │ - Functions │  │ - Auth       │  │                  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── electron/              # Main process code
│   ├── main.ts           # Application entry point
│   ├── nfc/              # NFC service implementation
│   ├── logging/          # Electron logging utilities
│   └── types/            # TypeScript definitions
│
├── ui/                   # Renderer process (React app)
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route-based page components
│   ├── store/           # Redux store configuration
│   ├── hooks/           # Custom React hooks
│   ├── context/         # React context providers
│   ├── supabase/        # Database operations
│   ├── utils/           # Utility functions
│   └── router/          # React Router configuration
│
└── shared/              # Code shared between processes
    └── types/           # Shared TypeScript types
```

## Component Architecture

### Component Organization

Components follow a feature-based organization pattern:

```
components/
├── [ComponentName]/
│   ├── [ComponentName].tsx    # Component implementation
│   ├── index.ts              # Export barrel
│   └── types.ts              # Component-specific types
```

### Component Categories

1. **Layout Components**
   - `DashboardLayout`: Main application layout
   - `SuspenseWrapper`: Loading state wrapper
   - `SuspenseContent`: Content loading handler

2. **Business Logic Components**
   - `ProtectedRoute`: Route-level access control
   - `PermissionGuard`: Component-level permissions
   - `ErrorBoundary`: Error handling wrapper

3. **UI Components**
   - Atomic components (Button, Input, Card)
   - Composite components (DataTable, Modal)
   - Feature components (NfcManager, UserTable)

4. **Page Components**
   - Dashboard views
   - CRUD interfaces
   - Admin panels

## State Management

### Redux Store Structure

```typescript
{
  // Feature slices
  auth: AuthState,              // Authentication state
  notification: NotificationState,  // UI notifications
  artwork: ArtworkState,        // Artwork-specific state
  nfc: NfcState,               // NFC device state
  
  // RTK Query API state
  api: {
    queries: {},              // Cached query data
    mutations: {},            // Mutation state
    provided: {},             // Cache tags
    subscriptions: {}         // Active subscriptions
  }
}
```

### RTK Query API Organization

API slices are organized by domain:

- `artworkApi`: Artwork CRUD operations
- `userApi`: Authentication and profiles
- `nfcApi`: NFC tag management
- `statisticsApi`: Dashboard analytics
- `storageApi`: File upload/download
- `userManagementApiV2`: User administration

### State Management Patterns

1. **Server State**: Managed by RTK Query
   - Automatic caching
   - Background refetching
   - Optimistic updates
   - Tag-based invalidation

2. **Client State**: Redux slices for UI state
   - NFC device status
   - UI preferences
   - Notification queue

3. **Form State**: React Hook Form
   - Form validation
   - Field-level errors
   - Submission handling

## Data Flow

### Typical Data Flow Pattern

1. **User Action** → Component event handler
2. **API Call** → RTK Query mutation/query
3. **Backend Processing** → Supabase RPC/REST
4. **Response** → RTK Query cache update
5. **UI Update** → React re-render

### NFC Communication Flow

1. **NFC Event** → Hardware detection (main process)
2. **IPC Message** → Send to renderer process
3. **Redux Action** → Update NFC state
4. **Component Update** → UI reflects NFC status
5. **User Action** → Trigger NFC operation
6. **IPC Request** → Send to main process
7. **Hardware Operation** → Read/write NFC tag
8. **Result** → Update UI via IPC response

## Security Architecture

### Authentication Flow

```
User Login → Supabase Auth → JWT Token → Session Storage
                                ↓
                          Redux Auth State
                                ↓
                          Protected Routes
```

### Authorization Layers

1. **Database Level**: Row Level Security (RLS)
2. **API Level**: Supabase Edge Functions
3. **Route Level**: ProtectedRoute components
4. **Component Level**: PermissionGuard wrapper
5. **Action Level**: Role-based UI rendering

### Security Features

- JWT-based authentication
- Automatic token refresh
- Role-based access control (RBAC)
- Fine-grained permissions
- Audit logging
- Input validation (Zod schemas)
- XSS protection
- CSRF protection via Supabase

## Performance Optimizations

### Code Splitting
- Route-based lazy loading
- Dynamic imports for heavy components
- Vendor bundle separation

### Caching Strategy
- RTK Query automatic caching
- Image preloading for artworks
- Local storage for preferences
- Service worker for offline support

### Rendering Optimizations
- React.memo for expensive components
- useMemo/useCallback for computations
- Virtual scrolling for large lists
- Debounced search inputs

## Build and Deployment

### Build Process

1. **Development Build**
   - Vite dev server (React)
   - TypeScript compilation (Electron)
   - Hot module replacement

2. **Production Build**
   - Vite production build
   - Electron Builder packaging
   - Code signing (platform-specific)
   - Auto-updater configuration

### Deployment Targets

- **macOS**: DMG installer (ARM64)
- **Windows**: NSIS installer (x64)
- **Linux**: AppImage (x64)

## Monitoring and Logging

### Logging Architecture

- **Renderer Process**: Browser console + custom logger
- **Main Process**: electron-log to file system
- **Log Locations**:
  - macOS: `~/Library/Logs/patunay-app/`
  - Windows: `%APPDATA%/patunay-app/logs/`
  - Linux: `~/.config/patunay-app/logs/`

### Error Tracking

- Error boundaries for React components
- Global error handlers for unhandled rejections
- Structured error logging with context
- Network error retry mechanisms

## Future Architecture Considerations

### Scalability
- Consider implementing service workers for offline functionality
- Evaluate WebAssembly for performance-critical operations
- Plan for real-time collaboration features

### Maintainability
- Continue modular architecture patterns
- Enhance test coverage
- Document component APIs
- Maintain TypeScript strict mode

### Security
- Implement certificate pinning for API calls
- Add biometric authentication support
- Enhanced audit logging
- Regular security audits