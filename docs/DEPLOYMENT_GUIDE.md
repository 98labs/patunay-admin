# Deployment Guide

## Overview

This guide covers the deployment process for Patunay Admin, including building, packaging, code signing, and distribution of the desktop application across different platforms.

## Build Requirements

### macOS
- macOS 10.15 or later
- Xcode Command Line Tools
- Apple Developer Certificate (for code signing)

### Windows
- Windows 10 or later
- Visual Studio Build Tools
- Windows SDK
- Code signing certificate (optional)

### Linux
- Ubuntu 18.04 or later (or equivalent)
- Build essentials
- AppImage tools

## Pre-Deployment Checklist

### 1. Environment Configuration
```bash
# Production environment file
cp .env.example .env.production

# Update with production values:
NODE_ENV=production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 2. Version Update
```json
// package.json
{
  "version": "1.0.16"  // Increment version
}
```

### 3. Database Migrations
```bash
# Apply all migrations to production
npx supabase db push --linked
```

### 4. Code Quality Checks
```bash
# Run all validations
npm run validate

# Includes:
# - Linting
# - Type checking
# - Unit tests
```

## Building the Application

### Full Build Process
```bash
# Clean previous builds
npm run clean

# Run production build
npm run build

# This executes:
# 1. Clean build directories
# 2. Build React app (Vite)
# 3. Build Electron app (TypeScript)
# 4. Package with Electron Builder
```

### Platform-Specific Builds

#### macOS Build
```bash
npm run dist:mac

# Output: dist/patunay-app-1.0.16-arm64.dmg
```

#### Windows Build
```bash
npm run dist:win

# Output: dist/patunay-app-1.0.16-x64.exe
```

#### Linux Build
```bash
npm run dist:linux

# Output: dist/patunay-app-1.0.16-x86_64.AppImage
```

## Code Signing

### macOS Code Signing

1. **Developer Certificate Setup**
```bash
# List available certificates
security find-identity -v -p codesigning

# Set in environment
export CSC_NAME="Developer ID Application: Your Company"
```

2. **Notarization Configuration**
```json
// electron-builder.json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist",
    "notarize": {
      "teamId": "YOUR_TEAM_ID"
    }
  }
}
```

3. **Build with Signing**
```bash
# With notarization
npm run dist:mac
```

### Windows Code Signing

1. **Certificate Setup**
```bash
# Convert to PFX if needed
openssl pkcs12 -export -out certificate.pfx -inkey private.key -in certificate.crt

# Set environment variables
export CSC_LINK=path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
```

2. **Build Configuration**
```json
// electron-builder.json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "${env.CSC_KEY_PASSWORD}",
    "signingHashAlgorithms": ["sha256"],
    "rfc3161TimeStampServer": "http://timestamp.digicert.com"
  }
}
```

## Auto-Update Configuration

### Update Server Setup

1. **GitHub Releases (Recommended)**
```json
// package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-org",
      "repo": "patunay-admin"
    }
  }
}
```

2. **Custom Update Server**
```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://updates.yourcompany.com/patunay"
    }
  }
}
```

### Update Feed Structure
```
updates/
├── latest-mac.yml
├── latest.yml (Windows)
├── latest-linux.yml
├── patunay-app-1.0.16-arm64.dmg
├── patunay-app-1.0.16-x64.exe
└── patunay-app-1.0.16-x86_64.AppImage
```

## Distribution

### GitHub Releases

1. **Create Release**
```bash
# Tag the release
git tag v1.0.16
git push origin v1.0.16

# Create release on GitHub
gh release create v1.0.16 \
  --title "Patunay Admin v1.0.16" \
  --notes "Release notes here" \
  dist/*.dmg dist/*.exe dist/*.AppImage
```

2. **Release Notes Template**
```markdown
## What's New
- Feature: Added batch artwork import
- Fix: Resolved NFC connection issues
- Improvement: Enhanced search performance

## Bug Fixes
- Fixed user session timeout
- Resolved image upload errors

## Known Issues
- Limited to 5 concurrent NFC readers

## Checksums
- macOS: sha256_hash_here
- Windows: sha256_hash_here
- Linux: sha256_hash_here
```

### Manual Distribution

1. **File Hosting**
   - Upload to S3/CDN
   - Set proper MIME types
   - Enable CORS if needed

2. **Download Page**
```html
<!-- Example download page -->
<div class="downloads">
  <a href="/downloads/patunay-app-1.0.16-arm64.dmg">
    Download for macOS (Apple Silicon)
  </a>
  <a href="/downloads/patunay-app-1.0.16-x64.exe">
    Download for Windows (64-bit)
  </a>
  <a href="/downloads/patunay-app-1.0.16-x86_64.AppImage">
    Download for Linux
  </a>
</div>
```

## Installation Instructions

### macOS Installation
1. Download the `.dmg` file
2. Open the downloaded file
3. Drag Patunay to Applications folder
4. First launch: Right-click and select "Open"
5. Grant necessary permissions (Camera, Files, etc.)

### Windows Installation
1. Download the `.exe` installer
2. Run the installer
3. Follow installation wizard
4. Launch from Start Menu or Desktop shortcut

### Linux Installation
1. Download the `.AppImage` file
2. Make it executable:
   ```bash
   chmod +x patunay-app-*.AppImage
   ```
3. Run the application:
   ```bash
   ./patunay-app-*.AppImage
   ```
4. Optional: Install AppImageLauncher for desktop integration

## Post-Deployment

### Monitoring

1. **Application Logs**
   - Monitor error reports
   - Track usage statistics
   - Review crash reports

2. **Update Analytics**
   - Track update adoption
   - Monitor download failures
   - Review version distribution

### User Support

1. **Documentation Updates**
   - Update user manual
   - Create release notes
   - Update FAQ

2. **Support Channels**
   - Email support
   - Issue tracker
   - User forum/Discord

## Rollback Procedures

### Emergency Rollback

1. **Disable Auto-Updates**
```yml
# latest-mac.yml
version: 1.0.15  # Previous version
files:
  - url: patunay-app-1.0.15-arm64.dmg
    sha512: previous_hash
```

2. **Notify Users**
   - Send email notification
   - Update website
   - Post in support channels

3. **Fix and Re-release**
   - Identify issue
   - Create hotfix
   - Test thoroughly
   - Release as new version

## Security Considerations

### Build Security
- Use CI/CD for consistent builds
- Scan dependencies for vulnerabilities
- Code sign all releases
- Generate checksums for verification

### Distribution Security
- Use HTTPS for all downloads
- Implement download verification
- Monitor for unauthorized distributions
- Regular security audits

## Troubleshooting

### Build Issues

**macOS Notarization Failures**
```bash
# Check notarization status
xcrun altool --notarization-info REQUEST_ID \
  --username "apple-id@example.com" \
  --password "@keychain:AC_PASSWORD"
```

**Windows Signing Issues**
- Verify certificate validity
- Check timestamp server availability
- Ensure correct certificate chain

**Linux Permission Issues**
```bash
# Fix AppImage permissions
chmod +x patunay-app-*.AppImage

# Desktop integration
./patunay-app-*.AppImage --appimage-integrate
```

### Distribution Issues

**Update Server Problems**
- Verify file permissions
- Check CORS configuration
- Monitor server logs
- Test with direct downloads

**User Installation Issues**
- Provide detailed error messages
- Include system requirements
- Offer manual installation guide
- Maintain support documentation

## Best Practices

1. **Version Control**
   - Tag all releases
   - Maintain changelog
   - Document breaking changes

2. **Testing**
   - Test on clean systems
   - Verify auto-update path
   - Check all platform variants

3. **Communication**
   - Announce releases early
   - Provide migration guides
   - Maintain status page

4. **Backup**
   - Keep previous versions
   - Backup signing certificates
   - Document build process