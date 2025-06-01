import { LogLevel, LogCategory, LogEntry, LogContext, LoggerConfig } from '../../shared/logging/types';
import { LogDataSanitizer } from '../../shared/logging/sanitizer';

/**
 * Renderer process logger that sends logs to main process via IPC
 */
export class RendererLogger {
  private sanitizer: LogDataSanitizer;
  private config: LoggerConfig;
  private sessionId: string;
  private operationCounter: number = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.sessionId = this.generateSessionId();
    this.sanitizer = new LogDataSanitizer();
    
    this.config = {
      level: LogLevel.INFO,
      enableConsole: process.env.NODE_ENV === 'development',
      enableFile: false, // Renderer logs go through main process
      format: 'json',
      sensitiveDataPatterns: [],
      ...config
    };
  }

  /**
   * Create base context for all log entries
   */
  private createBaseContext(additionalContext: Partial<LogContext> = {}): LogContext {
    return {
      sessionId: this.sessionId,
      operationId: this.generateOperationId(),
      timestamp: new Date(),
      environment: import.meta.env.MODE as 'development' | 'production' | 'test' || 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      ...additionalContext
    };
  }

  /**
   * Log an entry
   */
  private logEntry(entry: LogEntry): void {
    const sanitizedData = entry.data ? this.sanitizer.sanitize(entry.data) : undefined;
    const sanitizedError = entry.error ? this.sanitizer.sanitizeError(entry.error) : undefined;

    const logData = {
      ...entry,
      data: sanitizedData,
      error: sanitizedError
    };

    // Console logging for development
    if (this.config.enableConsole && this.shouldLog(entry.level)) {
      this.logToConsole(logData);
    }

    // Send to main process if available
    if (window.electron?.ipcRenderer) {
      try {
        window.electron.ipcRenderer.send('log-entry', logData);
      } catch (error) {
        console.warn('Failed to send log to main process:', error);
      }
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.VERBOSE];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex <= currentLevelIndex;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(logData: LogEntry): void {
    const prefix = `[${logData.category}] [${logData.context.component || 'UI'}]`;
    const message = `${prefix} ${logData.message}`;

    switch (logData.level) {
      case LogLevel.ERROR:
        console.error(message, logData.data, logData.error);
        break;
      case LogLevel.WARN:
        console.warn(message, logData.data);
        break;
      case LogLevel.INFO:
        console.info(message, logData.data);
        break;
      case LogLevel.DEBUG:
        console.debug(message, logData.data);
        break;
      case LogLevel.VERBOSE:
        console.log(message, logData.data);
        break;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `renderer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(): string {
    return `op-${++this.operationCounter}`;
  }

  // Public logging methods

  error(message: string, category: LogCategory = LogCategory.UI, context: Partial<LogContext> = {}, data?: any, error?: Error): void {
    this.logEntry({
      level: LogLevel.ERROR,
      category,
      message,
      context: this.createBaseContext(context),
      data,
      error
    });
  }

  warn(message: string, category: LogCategory = LogCategory.UI, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.WARN,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  info(message: string, category: LogCategory = LogCategory.UI, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.INFO,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  debug(message: string, category: LogCategory = LogCategory.UI, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.DEBUG,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  verbose(message: string, category: LogCategory = LogCategory.UI, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.VERBOSE,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  // Specialized logging methods

  /**
   * Log user actions for audit trail
   */
  userAction(action: string, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.INFO,
      category: LogCategory.AUDIT,
      message: `User action: ${action}`,
      context: this.createBaseContext({ ...context, action, component: 'UserAction' }),
      data
    });
  }

  /**
   * Log API calls
   */
  apiCall(method: string, endpoint: string, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: `API ${method} ${endpoint}`,
      context: this.createBaseContext({ ...context, action: `${method} ${endpoint}`, component: 'API' }),
      data
    });
  }

  /**
   * Log API responses
   */
  apiResponse(method: string, endpoint: string, status: number, context: Partial<LogContext> = {}, data?: any, duration?: number): void {
    const level = status >= 400 ? LogLevel.ERROR : status >= 300 ? LogLevel.WARN : LogLevel.INFO;
    
    this.logEntry({
      level,
      category: LogCategory.API,
      message: `API ${method} ${endpoint} -> ${status}`,
      context: this.createBaseContext({ ...context, action: `${method} ${endpoint}`, component: 'API' }),
      data,
      duration
    });
  }

  /**
   * Log navigation events
   */
  navigation(from: string, to: string, context: Partial<LogContext> = {}): void {
    this.logEntry({
      level: LogLevel.DEBUG,
      category: LogCategory.UI,
      message: `Navigation: ${from} -> ${to}`,
      context: this.createBaseContext({ ...context, action: 'navigate', component: 'Router' }),
      data: { from, to }
    });
  }

  /**
   * Log form submissions
   */
  formSubmit(formName: string, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.INFO,
      category: LogCategory.AUDIT,
      message: `Form submitted: ${formName}`,
      context: this.createBaseContext({ ...context, action: 'form_submit', component: formName }),
      data
    });
  }

  /**
   * Log component errors with React Error Boundary integration
   */
  componentError(componentName: string, error: Error, errorInfo?: any): void {
    this.logEntry({
      level: LogLevel.ERROR,
      category: LogCategory.UI,
      message: `Component error in ${componentName}`,
      context: this.createBaseContext({ component: componentName, action: 'component_error' }),
      data: errorInfo,
      error
    });
  }

  /**
   * Create a timer for performance logging
   */
  timer(label: string, context: Partial<LogContext> = {}): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.logEntry({
        level: LogLevel.DEBUG,
        category: LogCategory.PERFORMANCE,
        message: `Timer '${label}' completed`,
        context: this.createBaseContext({ ...context, component: 'Performance' }),
        duration
      });
    };
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Update logger configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const rendererLogger = new RendererLogger();