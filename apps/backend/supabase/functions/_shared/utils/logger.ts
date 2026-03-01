/**
 * Structured Logging Utility
 *
 * Provides consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Remove sensitive data from logs
 */
function filterSensitiveData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
  ];

  return Object.entries(data).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        acc[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = filterSensitiveData(value as Record<string, unknown>);
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
}

/**
 * Log a message with context
 */
function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const logEntry: LogContext = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const filtered = filterSensitiveData(logEntry);
  console.log(JSON.stringify(filtered));
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log(LogLevel.DEBUG, msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log(LogLevel.INFO, msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log(LogLevel.WARN, msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log(LogLevel.ERROR, msg, ctx),
};
