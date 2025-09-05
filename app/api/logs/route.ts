/**
 * Logs API Endpoint
 * Development-only endpoint for viewing recent logs
 * This endpoint should be disabled in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logging';

// In-memory log storage for development (max 1000 entries)
const MAX_LOG_ENTRIES = 1000;
let logBuffer: any[] = [];

// Hook into console.log to capture logs in development
if (process.env.NODE_ENV === 'development') {
  const originalLog = console.log;
  console.log = function(...args: any[]) {
    // Call original console.log
    originalLog.apply(console, args);
    
    // Store in buffer
    try {
      const entry = args[0];
      if (typeof entry === 'string') {
        const parsed = entry.startsWith('{') ? JSON.parse(entry) : { message: entry };
        logBuffer.push({
          ...parsed,
          timestamp: parsed.timestamp || new Date().toISOString()
        });
      }
      
      // Keep buffer size limited
      if (logBuffer.length > MAX_LOG_ENTRIES) {
        logBuffer = logBuffer.slice(-MAX_LOG_ENTRIES);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  };
}

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Logs endpoint is disabled in production' },
      { status: 403 }
    );
  }

  const logger = createApiLogger(request);
  
  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const module = url.searchParams.get('module');
    
    logger.debug('Fetching logs', {
      metadata: { level, limit, module }
    });
    
    let filteredLogs = [...logBuffer];
    
    // Filter by level if specified
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    // Filter by module if specified
    if (module) {
      filteredLogs = filteredLogs.filter(log => 
        log.context?.module === module
      );
    }
    
    // Limit results
    filteredLogs = filteredLogs.slice(-limit);
    
    // Reverse to show newest first
    filteredLogs.reverse();
    
    return NextResponse.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      bufferSize: logBuffer.length,
      maxBufferSize: MAX_LOG_ENTRIES
    });
  } catch (error) {
    logger.error('Failed to fetch logs', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Logs endpoint is disabled in production' },
      { status: 403 }
    );
  }

  const logger = createApiLogger(request);
  
  try {
    const previousCount = logBuffer.length;
    logBuffer = [];
    
    logger.info('Cleared log buffer', {
      metadata: { previousCount }
    });
    
    return NextResponse.json({
      message: 'Log buffer cleared',
      previousCount
    });
  } catch (error) {
    logger.error('Failed to clear logs', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}