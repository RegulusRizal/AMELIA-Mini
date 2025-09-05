/**
 * Centralized Logging Service
 * Provides structured logging with context, error tracking, and sensitive data sanitization
 */

import {
  LogLevel,
  LogContext,
  LogEntry,
  SerializedError,
  LoggerConfig,
  LOG_LEVELS
} from './types';
import { getConfig, getSensitivePatterns } from './config';

class LoggingService {
  private static instance: LoggingService;
  private config: LoggerConfig;

  private constructor() {
    this.config = getConfig();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Main logging method
   */
  public log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Check if log level meets minimum threshold
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
      error: error ? this.serializeError(error) : undefined
    };

    this.output(logEntry);
  }

  /**
   * Convenience methods for different log levels
   */
  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
  }

  /**
   * Check if the log level should be output based on configuration
   */
  private shouldLog(level: LogLevel): boolean {
    const configLevel = LOG_LEVELS[this.config.level];
    const messageLevel = LOG_LEVELS[level];
    return messageLevel >= configLevel;
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeObject(sanitized.metadata, context.module);
    }

    return sanitized;
  }

  /**
   * Recursively sanitize an object to remove sensitive fields
   */
  private sanitizeObject(obj: any, module?: string, depth = 0): any {
    if (depth > 10) return '[Max depth exceeded]'; // Prevent infinite recursion
    
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, module, depth + 1));
    }

    const sanitized: Record<string, any> = {};
    const sensitivePatterns = getSensitivePatterns(module);
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field name contains sensitive patterns
      const isSensitive = sensitivePatterns.some(pattern => 
        lowerKey.includes(pattern.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, module, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Serialize error objects for logging
   */
  private serializeError(error: Error, depth = 0): SerializedError {
    if (depth > this.config.maxErrorDepth) {
      return {
        name: 'MaxDepthExceeded',
        message: 'Error serialization depth exceeded'
      };
    }

    const serialized: SerializedError = {
      name: error.name || 'Error',
      message: error.message || 'Unknown error'
    };

    if (this.config.enableStackTrace && error.stack) {
      serialized.stack = error.stack;
    }

    // Handle common error properties
    if ('code' in error) {
      serialized.code = String((error as any).code);
    }

    if ('statusCode' in error) {
      serialized.statusCode = Number((error as any).statusCode);
    }

    // Handle error cause (Error.cause property)
    if ('cause' in error && error.cause instanceof Error) {
      serialized.cause = this.serializeError(error.cause, depth + 1);
    }

    return serialized;
  }

  /**
   * Output the log entry based on configuration
   */
  private output(entry: LogEntry): void {
    if (this.config.format === 'json') {
      this.outputJson(entry);
    } else {
      this.outputPretty(entry);
    }
  }

  /**
   * Output as JSON (for production)
   */
  private outputJson(entry: LogEntry): void {
    // Non-blocking output
    process.nextTick(() => {
      console.log(JSON.stringify(entry));
    });
  }

  /**
   * Output as formatted text with colors (for development)
   */
  private outputPretty(entry: LogEntry): void {
    const colors = this.config.enableColors ? this.getColors() : this.getNoColors();
    const levelColor = colors[entry.level];
    const reset = colors.reset;

    let output = '';

    if (this.config.enableTimestamp) {
      output += `${colors.dim}[${entry.timestamp}]${reset} `;
    }

    output += `${levelColor}[${entry.level.toUpperCase()}]${reset} `;
    output += entry.message;

    if (entry.context) {
      output += '\n' + colors.dim + 'Context: ' + reset;
      output += JSON.stringify(entry.context, null, 2);
    }

    if (entry.error) {
      output += '\n' + colors.red + 'Error: ' + reset;
      output += `${entry.error.name}: ${entry.error.message}`;
      
      if (entry.error.stack && this.config.enableStackTrace) {
        output += '\n' + colors.dim + entry.error.stack + reset;
      }
    }

    // Non-blocking output
    process.nextTick(() => {
      console.log(output);
    });
  }

  /**
   * Get ANSI color codes for terminal output
   */
  private getColors() {
    return {
      reset: '\x1b[0m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
      debug: '\x1b[36m',   // cyan
      info: '\x1b[34m',    // blue
      warn: '\x1b[33m',    // yellow
      error: '\x1b[31m',   // red
      fatal: '\x1b[41m'    // red background
    };
  }

  /**
   * Get no-op color codes when colors are disabled
   */
  private getNoColors() {
    const noOp = '';
    return {
      reset: noOp,
      dim: noOp,
      red: noOp,
      yellow: noOp,
      blue: noOp,
      cyan: noOp,
      gray: noOp,
      debug: noOp,
      info: noOp,
      warn: noOp,
      error: noOp,
      fatal: noOp
    };
  }

  /**
   * Create a child logger with persistent context
   */
  public createChild(defaultContext: LogContext): Logger {
    return new Logger(defaultContext);
  }
}

/**
 * Logger class with convenient API
 */
export class Logger {
  private service: LoggingService;
  private defaultContext?: LogContext;

  constructor(defaultContext?: LogContext) {
    this.service = LoggingService.getInstance();
    this.defaultContext = defaultContext;
  }

  private mergeContext(context?: LogContext): LogContext | undefined {
    if (!this.defaultContext && !context) return undefined;
    if (!this.defaultContext) return context;
    if (!context) return this.defaultContext;
    
    return {
      ...this.defaultContext,
      ...context,
      metadata: {
        ...this.defaultContext.metadata,
        ...context.metadata
      }
    };
  }

  public log(level: LogLevel, message: string, context?: LogContext): void {
    this.service.log(level, message, this.mergeContext(context));
  }

  public debug(message: string, context?: LogContext): void {
    this.service.debug(message, this.mergeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.service.info(message, this.mergeContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.service.warn(message, this.mergeContext(context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.service.error(message, error, this.mergeContext(context));
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.service.fatal(message, error, this.mergeContext(context));
  }

  /**
   * Create a child logger with additional context
   */
  public createChild(additionalContext: LogContext): Logger {
    const mergedContext = this.mergeContext(additionalContext);
    return new Logger(mergedContext);
  }

  /**
   * Log performance metrics
   */
  public performance(startTime: number, context?: LogContext): void {
    const duration = Date.now() - startTime;
    const performanceContext = this.mergeContext({
      ...context,
      duration,
      metadata: {
        ...context?.metadata,
        memoryUsage: process.memoryUsage()
      }
    });

    if (duration > 1000) {
      this.warn(`Slow operation: ${duration}ms`, performanceContext);
    } else {
      this.debug(`Operation completed: ${duration}ms`, performanceContext);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default logger functions
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const fatal = logger.fatal.bind(logger);