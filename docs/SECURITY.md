# Security Documentation

## Overview

This document outlines the security measures, best practices, and considerations implemented in Patunay Admin to protect user data, ensure system integrity, and maintain secure operations.

## Authentication & Authorization

### Authentication System

Patunay Admin uses Supabase Auth for secure authentication:

```typescript
// Authentication flow
User Login → Supabase Auth → JWT Token → Secure Session
                    ↓
              Token Refresh → Automatic renewal
                    ↓
              Session Expiry → Force re-authentication
```

### Security Features
- **JWT-based authentication** with short-lived tokens
- **Automatic token refresh** before expiration
- **Secure password requirements** (minimum 8 characters)
- **Session management** with configurable timeouts
- **Multi-factor authentication** support (via Supabase)

### Authorization Model

#### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  ADMIN = 'admin',          // Full system access
  ISSUER = 'issuer',        // Artwork and NFC management
  APPRAISER = 'appraiser',  // Appraisal management
  STAFF = 'staff',          // General operations
  VIEWER = 'viewer'         // Read-only access
}
```

#### Permission Matrix
| Feature | Admin | Issuer | Appraiser | Staff | Viewer |
|---------|-------|--------|-----------|-------|---------|
| View Artworks | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Artworks | ✓ | ✓ | × | ✓ | × |
| Delete Artworks | ✓ | × | × | × | × |
| Manage NFC Tags | ✓ | ✓ | × | × | × |
| Create Appraisals | ✓ | × | ✓ | × | × |
| User Management | ✓ | × | × | × | × |
| System Settings | ✓ | × | × | × | × |

### Implementation

#### Protected Routes
```typescript
// Route protection
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Permission checks
function ProtectedRoute({ children, requiredRole }) {
  const user = useAuth();
  
  if (!hasRole(user, requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

#### API Security
```typescript
// API endpoint protection
async function createArtwork(data: CreateArtworkDto) {
  // Server-side validation
  const user = await getCurrentUser();
  
  if (!canCreateArtwork(user)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // Proceed with creation
}
```

## Database Security

### Row Level Security (RLS)

All database tables implement RLS policies:

```sql
-- Example: Artworks table RLS
CREATE POLICY "Users can view artworks" ON public.artworks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Authorized users can create artworks" ON public.artworks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('admin', 'issuer', 'staff')
        AND is_active = true
    )
  );
```

### Data Protection

#### Encryption
- **At Rest**: Database encryption via Supabase
- **In Transit**: TLS/SSL for all communications
- **Sensitive Data**: Additional application-level encryption

#### Data Sanitization
```typescript
// Input sanitization
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// SQL injection prevention (via Supabase)
const { data, error } = await supabase
  .from('artworks')
  .select('*')
  .eq('id', sanitizedId); // Parameterized queries
```

### Audit Logging

All sensitive operations are logged:

```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

// Logging implementation
async function logAuditEvent(event: AuditLog) {
  await supabase.from('audit_logs').insert(event);
}
```

## Application Security

### Input Validation

#### Schema Validation
```typescript
// Using Zod for validation
const ArtworkSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  catalogNumber: z.string().regex(/^[A-Z0-9-]+$/),
  artist: z.string().max(255),
  year: z.string().regex(/^\d{4}$/)
});

// Validate before processing
function validateArtwork(data: unknown) {
  return ArtworkSchema.parse(data);
}
```

#### File Upload Security
```typescript
// File validation
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Additional virus scanning can be added here
}
```

### XSS Prevention

#### Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

#### React Security
```typescript
// Safe rendering
function ArtworkDisplay({ artwork }) {
  return (
    <div>
      {/* React automatically escapes content */}
      <h1>{artwork.title}</h1>
      
      {/* Dangerous HTML requires explicit opt-in */}
      <div dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(artwork.description)
      }} />
    </div>
  );
}
```

### Electron Security

#### Main Process Security
```typescript
// main.ts security configuration
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true
  }
});

// Disable remote module
require('@electron/remote/main').initialize();
```

#### IPC Security
```typescript
// Validate IPC messages
ipcMain.handle('nfc:read', async (event, args) => {
  // Validate sender
  if (!isRendererTrusted(event.sender)) {
    throw new Error('Untrusted sender');
  }
  
  // Validate arguments
  if (!isValidReadRequest(args)) {
    throw new Error('Invalid arguments');
  }
  
  // Process request
  return await nfcService.read(args);
});
```

## NFC Security

### Tag Security

#### UID Verification
```typescript
// Verify tag authenticity
async function verifyTag(tagUid: string): Promise<boolean> {
  // Check if tag is registered
  const tag = await getTagByUid(tagUid);
  if (!tag) return false;
  
  // Verify tag hasn't been tampered with
  if (tag.writeCount !== tag.expectedWriteCount) {
    await flagSuspiciousTag(tagUid);
    return false;
  }
  
  return true;
}
```

#### Write Protection
```typescript
// Secure tag writing
async function writeTag(tagUid: string, data: TagData) {
  // Verify permissions
  if (!hasPermission('write_nfc_tags')) {
    throw new Error('Insufficient permissions');
  }
  
  // Log write operation
  await logTagWrite(tagUid, currentUser.id);
  
  // Write with verification
  await nfcService.write(tagUid, data);
  await verifyTagData(tagUid, data);
}
```

## Network Security

### API Communication

#### Request Security
```typescript
// Secure API client configuration
const apiClient = axios.create({
  baseURL: process.env.VITE_SUPABASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': APP_VERSION
  }
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Certificate Pinning (Future)
```typescript
// Planned implementation
const httpsAgent = new https.Agent({
  ca: fs.readFileSync('path/to/ca-cert.pem'),
  checkServerIdentity: (host, cert) => {
    // Verify certificate fingerprint
    const fingerprint = cert.fingerprint;
    if (fingerprint !== EXPECTED_FINGERPRINT) {
      throw new Error('Certificate mismatch');
    }
  }
});
```

## Data Privacy

### Personal Data Handling

#### Data Minimization
- Collect only necessary information
- Implement data retention policies
- Provide data export capabilities
- Support account deletion

#### GDPR Compliance
```typescript
// Data export
async function exportUserData(userId: string) {
  const data = {
    profile: await getProfile(userId),
    artworks: await getUserArtworks(userId),
    activities: await getUserActivities(userId),
    // ... other user data
  };
  
  return formatForExport(data);
}

// Data deletion
async function deleteUserData(userId: string) {
  // Soft delete with retention period
  await markForDeletion(userId);
  
  // Schedule permanent deletion
  await scheduleDataPurge(userId, RETENTION_DAYS);
}
```

## Security Best Practices

### Development Practices

1. **Dependency Management**
   ```bash
   # Regular security audits
   npm audit
   npm audit fix
   
   # Keep dependencies updated
   npm update
   ```

2. **Code Reviews**
   - Security-focused review checklist
   - Automated security scanning
   - Regular penetration testing

3. **Secret Management**
   ```bash
   # Never commit secrets
   # Use environment variables
   VITE_SUPABASE_URL=xxx
   VITE_SUPABASE_ANON_KEY=xxx
   
   # Rotate keys regularly
   # Use secret management tools
   ```

### Incident Response

#### Security Incident Procedure
1. **Detection**: Monitor logs and alerts
2. **Assessment**: Evaluate impact and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update procedures

#### Contact Information
- Security Team: security@patunay.com
- Emergency: +1-XXX-XXX-XXXX
- Bug Bounty: security.patunay.com/bugbounty

## Security Checklist

### Pre-Deployment
- [ ] All dependencies updated
- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Access controls verified
- [ ] Encryption enabled
- [ ] Logging configured
- [ ] Backup procedures tested

### Regular Maintenance
- [ ] Weekly dependency scans
- [ ] Monthly access reviews
- [ ] Quarterly security training
- [ ] Annual penetration tests
- [ ] Continuous monitoring
- [ ] Incident drills

## Compliance

### Standards
- **OWASP Top 10**: Addressed all major vulnerabilities
- **ISO 27001**: Information security management
- **GDPR**: Data protection compliance
- **PCI DSS**: Payment card security (if applicable)

### Certifications
- Regular third-party security audits
- Compliance certifications maintained
- Security training for all developers

## Future Enhancements

### Planned Security Features
1. **Multi-Factor Authentication**: Hardware key support
2. **Biometric Authentication**: Fingerprint/Face ID
3. **Advanced Threat Detection**: ML-based anomaly detection
4. **Zero-Trust Architecture**: Enhanced network security
5. **Hardware Security Module**: Cryptographic key management