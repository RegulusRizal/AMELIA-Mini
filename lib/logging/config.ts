/**
 * Logging Configuration
 * Centralized configuration management for the logging service
 */

import { LogLevel, LoggerConfig, SENSITIVE_PATTERNS } from './types';

/**
 * Default configuration values
 */
const DEFAULTS = {
  development: {
    level: 'debug' as LogLevel,
    format: 'pretty' as const,
    enableColors: true,
    enableTimestamp: true,
    enableStackTrace: true,
    maxErrorDepth: 5,
  },
  production: {
    level: 'info' as LogLevel,
    format: 'json' as const,
    enableColors: false,
    enableTimestamp: true,
    enableStackTrace: false,
    maxErrorDepth: 3,
  },
  test: {
    level: 'error' as LogLevel,
    format: 'json' as const,
    enableColors: false,
    enableTimestamp: true,
    enableStackTrace: true,
    maxErrorDepth: 5,
  }
};

/**
 * Get configuration based on environment
 */
export function getConfig(): LoggerConfig {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  const isTest = env === 'test';
  
  // Get base configuration for environment
  const baseConfig = isProduction 
    ? DEFAULTS.production 
    : isTest 
    ? DEFAULTS.test 
    : DEFAULTS.development;
  
  // Override with environment variables if set
  const config: LoggerConfig = {
    level: (process.env.LOG_LEVEL as LogLevel) || baseConfig.level,
    format: baseConfig.format,
    enableColors: baseConfig.enableColors && process.stdout?.isTTY,
    enableTimestamp: process.env.LOG_TIMESTAMP !== 'false',
    enableStackTrace: process.env.LOG_STACK_TRACE === 'true' || baseConfig.enableStackTrace,
    maxErrorDepth: parseInt(process.env.LOG_MAX_ERROR_DEPTH || String(baseConfig.maxErrorDepth), 10),
    sensitiveFields: [
      ...SENSITIVE_PATTERNS,
      ...(process.env.LOG_SENSITIVE_FIELDS?.split(',').map(f => f.trim()) || [])
    ]
  };
  
  // Validate configuration
  validateConfig(config);
  
  return config;
}

/**
 * Validate configuration values
 */
function validateConfig(config: LoggerConfig): void {
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  if (!validLevels.includes(config.level)) {
    console.warn(`Invalid LOG_LEVEL "${config.level}", defaulting to "info"`);
    config.level = 'info';
  }
  
  if (config.maxErrorDepth < 1 || config.maxErrorDepth > 10) {
    console.warn(`Invalid LOG_MAX_ERROR_DEPTH "${config.maxErrorDepth}", defaulting to 5`);
    config.maxErrorDepth = 5;
  }
}

/**
 * Check if a specific log level is enabled
 */
export function isLevelEnabled(level: LogLevel): boolean {
  const config = getConfig();
  const levelPriorities: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };
  
  return levelPriorities[level] >= levelPriorities[config.level];
}

/**
 * Get formatted environment info for logging
 */
export function getEnvironmentInfo(): Record<string, any> {
  return {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    platform: process.platform,
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    logLevel: getConfig().level,
  };
}

/**
 * Custom sensitive patterns for specific modules
 */
export const MODULE_SENSITIVE_PATTERNS: Record<string, string[]> = {
  auth: ['session_id', 'refresh_token', 'access_token', 'jwt', 'bearer'],
  users: ['ssn', 'social_security', 'date_of_birth', 'dob', 'salary'],
  finance: ['account_number', 'routing_number', 'card_number', 'cvv', 'pin'],
  hr: ['employee_id', 'compensation', 'review_score', 'performance_rating'],
};

/**
 * Get sensitive patterns for a specific module
 */
export function getSensitivePatterns(module?: string): string[] {
  const basePatterns = getConfig().sensitiveFields;
  
  if (!module) {
    return basePatterns;
  }
  
  const modulePatterns = MODULE_SENSITIVE_PATTERNS[module] || [];
  return [...basePatterns, ...modulePatterns];
}