# NFC State Management

This module provides comprehensive state management for NFC operations in the Patunay application using Redux Toolkit.

## Architecture

### Core Components

1. **Types** (`types.ts`) - TypeScript interfaces and enums for NFC state
2. **Slice** (`slice.ts`) - Redux slice with actions and reducers  
3. **Selectors** (`selectors.ts`) - Memoized selectors for efficient state access
4. **Middleware** (`middleware.ts`) - Side effects handling for NFC events
5. **Hook** (`../hooks/useNfc.ts`) - Custom React hook for easy component integration

## Key Features

### State Management
- **Reader Connection Tracking** - Monitor NFC reader connection status
- **Operation Management** - Track current read/write operations with progress
- **Card Detection** - Real-time card presence and data tracking
- **Operation History** - Maintain history of all NFC operations
- **Error Handling** - Centralized error state management

### Middleware Features
- **Automatic Event Listening** - Sets up Electron IPC listeners automatically
- **Operation Timeouts** - Automatically fails operations that exceed timeout
- **Auto-cleanup** - Removes completed operations after delay for better UX

### Components
- **NfcManager** - Complete NFC operation interface
- **NfcStatusDashboard** - Comprehensive status and history dashboard

## Usage

### Basic Hook Usage

```typescript
import { useNfc } from '../hooks/useNfc';

function MyComponent() {
  const {
    isReaderConnected,
    isOperationActive,
    detectedCard,
    startReadOperation,
    startWriteOperation
  } = useNfc();

  const handleRead = () => {
    if (isReaderConnected && !isOperationActive) {
      startReadOperation();
    }
  };

  const handleWrite = (data: string) => {
    if (isReaderConnected && !isOperationActive) {
      startWriteOperation(data);
    }
  };

  return (
    <div>
      <p>Reader: {isReaderConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Card: {detectedCard ? detectedCard.uid : 'None'}</p>
      <button onClick={handleRead}>Read Card</button>
      <button onClick={() => handleWrite('test')}>Write Card</button>
    </div>
  );
}
```

### Using Selectors Directly

```typescript
import { useSelector } from 'react-redux';
import { selectNfcStatus, selectOperationHistory } from '../store/nfc';

function StatusComponent() {
  const nfcStatus = useSelector(selectNfcStatus);
  const history = useSelector(selectOperationHistory);

  return (
    <div>
      <p>Status: {nfcStatus.status}</p>
      <p>Operations: {history.length}</p>
    </div>
  );
}
```

### Using Pre-built Components

```typescript
import { NfcManager, NfcStatusDashboard } from '@components';

function NfcPage() {
  return (
    <div>
      <NfcManager 
        onCardDetected={(card) => console.log('Card:', card)}
        onWriteComplete={(result) => console.log('Write:', result)}
      />
      <NfcStatusDashboard showHistory={true} showStats={true} />
    </div>
  );
}
```

## State Structure

```typescript
interface NfcState {
  // Connection
  readerConnectionState: NfcReaderConnectionState;
  connectedReaderName: string | null;
  
  // Operation
  currentMode: NfcModeEntity;
  currentOperation: CurrentNfcOperation | null;
  
  // Card
  detectedCard: CardData | null;
  lastReadData: string | null;
  
  // History
  operationHistory: NfcOperationHistoryEntry[];
  
  // Error
  lastError: NfcServiceError | NfcOperationError | null;
  
  // Settings
  autoSwitchToReadMode: boolean;
  operationTimeoutMs: number;
  maxHistoryEntries: number;
}
```

## Best Practices

1. **Use the Hook** - Prefer `useNfc()` over direct Redux dispatch/select
2. **Handle Errors** - Always check `hasError` and `lastError` states
3. **Check Connection** - Verify `isReaderConnected` before operations
4. **Operation Safety** - Don't start operations when `isOperationActive` is true
5. **Cleanup** - The middleware handles cleanup automatically

## Configuration

The NFC middleware includes these configurable timeouts:
- **Operation Timeout**: 30 seconds (configurable per operation)
- **Auto-cleanup Delay**: 3 seconds after completion
- **Max History Entries**: 50 operations (configurable)

## Error Handling

The system provides structured error handling with specific error types:
- `INITIALIZATION_FAILED` - NFC service startup errors
- `READER_CONNECTION_FAILED` - Reader hardware issues  
- `CARD_READ_FAILED` - Card reading errors
- `CARD_WRITE_FAILED` - Card writing errors
- `READER_ERROR` - General reader errors
- `GENERAL_ERROR` - Other NFC-related errors

All errors are automatically captured and stored in the state for UI display.