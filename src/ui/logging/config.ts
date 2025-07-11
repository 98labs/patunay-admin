import { LogLevel, LoggerConfig } from '../../shared/logging/types';

/**
 * Logging configuration based on environment
 */
export const getLoggingConfig = (): Partial<LoggerConfig> => {
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';

  if (isDevelopment) {
    return {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false,
      format: 'json',
      sensitiveDataPatterns: []
    };
  }

  if (isProduction) {
    return {
      level: LogLevel.INFO,
      enableConsole: false,
      enableFile: true,
      format: 'json',
      sensitiveDataPatterns: [
        {
          field: 'uid',
          pattern: /^[0-9a-fA-F]{8,16}$/,
          replacement: '***UID***'
        },
        {
          field: 'email',
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          replacement: '***EMAIL***'
        }
      ]
    };
  }

  // Test environment
  return {
    level: LogLevel.ERROR,
    enableConsole: false,
    enableFile: false,
    format: 'json',
    sensitiveDataPatterns: []
  };
};