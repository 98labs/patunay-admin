// Shared logging types between main and renderer processes

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

export enum LogCategory {
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  PERFORMANCE = 'performance',
  AUDIT = 'audit',
  NFC = 'nfc',
  API = 'api',
  UI = 'ui'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  operationId?: string;
  component?: string;
  action?: string;
  timestamp: Date;
  environment: 'development' | 'production' | 'test';
  version: string;
  originalContext?: any; // For forwarding renderer context to main process
}

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  context: LogContext;
  data?: Record<string, any>;
  error?: Error;
  duration?: number; // for performance logging
}

export interface SensitiveDataPattern {
  field: string;
  pattern: RegExp;
  replacement: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  format?: 'json' | 'text';
  sensitiveDataPatterns: SensitiveDataPattern[];
}