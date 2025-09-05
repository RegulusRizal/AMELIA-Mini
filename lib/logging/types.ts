/**
 * Logging Types and Interfaces
 * Defines the structure for log entries, error serialization, and performance metrics
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  module?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: SerializedError;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  cause?: SerializedError;
}

export interface PerformanceMetrics {
  requestId: string;
  path: string;
  method: string;
  duration: number;
  timestamp: string;
  memoryUsage?: NodeJS.MemoryUsage;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty';
  enableColors: boolean;
  enableTimestamp: boolean;
  enableStackTrace: boolean;
  maxErrorDepth: number;
  sensitiveFields: string[];
}

// Sensitive field patterns to sanitize
export const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'bearer',
  'api_key',
  'apikey',
  'credential',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
  'cvv',
  'pin',
  'private'
];

// Log level priorities for filtering
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};