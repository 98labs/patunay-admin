# NFC Integration Guide

## Overview

Patunay Admin integrates with NFC (Near Field Communication) hardware to provide artwork authentication and tracking capabilities. The implementation uses the `nfc-pcsc` library to communicate with PC/SC compatible NFC readers.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                 Hardware Layer                       │
│         (ACR122U, PN532, or compatible)             │
└────────────────────┬────────────────────────────────┘
                     │ PC/SC Interface
┌────────────────────┴────────────────────────────────┐
│              NFC Service (Main Process)              │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Device Mgmt  │  │ Read/Write  │  │  Status   │ │
│  │              │  │ Operations  │  │ Monitor   │ │
│  └──────────────┘  └─────────────┘  └───────────┘ │
└────────────────────┬────────────────────────────────┘
                     │ IPC Communication
┌────────────────────┴────────────────────────────────┐
│               React Application                      │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ NFC Context  │  │  useNfc     │  │ NFC UI    │ │
│  │              │  │   Hook      │  │Components │ │
│  └──────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

## NFC Service Implementation

### Service Structure

```typescript
// src/electron/nfc/nfcService.ts
class NFCService {
  private nfc: NFC | null = null;
  private readers: Map<string, Reader> = new Map();
  private isInitialized: boolean = false;
  
  async initialize(): Promise<void>
  async cleanup(): Promise<void>
  async readTag(readerId: string): Promise<NFCReadResult>
  async writeTag(readerId: string, data: NFCWriteData): Promise<void>
  getStatus(): NFCStatus
}
```

### Key Features

1. **Automatic Device Detection**
   - Monitors for reader attachment/detachment
   - Supports multiple readers simultaneously
   - Graceful handling of device disconnection

2. **Read Operations**
   - Reads NFC tag UID
   - Supports NDEF message reading
   - Validates tag type and compatibility

3. **Write Operations**
   - Writes artwork ID to tags
   - Supports NDEF message formatting
   - Implements write verification

4. **Error Handling**
   - Comprehensive error types
   - Retry mechanisms
   - User-friendly error messages

## IPC Communication

### Main Process → Renderer

```typescript
// Status updates
mainWindow.webContents.send('nfc:status-update', {
  isAvailable: true,
  readers: ['ACR122U'],
  activeReader: 'ACR122U'
});

// Tag detection
mainWindow.webContents.send('nfc:tag-detected', {
  uid: '04:E1:23:BA:45:36:80',
  type: 'NTAG213',
  data: { artworkId: 'uuid-here' }
});

// Operation results
mainWindow.webContents.send('nfc:operation-complete', {
  type: 'read',
  success: true,
  data: { /* tag data */ }
});
```

### Renderer → Main Process

```typescript
// Request operations
ipcRenderer.send('nfc:read-tag', { readerId: 'ACR122U' });
ipcRenderer.send('nfc:write-tag', { 
  readerId: 'ACR122U',
  data: { artworkId: 'uuid-here' }
});

// Control commands
ipcRenderer.send('nfc:start-monitoring');
ipcRenderer.send('nfc:stop-monitoring');
```

## React Integration

### NFC Context Provider

```typescript
// src/ui/context/NfcStatusContext.tsx
interface NfcContextValue {
  status: NfcStatus;
  isAvailable: boolean;
  readers: string[];
  activeReader: string | null;
  lastError: Error | null;
  readTag: () => Promise<NfcReadResult>;
  writeTag: (data: NfcWriteData) => Promise<void>;
}
```

### useNfc Hook

```typescript
// src/ui/hooks/useNfc.ts
function useNfc() {
  const context = useContext(NfcStatusContext);
  
  return {
    // Status
    isAvailable: context.isAvailable,
    isReading: context.operationInProgress === 'read',
    isWriting: context.operationInProgress === 'write',
    
    // Operations
    readTag: context.readTag,
    writeTag: context.writeTag,
    
    // State
    lastTag: context.lastReadTag,
    error: context.lastError
  };
}
```

### Component Usage

```typescript
function NfcReader() {
  const { isAvailable, readTag, isReading, lastTag } = useNfc();
  
  const handleRead = async () => {
    try {
      const result = await readTag();
      console.log('Tag read:', result);
    } catch (error) {
      console.error('Read failed:', error);
    }
  };
  
  return (
    <div>
      <NfcStatusIndicator />
      <button 
        onClick={handleRead}
        disabled={!isAvailable || isReading}
      >
        {isReading ? 'Reading...' : 'Read Tag'}
      </button>
      {lastTag && <TagInfo tag={lastTag} />}
    </div>
  );
}
```

## NFC Tag Management

### Tag Registration Flow

1. **Tag Detection**
   - User places tag on reader
   - System reads tag UID
   - Checks if tag is already registered

2. **New Tag Registration**
   - Creates record in `nfc_tags` table
   - Associates with current user
   - Sets tag as active

3. **Artwork Association**
   - Links tag to specific artwork
   - Updates artwork's `nfc_tag_id`
   - Records association timestamp

### Database Schema

```sql
-- NFC Tags table
CREATE TABLE public.nfc_tags (
    id text PRIMARY KEY,              -- Internal ID
    tag_uid text UNIQUE NOT NULL,     -- Physical tag UID
    artwork_id uuid,                  -- Associated artwork
    is_active boolean DEFAULT true,   -- Tag status
    issued_at timestamp,              -- Registration date
    issued_by uuid,                   -- User who registered
    write_count integer DEFAULT 0,    -- Write operations count
    -- ... audit fields
);
```

## Supported Hardware

### Tested Readers
- **ACR122U** - Most common, USB interface
- **PN532** - Versatile, multiple interfaces
- **ACR1252U** - Professional grade
- **Most PC/SC compatible readers**

### Supported Tag Types
- **NTAG213/215/216** - Recommended
- **MIFARE Classic** - Legacy support
- **MIFARE Ultralight** - Basic functionality
- **ISO 14443A** - General support

## Security Considerations

### Tag Security
1. **UID Verification**
   - Tags are identified by unique UID
   - UID cannot be easily cloned
   - Additional verification via database

2. **Write Protection**
   - Optional password protection
   - Write counter tracking
   - Audit trail of modifications

3. **Data Integrity**
   - Minimal data stored on tag
   - Primary data in database
   - Tag acts as identifier only

### Access Control
```typescript
// Only authorized users can write tags
if (!hasPermission('manage_nfc_tags')) {
  throw new Error('Insufficient permissions');
}

// Tag operations are logged
await logNfcOperation({
  userId: currentUser.id,
  tagId: tag.uid,
  operation: 'write',
  timestamp: new Date()
});
```

## Common Operations

### Reading a Tag
```typescript
// In a React component
const { readTag } = useNfc();

const handleScan = async () => {
  try {
    const result = await readTag();
    
    if (result.artworkId) {
      // Navigate to artwork
      navigate(`/dashboard/artworks/${result.artworkId}`);
    } else {
      // Unassociated tag
      showMessage('Tag not associated with artwork');
    }
  } catch (error) {
    showError('Failed to read tag');
  }
};
```

### Writing to a Tag
```typescript
// During artwork registration
const { writeTag } = useNfc();

const handleAttachTag = async (artworkId: string) => {
  try {
    await writeTag({
      artworkId,
      timestamp: new Date().toISOString()
    });
    
    // Update database
    await attachNfcTag({ artworkId, tagId: currentTag.uid });
    
    showSuccess('Tag attached successfully');
  } catch (error) {
    showError('Failed to write tag');
  }
};
```

### Tag Status Monitoring
```typescript
// Global NFC status component
function NfcStatusBadge() {
  const { isAvailable, readers } = useNfc();
  
  return (
    <div className={`badge ${isAvailable ? 'badge-success' : 'badge-error'}`}>
      {isAvailable ? (
        <>NFC Ready ({readers.length} reader{readers.length !== 1 ? 's' : ''})</>
      ) : (
        'No NFC Reader'
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Reader Not Detected**
   - Ensure reader is properly connected
   - Check USB permissions (Linux)
   - Restart the application
   - Verify PC/SC service is running

2. **Tag Read Failures**
   - Clean the tag and reader
   - Ensure proper tag placement
   - Check tag compatibility
   - Verify tag is not damaged

3. **Write Failures**
   - Ensure tag is not write-protected
   - Check available memory on tag
   - Verify tag format compatibility
   - Try with a different tag

### Debug Mode

Enable NFC debug logging:
```typescript
// In main process
process.env.NFC_DEBUG = 'true';

// Logs will include:
// - Reader events
// - Tag detection
// - Read/write operations
// - Error details
```

## Best Practices

### User Experience
1. Provide clear visual feedback
2. Show NFC availability status
3. Guide users through operations
4. Handle errors gracefully

### Performance
1. Cache reader status
2. Debounce rapid tag reads
3. Implement operation timeouts
4. Clean up resources properly

### Reliability
1. Implement retry mechanisms
2. Validate data before writing
3. Verify operations completed
4. Maintain operation logs

## Future Enhancements

### Planned Features
- Mobile NFC support via companion app
- Batch tag programming
- Advanced tag encryption
- NFC analytics dashboard
- Tag lifecycle management

### Integration Possibilities
- QR code fallback
- Bluetooth beacon support
- RFID long-range readers
- Cloud-based tag registry