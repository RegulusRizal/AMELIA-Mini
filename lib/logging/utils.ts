/**
 * Logging Utilities
 * Helper functions for common logging patterns in the application
 */

import { Logger } from './service';
import { LogContext } from './types';
import { headers } from 'next/headers';

/**
 * Create a logger with request context extracted from headers
 */
export async function createRequestLogger(
  module?: string,
  action?: string
): Promise<Logger> {
  const headersList = headers();
  const requestId = headersList.get('x-request-id') || 'no-request-id';
  
  const context: LogContext = {
    requestId,
    module,
    action,
    metadata: {
      userAgent: headersList.get('user-agent'),
      referer: headersList.get('referer'),
    }
  };

  return new Logger(context);
}

/**
 * Wrap an async function with automatic error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: LogContext
): T {
  return (async (...args: Parameters<T>) => {
    const logger = new Logger(context);
    const startTime = Date.now();
    
    try {
      logger.debug(`Starting operation: ${fn.name || 'anonymous'}`);
      const result = await fn(...args);
      
      const duration = Date.now() - startTime;
      logger.debug(`Operation completed: ${fn.name || 'anonymous'}`, {
        duration,
        metadata: { success: true }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(
        `Operation failed: ${fn.name || 'anonymous'}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          duration,
          metadata: { 
            success: false,
            args: process.env.NODE_ENV === 'development' ? args : undefined
          }
        }
      );
      
      throw error;
    }
  }) as T;
}

/**
 * Log database operations with timing and result counts
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  logger: Logger
) {
  const startTime = Date.now();
  
  return {
    success: (count?: number) => {
      const duration = Date.now() - startTime;
      logger.debug(`Database operation successful: ${operation} on ${table}`, {
        duration,
        metadata: {
          operation,
          table,
          resultCount: count,
        }
      });
    },
    
    error: (error: Error) => {
      const duration = Date.now() - startTime;
      logger.error(
        `Database operation failed: ${operation} on ${table}`,
        error,
        {
          duration,
          metadata: {
            operation,
            table,
          }
        }
      );
    }
  };
}

/**
 * Create a logger for API endpoints
 */
export function createApiLogger(
  request: Request,
  context?: LogContext
): Logger {
  const url = new URL(request.url);
  
  return new Logger({
    ...context,
    path: url.pathname,
    method: request.method,
    metadata: {
      ...context?.metadata,
      query: Object.fromEntries(url.searchParams),
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'content-type': request.headers.get('content-type'),
        'x-request-id': request.headers.get('x-request-id'),
      }
    }
  });
}

/**
 * Sanitize user data before logging
 */
export function sanitizeUserData(user: any): any {
  if (!user) return user;
  
  const sanitized = { ...user };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.encrypted_password;
  delete sanitized.auth_token;
  delete sanitized.access_token;
  delete sanitized.refresh_token;
  delete sanitized.session_token;
  delete sanitized.api_key;
  delete sanitized.secret_key;
  
  // Mask email partially
  if (sanitized.email && typeof sanitized.email === 'string') {
    const [localPart, domain] = sanitized.email.split('@');
    if (localPart && domain) {
      const maskedLocal = localPart.length > 2 
        ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
        : '*'.repeat(localPart.length);
      sanitized.email = `${maskedLocal}@${domain}`;
    }
  }
  
  // Mask phone numbers
  if (sanitized.phone && typeof sanitized.phone === 'string') {
    sanitized.phone = sanitized.phone.replace(/\d(?=\d{4})/g, '*');
  }
  
  return sanitized;
}

/**
 * Format error for client response (removes sensitive stack traces in production)
 */
export function formatErrorForClient(error: Error): {
  error: string;
  code?: string;
  statusCode?: number;
} {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const formatted: any = {
    error: error.message || 'An unexpected error occurred',
  };
  
  if ('code' in error) {
    formatted.code = (error as any).code;
  }
  
  if ('statusCode' in error) {
    formatted.statusCode = (error as any).statusCode;
  }
  
  // Only include stack trace in development
  if (isDevelopment && error.stack) {
    formatted.stack = error.stack;
  }
  
  return formatted;
}