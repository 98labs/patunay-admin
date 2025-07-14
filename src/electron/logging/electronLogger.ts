import log from 'electron-log';
import path from 'path';
import { app } from 'electron';
import { LogLevel, LogCategory, LogEntry, LogContext, LoggerConfig } from '../../shared/logging/types.js';
import { LogDataSanitizer } from '../../shared/logging/sanitizer.js';

/**
 * Electron main process logger with structured logging, file rotation, and security
 */
export class ElectronLogger {
  private sanitizer: LogDataSanitizer;
  private config: LoggerConfig;
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.sessionId = this.generateSessionId();
    this.sanitizer = new LogDataSanitizer();
    
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      filePath: path.join(app.getPath('logs'), 'patunay-main.log'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: 'json',
      sensitiveDataPatterns: [],
      ...config
    };

    this.setupElectronLog();
  }

  /**
   * Setup electron-log configuration
   */
  private setupElectronLog(): void {
    // Configure console transport
    log.transports.console.level = this.config.enableConsole ? this.config.level : false;
    log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';

    // Configure file transport
    if (this.config.enableFile && this.config.filePath) {
      log.transports.file.level = this.config.level;
      log.transports.file.fileName = path.basename(this.config.filePath);
      log.transports.file.maxSize = this.config.maxFileSize || 10 * 1024 * 1024;
      log.transports.file.format = this.config.format === 'json' 
        ? '{text}' // We'll format JSON ourselves
        : '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';
    } else {
      log.transports.file.level = false;
    }

    // Disable remote transport
    log.transports.remote.level = false;
  }

  /**
   * Create base context for all log entries
   */
  private createBaseContext(additionalContext: Partial<LogContext> = {}): LogContext {
    return {
      sessionId: this.sessionId,
      timestamp: new Date(),
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      version: app.getVersion(),
      ...additionalContext
    };
  }

  /**
   * Log an entry with structured format
   */
  private logEntry(entry: LogEntry): void {
    const sanitizedData = entry.data ? this.sanitizer.sanitize(entry.data) : undefined;
    const sanitizedError = entry.error ? this.sanitizer.sanitizeError(entry.error) : undefined;

    const logData = {
      level: entry.level,
      category: entry.category,
      message: entry.message,
      context: entry.context,
      data: sanitizedData,
      error: sanitizedError,
      duration: entry.duration
    };

    const logText = this.config.format === 'json' 
      ? JSON.stringify(logData)
      : `[${entry.category}] ${entry.message}`;

    // Use electron-log with appropriate level
    switch (entry.level) {
      case LogLevel.ERROR:
        log.error(logText);
        break;
      case LogLevel.WARN:
        log.warn(logText);
        break;
      case LogLevel.INFO:
        log.info(logText);
        break;
      case LogLevel.DEBUG:
        log.debug(logText);
        break;
      case LogLevel.VERBOSE:
        log.verbose(logText);
        break;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public logging methods

  error(message: string, category: LogCategory = LogCategory.SYSTEM, context: Partial<LogContext> = {}, data?: any, error?: Error): void {
    this.logEntry({
      level: LogLevel.ERROR,
      category,
      message,
      context: this.createBaseContext(context),
      data,
      error
    });
  }

  warn(message: string, category: LogCategory = LogCategory.SYSTEM, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.WARN,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  info(message: string, category: LogCategory = LogCategory.SYSTEM, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.INFO,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  debug(message: string, category: LogCategory = LogCategory.SYSTEM, context: Partial<LogContext> = {}, data?: any): void {
    this.logEntry({
      level: LogLevel.DEBUG,
      category,
      message,
      context: this.createBaseContext(context),
      data
    });
  }

  verbose(message: string, category: LogCategory = LogCategory.SYSTEM, context: Partial<LogContext> = {}, data?: any): void {
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
   * Log NFC operations with sanitization
   */
  nfc(level: LogLevel, message: string, context: Partial<LogContext> = {}, nfcData?: any): void {
    const sanitizedNfcData = nfcData ? this.sanitizer.sanitizeNfcData(nfcData) : undefined;
    
    this.logEntry({
      level,
      category: LogCategory.NFC,
      message,
      context: this.createBaseContext({ ...context, component: 'NFC' }),
      data: sanitizedNfcData
    });
  }

  /**
   * Log API operations
   */
  api(level: LogLevel, message: string, context: Partial<LogContext> = {}, apiData?: any): void {
    this.logEntry({
      level,
      category: LogCategory.API,
      message,
      context: this.createBaseContext({ ...context, component: 'API' }),
      data: apiData
    });
  }

  /**
   * Log security events
   */
  security(level: LogLevel, message: string, context: Partial<LogContext> = {}, securityData?: any): void {
    this.logEntry({
      level,
      category: LogCategory.SECURITY,
      message,
      context: this.createBaseContext({ ...context, component: 'Security' }),
      data: securityData
    });
  }

  /**
   * Log performance metrics
   */
  performance(message: string, duration: number, context: Partial<LogContext> = {}, perfData?: any): void {
    this.logEntry({
      level: LogLevel.INFO,
      category: LogCategory.PERFORMANCE,
      message,
      context: this.createBaseContext({ ...context, component: 'Performance' }),
      data: perfData,
      duration
    });
  }

  /**
   * Create a timer for performance logging
   */
  timer(label: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.performance(`Timer '${label}' completed`, duration);
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
    this.setupElectronLog();
  }
}

// Export singleton instance
export const electronLogger = new ElectronLogger();