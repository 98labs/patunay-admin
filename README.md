# Patunay Admin

<div align="center">
  <img src="public/PatunayLogo.svg" alt="Patunay Logo" width="200"/>
  
  <h3>NFC-Powered Artwork Authentication & Management System</h3>
  
  [![Electron](https://img.shields.io/badge/Electron-33.3.0-47848F?logo=electron)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
</div>

## 🎨 Overview

Patunay Admin is a desktop application for managing artwork authentication using NFC technology. Built with Electron and React, it provides a secure, multi-tenant platform for galleries, museums, and art institutions to manage their collections with cutting-edge authentication technology.

### ✨ Key Features

- **NFC Authentication**: Read/write NFC tags for artwork verification
- **Multi-Tenant Architecture**: Organization and location-based access control
- **Role-Based Access Control**: Six-tier permission system (Super User → Viewer)
- **Artwork Management**: Complete lifecycle from registration to appraisal
- **Cross-Platform**: Windows, macOS, and Linux support
- **Auto-Updates**: Seamless application updates via electron-updater
- **Real-time Sync**: Powered by Supabase for instant data synchronization

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Supabase Account**: For backend services
- **NFC Reader**: ACR122U or compatible PC/SC reader (for NFC features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/patunay/patunay-admin.git
   cd patunay-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.development
   
   # Edit with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development mode**
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Available Scripts

#### Development
```bash
npm run dev                 # Start both React and Electron
npm run dev:react          # Start only React dev server
npm run dev:electron       # Start only Electron
npm run dev:devtools       # Start with DevTools enabled
```

#### Building
```bash
npm run build              # Production build
npm run build:validate     # Build with validation
npm run dist:mac          # Build for macOS
npm run dist:win          # Build for Windows
npm run dist:linux        # Build for Linux
```

#### Testing
```bash
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run E2E tests
```

#### Code Quality
```bash
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run format            # Format with Prettier
npm run type-check        # TypeScript validation
npm run validate          # Run all checks
```

### Project Structure

```
patunay-admin/
├── src/
│   ├── electron/         # Electron main process
│   │   ├── main.ts      # Entry point
│   │   ├── nfc/         # NFC service
│   │   └── types/       # TypeScript types
│   ├── ui/              # React application
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Route pages
│   │   ├── store/       # Redux store
│   │   ├── supabase/    # Database layer
│   │   └── main.tsx     # React entry
│   └── shared/          # Shared utilities
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── build/              # Build resources
```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Electron 33
- **State Management**: Redux Toolkit + RTK Query
- **UI Framework**: Tailwind CSS + DaisyUI
- **Database**: Supabase (PostgreSQL)
- **NFC**: nfc-pcsc library
- **Testing**: Vitest + React Testing Library + Playwright

### Multi-Tenant RBAC

The application implements a hierarchical role system:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super User** | System administrator | Full access across all organizations |
| **Admin** | Organization administrator | Manage organization users and settings |
| **Issuer** | Artwork issuer | Create artworks, manage NFC tags |
| **Appraiser** | Art appraiser | Add appraisals to artworks |
| **Staff** | General staff | View and update artwork information |
| **Viewer** | Read-only user | View basic artwork information |

### Key Components

- **NFC Integration**: Real-time NFC tag reading/writing
- **Authentication**: Supabase Auth with row-level security
- **File Storage**: Supabase Storage for artwork images
- **Real-time Updates**: WebSocket connections for live data
- **Auto-updater**: Electron-updater for seamless updates

## 🔧 Configuration

### Environment Variables

Create `.env.development` for development:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development Settings
NODE_ENV=development
DISABLE_DEVTOOLS=false
```

### Build Configuration

Electron Builder configuration is in `package.json`:

```json
{
  "build": {
    "appId": "com.patunay.app",
    "productName": "Patunay",
    "directories": {
      "buildResources": "build",
      "output": "dist"
    }
  }
}
```

## 📦 Deployment

### Building for Production

1. **Prepare environment**
   ```bash
   cp .env.example .env.production
   # Add production credentials
   ```

2. **Build for your platform**
   ```bash
   # macOS
   npm run dist:mac
   
   # Windows
   npm run dist:win
   
   # Linux
   npm run dist:linux
   ```

3. **Distribute**
   - Built applications will be in the `dist/` directory
   - Use the appropriate installer for each platform

### Auto-Updates

The application includes auto-update functionality:
- Updates are checked on startup
- Users are notified of available updates
- Updates can be installed automatically or manually

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # Coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # With UI
```

### Test Structure
```
src/ui/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx
│       └── index.ts
└── test/
    ├── setup.ts
    └── test-utils.tsx
```

## 🐛 Troubleshooting

### Common Issues

#### NFC Reader Not Detected
- Ensure the NFC reader is properly connected
- Check USB permissions on Linux
- Restart the application
- Check logs for driver issues

#### Build Failures
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

#### Authentication Issues
- Verify Supabase credentials
- Check network connectivity
- Review RLS policies in Supabase dashboard

### Debug Mode

Enable detailed logging:
```bash
# Development with logs
DEBUG=* npm run dev

# Force enable DevTools
ENABLE_DEVTOOLS=true npm run dev
```

### Log Locations
- **macOS**: `~/Library/Logs/patunay-app/`
- **Windows**: `%USERPROFILE%\AppData\Roaming\patunay-app\logs\`
- **Linux**: `~/.config/patunay-app/logs/`

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Use conventional commits for clear history

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Component files include tests
- Atomic design principles for UI components

## 📚 Documentation

- [Architecture Overview](docs/BUILD_PROCESS.md)
- [Multi-Tenant RBAC](docs/MULTI_TENANT_RBAC_IMPLEMENTATION_STRATEGY.md)
- [Claude AI Integration](CLAUDE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)

## 🔒 Security

- All data transmission encrypted via HTTPS
- Row-level security in database
- No sensitive keys in client code
- Regular dependency updates
- Input sanitization on all forms

### Reporting Security Issues

Please report security vulnerabilities to: security@patunay.com

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Desktop framework
- [React](https://reactjs.org/) - UI library
- [Supabase](https://supabase.com/) - Backend services
- [nfc-pcsc](https://github.com/pokusew/nfc-pcsc) - NFC integration

## 📞 Support

- **Documentation**: [docs.patunay.com](https://docs.patunay.com)
- **Issues**: [GitHub Issues](https://github.com/patunay/patunay-admin/issues)
- **Email**: support@patunay.com

---

<div align="center">
  Made with ❤️ by the Patunay Team
</div>