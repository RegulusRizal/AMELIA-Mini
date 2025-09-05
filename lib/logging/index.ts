/**
 * Logging Service Export
 * Central export point for all logging functionality
 */

export {
  // Main logger class and singleton
  Logger,
  logger,
  
  // Convenience functions
  debug,
  info,
  warn,
  error,
  fatal
} from './service';

export {
  // Types
  type LogLevel,
  type LogContext,
  type LogEntry,
  type SerializedError,
  type PerformanceMetrics,
  type LoggerConfig,
  
  // Constants
  SENSITIVE_PATTERNS,
  LOG_LEVELS
} from './types';

export {
  // Utilities
  createRequestLogger,
  withErrorLogging,
  logDatabaseOperation,
  createApiLogger,
  sanitizeUserData,
  formatErrorForClient
} from './utils';

/**
 * Environment Configuration Guide:
 * 
 * Add these to your .env.local file:
 * 
 * # Logging Configuration
 * LOG_LEVEL=debug              # Options: debug, info, warn, error, fatal
 * 
 * For production (.env.production):
 * LOG_LEVEL=info               # More restrictive for production
 * 
 * The logging service automatically detects the environment:
 * - Development: Pretty formatted output with colors
 * - Production: Structured JSON logs for aggregation services
 * 
 * Usage in Server Actions:
 * ```typescript
 * import { createRequestLogger } from '@/lib/logging';
 * 
 * export async function myAction() {
 *   'use server';
 *   const logger = await createRequestLogger('module', 'action');
 *   
 *   try {
 *     logger.info('Starting action');
 *     // ... your logic
 *     logger.info('Action completed');
 *   } catch (error) {
 *     logger.error('Action failed', error);
 *   }
 * }
 * ```
 * 
 * Usage in API Routes:
 * ```typescript
 * import { createApiLogger } from '@/lib/logging';
 * 
 * export async function GET(request: Request) {
 *   const logger = createApiLogger(request);
 *   
 *   try {
 *     logger.info('Processing request');
 *     // ... your logic
 *     return Response.json({ success: true });
 *   } catch (error) {
 *     logger.error('Request failed', error);
 *     return Response.json({ error: 'Internal Error' }, { status: 500 });
 *   }
 * }
 * ```
 */