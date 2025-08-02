# Patunay Admin

A comprehensive artwork management system built with Electron, React, and TypeScript, featuring NFC tag integration for artwork tracking and authentication.

## Overview

Patunay Admin is a desktop application designed for art galleries, museums, and collectors to manage artwork collections, track provenance, and utilize NFC technology for artwork authentication and information access.

## Key Features

### 🎨 Artwork Management
- Complete artwork registration with detailed metadata
- Image upload and management
- Artwork editing and deletion
- Advanced search and filtering capabilities
- Detailed artwork views with full history

### 🏷️ NFC Integration
- NFC tag reading and writing capabilities
- Attach/detach NFC tags to artworks
- Real-time NFC status monitoring
- NFC tag management dashboard

### 💰 Appraisal System
- Create and manage artwork appraisals
- Track appraisal history
- Multiple appraiser support
- Appraisal data visualization

### 👥 User Management
- Multi-tenant role-based access control (RBAC)
- 6 user roles: super_user, admin, issuer, appraiser, staff, viewer
- Organization and location-based access control
- Cross-organizational permissions
- User authentication via Supabase
- Profile management with avatar support

### 🏢 Organization Management
- Multi-organization support
- Location/branch management
- Organization-specific settings
- Member management and invitations

### 📊 Dashboard & Analytics
- Real-time statistics and metrics
- Organization and location-based analytics
- Activity feed
- System health monitoring
- Data visualization with charts
- Export capabilities

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for development and building
- **Redux Toolkit** for state management
- **RTK Query** for API data fetching
- **Tailwind CSS** + **DaisyUI** for styling
- **React Router** for navigation

### Desktop Framework
- **Electron** for cross-platform desktop app
- **NFC-PCSC** for NFC tag communication
- **electron-updater** for auto-updates

### Backend & Database
- **Supabase** for authentication and database
- PostgreSQL with Row Level Security (RLS)
- Real-time subscriptions
- File storage for artwork images

## Project Structure

```
src/
├── electron/          # Electron main process
│   ├── main.ts        # Application entry point
│   ├── nfc/           # NFC service integration
│   └── logging/       # Electron logging
├── ui/                # React frontend
│   ├── components/    # Reusable UI components
│   ├── pages/         # Application pages
│   ├── store/         # Redux store and API
│   ├── hooks/         # Custom React hooks
│   └── supabase/      # Database operations
└── shared/            # Shared code between processes
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- NFC reader hardware (for NFC functionality)
- Supabase project with proper configuration

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd patunay-admin
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.development
# Edit .env.development with your Supabase credentials
```

4. Start development server
```bash
npm run dev
```

This will start both the React dev server (port 5173) and Electron application.

## Development Commands

### Development Mode
- `npm run dev` - Start both React and Electron in development mode
- `npm run dev:react` - Start only React dev server
- `npm run dev:electron` - Start only Electron (requires transpiled code)
- `npm run dev:devtools` - Start with DevTools explicitly enabled

### Building
- `npm run build` - Full production build
- `npm run build:react` - Build React frontend only
- `npm run build:electron` - Build Electron app only
- `npm run build:validate` - Run validation before building

### Distribution
- `npm run dist:mac` - Package for macOS ARM64
- `npm run dist:win` - Package for Windows x64
- `npm run dist:linux` - Package for Linux x64

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests with Playwright

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format with Prettier
- `npm run type-check` - TypeScript type checking
- `npm run validate` - Run all checks
- `npm run clean` - Remove build artifacts

## Environment Configuration

### Required Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Configuration
```env
NODE_ENV=development|production
DISABLE_DEVTOOLS=true    # Disable DevTools in development
ENABLE_DEVTOOLS=true     # Force enable DevTools
```

## Application Architecture

### Dual Process Architecture
- **Main Process**: Handles system integration, NFC communication, and application lifecycle
- **Renderer Process**: React-based UI with full artwork management capabilities

### Key Design Patterns
- **Redux Toolkit** for predictable state management
- **RTK Query** for efficient data fetching and caching
- **Component composition** with reusable UI components
- **Hook-based architecture** for logic reuse
- **RPC pattern** for Supabase database operations

## Features in Detail

### NFC Functionality
- Read existing NFC tags to identify artworks
- Write artwork IDs to blank NFC tags
- Monitor NFC reader status and connectivity
- Support for various NFC tag types

### Artwork Registration Workflow
1. Basic artwork information entry
2. Image upload and management
3. Size and technical specifications
4. Bibliography and provenance
5. Collector information
6. NFC tag attachment
7. Final review and submission

### Security Features
- Row Level Security (RLS) in Supabase
- Role-based access control
- Organization-scoped data access
- Secure file upload handling
- Data sanitization and validation

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Add appropriate tests for new features
4. Update documentation as needed
5. Follow the logging best practices outlined in `docs/LOGGING_BEST_PRACTICES.md`

## Documentation

- [CLAUDE.md](CLAUDE.md) - Development guide for Claude Code
- [Build Process](BUILD_PROCESS.md)
- [Logging Best Practices](LOGGING_BEST_PRACTICES.md)
- [Multi-Tenant RBAC Implementation](MULTI_TENANT_RBAC_IMPLEMENTATION_STRATEGY.md)
- [Locations Feature](LOCATIONS_FEATURE.md)
- [Edge Function Setup](EDGE_FUNCTION_SETUP.md)
- [RBAC Test Scenarios](RBAC_TEST_SCENARIOS.md)
- [Security Review](../review/SECURITY-REVIEW.md)

## Troubleshooting

### Common Issues

1. **NFC Reader Not Detected**
   - Ensure NFC reader is properly connected
   - Check system permissions for USB devices
   - Restart the application

2. **Login Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Clear local storage and try again

3. **Build Failures**
   - Run `npm run clean` and rebuild
   - Ensure all dependencies are installed
   - Check Node.js version compatibility

### Debug Locations

Application logs can be found in:
- macOS: `~/Library/Logs/patunay-app/`
- Windows: `%USERPROFILE%\AppData\Roaming\patunay-app\logs\`
- Linux: `~/.config/patunay-app/logs/`

## License

See [license.md](license.md) for licensing information.