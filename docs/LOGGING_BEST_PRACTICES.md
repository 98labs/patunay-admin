# Logging Best Practices Documentation

## Overview
This document outlines the comprehensive logging infrastructure implemented for the Patunay Admin application, including best practices, security considerations, and usage guidelines.

## Architecture

### **Dual-Process Logging**
The application uses a sophisticated dual-process logging system designed for Electron applications:

- **Main Process**: Uses `electron-log` with file rotation and structured JSON logging
- **Renderer Process**: Uses custom logger that forwards logs to main process via IPC
- **Shared Types**: Common logging interfaces and types shared between processes

### **Key Components**

1. **ElectronLogger** (`src/electron/logging/electronLogger.ts`)
   - File-based logging with rotation (10MB max, 5 files)
   - Structured JSON format
   - Security-focused data sanitization
   - Performance timing and metrics

2. **RendererLogger** (`src/ui/logging/rendererLogger.ts`)
   - Browser-compatible logging for React components
   - IPC communication with main process
   - Development console logging
   - Component-specific context

3. **LogDataSanitizer** (`src/shared/logging/sanitizer.ts`)
   - Automatic PII detection and redaction
   - NFC data sanitization
   - Configurable sensitive data patterns
   - Stack trace cleaning

## Security Features

### **Sensitive Data Protection**
```typescript
// Automatically sanitized data types:
- NFC Card UIDs (redacted to first 2 + last 2 characters)
- Email addresses (replaced with ***EMAIL***)
- API tokens and keys (replaced with ***TOKEN***)
- File paths (partially redacted)
- Passwords (completely redacted)
```

### **Configurable Patterns**
```typescript
const sanitizer = new LogDataSanitizer([
  {
    field: 'custom_field',
    pattern: /sensitive_pattern/,
    replacement: '***REDACTED***'
  }
]);
```

## Usage Examples

### **Basic Logging in Components**
```typescript
import { useLogger } from '@/hooks/useLogger';

const MyComponent = () => {
  const logger = useLogger('MyComponent');
  
  const handleAction = () => {
    logger.logUserAction('button_click', { buttonId: 'submit' });
    logger.info('User clicked submit button');
  };
  
  return <button onClick={handleAction}>Submit</button>;
};
```

### **API Call Logging**
```typescript
const { logger } = useLogger('APIService');

const fetchData = async () => {
  const timer = logger.createTimer('fetchData');
  
  try {
    logger.logApiCall('GET', '/api/artworks');
    const response = await fetch('/api/artworks');
    logger.logApiResponse('GET', '/api/artworks', response.status, null, timer());
    return response.json();
  } catch (error) {
    logger.error('API call failed', LogCategory.API, { endpoint: '/api/artworks' }, error);
    throw error;
  }
};
```

### **Error Boundary Integration**
```typescript
import { EnhancedErrorBoundary } from '@/components/ErrorBoundary/EnhancedErrorBoundary';

<EnhancedErrorBoundary>
  <YourComponent />
</EnhancedErrorBoundary>
```

### **Redux Integration**
```typescript
// Store configuration with logging middleware
import { loggingMiddleware } from '@/middleware/loggingMiddleware';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loggingMiddleware)
      .concat(api.middleware)
});
```

## Log Categories

### **System Categories**
- `SYSTEM`: Application lifecycle, startup, shutdown
- `SECURITY`: Authentication, authorization, data access
- `TECHNICAL`: Database operations, API calls, system errors
- `PERFORMANCE`: Timing, resource usage, optimization metrics

### **Business Categories**
- `BUSINESS`: Artwork operations, user workflows
- `AUDIT`: User actions, data modifications, compliance
- `NFC`: NFC tag operations, card detection, hardware events
- `UI`: Navigation, form submissions, user interactions

## Environment Configuration

### **Development Environment**
```typescript
{
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  format: 'json'
}
```

### **Production Environment**
```typescript
{
  level: LogLevel.INFO,
  enableConsole: false,
  enableFile: true,
  format: 'json',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
}
```

### **Test Environment**
```typescript
{
  level: LogLevel.ERROR,
  enableConsole: false,
  enableFile: false
}
```

## Log Levels

1. **ERROR**: Critical failures, exceptions, system errors
2. **WARN**: Non-critical issues, deprecated features, performance warnings
3. **INFO**: Normal operations, user actions, system events
4. **DEBUG**: Detailed diagnostic information, development debugging
5. **VERBOSE**: Extremely detailed information, trace-level debugging

## File Management

### **Log File Locations**
- **Main Process**: `{app.getPath('logs')}/patunay-main.log`
- **Automatic Rotation**: When files exceed 10MB
- **Retention**: Maximum 5 log files kept
- **Format**: Structured JSON for easy parsing

### **Log File Example**
```json
{
  "level": "info",
  "category": "nfc",
  "message": "NFC card detected",
  "context": {
    "userId": "user123",
    "sessionId": "session456",
    "component": "NFC",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "environment": "production",
    "version": "1.0.14"
  },
  "data": {
    "uid": "AB***EF",
    "cardType": "MIFARE"
  }
}
```

## Performance Considerations

### **Timing Integration**
```typescript
// Automatic performance logging for slow operations
const timer = logger.createTimer('expensive-operation');
await performExpensiveOperation();
timer(); // Automatically logs if > 100ms
```

### **Middleware Performance**
- Redux actions > 100ms are automatically flagged
- API calls include request/response timing
- Component render times tracked in development

## Best Practices

### **DO:**
✅ Use structured logging with appropriate categories
✅ Include relevant context (userId, sessionId, component)
✅ Log user actions for audit trails
✅ Use timers for performance-critical operations
✅ Sanitize sensitive data before logging
✅ Use appropriate log levels
✅ Include error context and stack traces

### **DON'T:**
❌ Log sensitive data (passwords, full card UIDs, tokens)
❌ Use console.log in production code
❌ Log excessive debug information in production
❌ Include user personal information in logs
❌ Log binary data or large payloads
❌ Skip error context when logging exceptions

### **Security Guidelines**
1. **Never log**: Passwords, full credit card numbers, personal identification
2. **Always sanitize**: User input, API responses, NFC data
3. **Redact appropriately**: Partial information for debugging (first/last chars)
4. **Audit regularly**: Review logs for accidental sensitive data exposure

## Monitoring and Alerting

### **Log Analysis**
- Structured JSON format enables easy parsing and analysis
- Search by category, level, component, or user
- Performance metrics tracking and trending
- Error rate monitoring and alerting

### **Key Metrics to Monitor**
- Error rates by component and category
- API response times and failure rates
- User action patterns and workflows
- System performance and resource usage
- Security events and authentication patterns

## Troubleshooting

### **Common Issues**
1. **Logs not appearing**: Check log level configuration
2. **Missing context**: Ensure proper logger initialization
3. **Performance impact**: Reduce log level in production
4. **File permissions**: Verify write access to log directory

### **Debug Mode**
```typescript
// Enable verbose logging for troubleshooting
logger.updateConfig({ level: LogLevel.VERBOSE });
```

This logging infrastructure provides comprehensive observability while maintaining security and performance standards appropriate for production applications.