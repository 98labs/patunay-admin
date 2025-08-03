# Patunay Admin

A single-tenant artwork management system built with Electron, React, and TypeScript, featuring NFC tag integration for artwork tracking and authentication.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.development

# Start development server
npm run dev
```

## Documentation

For complete documentation, please see:
- [Full README](docs/README.md) - Complete project documentation
- [CLAUDE.md](docs/CLAUDE.md) - Development guide for Claude Code
- [Build Process](docs/BUILD_PROCESS.md) - Building and packaging guide

## Key Features

- 🎨 Comprehensive artwork management
- 🏷️ NFC tag integration for authentication
- 💰 Appraisal tracking system
- 👥 Role-based access control
- 📊 Analytics dashboard
- 🔐 Secure authentication via Supabase

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Redux Toolkit
- **Desktop**: Electron with auto-updater
- **Backend**: Supabase (PostgreSQL + Auth)
- **NFC**: nfc-pcsc library
- **UI**: Tailwind CSS + DaisyUI

## License

See [license.md](docs/license.md) for licensing information.