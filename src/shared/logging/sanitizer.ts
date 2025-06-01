import { SensitiveDataPattern } from './types';

/**
 * Data sanitizer for removing sensitive information from logs
 */
export class LogDataSanitizer {
  private sensitivePatterns: SensitiveDataPattern[] = [
    // NFC Card UIDs (hexadecimal patterns)
    {
      field: 'uid',
      pattern: /^[0-9a-fA-F]{8,16}$/,
      replacement: '***UID***'
    },
    // Email addresses
    {
      field: 'email',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      replacement: '***EMAIL***'
    },
    // API Keys and tokens
    {
      field: 'api_key',
      pattern: /.+/,
      replacement: '***API_KEY***'
    },
    {
      field: 'key',
      pattern: /.+/,
      replacement: '***API_KEY***'
    },
    {
      field: 'access_token',
      pattern: /.+/,
      replacement: '***TOKEN***'
    },
    {
      field: 'refresh_token',
      pattern: /.+/,
      replacement: '***TOKEN***'
    },
    // Credit card patterns (basic)
    {
      field: 'card_number',
      pattern: /^\d{13,19}$/,
      replacement: '***CARD***'
    },
    // File paths (partial redaction)
    {
      field: 'file_path',
      pattern: /^.*[/\\](.{0,10})[/\\].*$/,
      replacement: '***/.../$1/***'
    },
    // Passwords
    {
      field: 'password',
      pattern: /.+/,
      replacement: '***PASSWORD***'
    }
  ];

  constructor(additionalPatterns: SensitiveDataPattern[] = []) {
    this.sensitivePatterns.push(...additionalPatterns);
  }

  /**
   * Sanitize an object by removing or redacting sensitive data
   */
  sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    if (typeof data === 'object') {
      return this.sanitizeObject(data);
    }

    return data;
  }

  /**
   * Sanitize a string value
   */
  private sanitizeString(value: string): string {
    // Check for potential sensitive patterns in string values
    for (const pattern of this.sensitivePatterns) {
      if (pattern.pattern.test(value)) {
        return pattern.replacement;
      }
    }
    return value;
  }

  /**
   * Sanitize an object's properties
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if the field name matches sensitive patterns (exact match or specific substring)
      const sensitivePattern = this.sensitivePatterns.find(pattern => {
        const patternField = pattern.field.toLowerCase();
        // Exact match or field ends with pattern (but not substring matching for 'key' to avoid matching 'url')
        return lowerKey === patternField || 
               (patternField !== 'key' && lowerKey.includes(patternField)) ||
               (patternField === 'key' && (lowerKey === 'key' || lowerKey.endsWith('_key') || lowerKey.endsWith('key')));
      });

      if (sensitivePattern && typeof value === 'string') {
        sanitized[key] = sensitivePattern.replacement;
      } else {
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize NFC-specific data
   */
  sanitizeNfcData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    // Redact NFC card UID (keep first 2 and last 2 characters)
    if (sanitized.uid && typeof sanitized.uid === 'string') {
      const uid = sanitized.uid;
      if (uid.length > 4) {
        sanitized.uid = `${uid.slice(0, 2)}***${uid.slice(-2)}`;
      } else {
        sanitized.uid = '***UID***';
      }
    }

    // Redact binary data
    if (sanitized.data) {
      sanitized.data = '***BINARY_DATA***';
    }

    // Redact NDEF records
    if (sanitized.ndef && Array.isArray(sanitized.ndef)) {
      sanitized.ndef = '***NDEF_RECORDS***';
    }

    return sanitized;
  }

  /**
   * Sanitize error objects
   */
  sanitizeError(error: Error): Record<string, any> {
    return {
      name: error.name,
      message: this.sanitizeString(error.message),
      stack: this.sanitizeStackTrace(error.stack || ''),
    };
  }

  /**
   * Sanitize stack traces to remove sensitive file paths
   */
  private sanitizeStackTrace(stack: string): string {
    return stack
      .split('\n')
      .map(line => {
        // Replace full file paths with relative paths
        return line.replace(/^.*[/\\](src[/\\].*)/, '    at $1');
      })
      .join('\n');
  }

  /**
   * Add custom sensitive data patterns
   */
  addSensitivePattern(pattern: SensitiveDataPattern): void {
    this.sensitivePatterns.push(pattern);
  }
}