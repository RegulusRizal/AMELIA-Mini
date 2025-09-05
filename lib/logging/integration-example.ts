/**
 * Integration Examples
 * Demonstrates how to integrate the logging service with existing code patterns
 */

import { Logger, logger } from './service';
import { createRequestLogger, withErrorLogging, logDatabaseOperation, sanitizeUserData } from './utils';
import { createClient } from '@/lib/supabase/server';

/**
 * Example 1: Server Action with Logging
 */
export async function exampleServerAction(formData: FormData) {
  'use server';
  
  // Create a logger for this action
  const logger = await createRequestLogger('users', 'createUser');
  
  try {
    logger.info('Creating new user', {
      metadata: {
        email: formData.get('email') as string,
        role: formData.get('role') as string
      }
    });
    
    const supabase = createClient();
    const dbLogger = logDatabaseOperation('INSERT', 'profiles', logger);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: formData.get('email'),
        full_name: formData.get('full_name'),
        // ... other fields
      })
      .select()
      .single();
    
    if (error) {
      dbLogger.error(error);
      throw error;
    }
    
    dbLogger.success(1);
    
    logger.info('User created successfully', {
      userId: data.id,
      metadata: sanitizeUserData(data)
    });
    
    return { success: true, data };
  } catch (error) {
    logger.error(
      'Failed to create user',
      error instanceof Error ? error : new Error(String(error))
    );
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Example 2: API Route with Logging
 */
export async function exampleApiRoute(request: Request) {
  const logger = new Logger({
    path: '/api/users',
    method: request.method,
    requestId: request.headers.get('x-request-id') || 'no-request-id'
  });
  
  const startTime = Date.now();
  
  try {
    logger.info('Processing API request');
    
    // Process request...
    const result = { users: [] };
    
    logger.performance(startTime, {
      metadata: { resultCount: result.users.length }
    });
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error(
      'API request failed',
      error instanceof Error ? error : new Error(String(error))
    );
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

/**
 * Example 3: Using withErrorLogging wrapper
 */
const fetchUserWithLogging = withErrorLogging(
  async function fetchUser(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },
  { module: 'users', action: 'fetchUser' }
);

/**
 * Example 4: Batch Operations with Progress Logging
 */
export async function processBatchWithLogging(items: any[]) {
  const logger = await createRequestLogger('batch', 'processItems');
  const totalItems = items.length;
  
  logger.info(`Starting batch processing of ${totalItems} items`);
  
  const results = [];
  let processed = 0;
  let failed = 0;
  
  for (const item of items) {
    try {
      // Process item...
      const result = await processItem(item);
      results.push(result);
      processed++;
      
      // Log progress every 10 items or 10%
      if (processed % 10 === 0 || processed % Math.ceil(totalItems / 10) === 0) {
        logger.info(`Batch progress: ${processed}/${totalItems} (${Math.round(processed/totalItems * 100)}%)`, {
          metadata: {
            processed,
            failed,
            total: totalItems,
            percentComplete: Math.round(processed/totalItems * 100)
          }
        });
      }
    } catch (error) {
      failed++;
      logger.warn(`Failed to process item`, error instanceof Error ? error : undefined, {
        metadata: { itemId: item.id, processed, failed }
      });
    }
  }
  
  logger.info(`Batch processing completed`, {
    metadata: {
      totalItems,
      processed,
      failed,
      successRate: Math.round((processed - failed) / totalItems * 100)
    }
  });
  
  return results;
}

async function processItem(item: any) {
  // Placeholder for actual processing logic
  return item;
}

/**
 * Example 5: Child Logger for Complex Operations
 */
export async function complexOperationWithChildLoggers() {
  const parentLogger = await createRequestLogger('complex', 'parentOperation');
  
  parentLogger.info('Starting complex operation');
  
  // Create child loggers for sub-operations
  const authLogger = parentLogger.createChild({ action: 'authenticate' });
  const dataLogger = parentLogger.createChild({ action: 'fetchData' });
  const processLogger = parentLogger.createChild({ action: 'processData' });
  
  try {
    // Step 1: Authentication
    authLogger.debug('Authenticating user');
    const authResult = await authenticateUser();
    authLogger.info('Authentication successful', { userId: authResult.userId });
    
    // Step 2: Fetch Data
    dataLogger.debug('Fetching data');
    const data = await fetchData(authResult.userId);
    dataLogger.info('Data fetched', { metadata: { recordCount: data.length } });
    
    // Step 3: Process Data
    processLogger.debug('Processing data');
    const processed = await processData(data);
    processLogger.info('Data processed', { metadata: { processedCount: processed.length } });
    
    parentLogger.info('Complex operation completed successfully');
    return processed;
  } catch (error) {
    parentLogger.error(
      'Complex operation failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

async function authenticateUser() {
  // Placeholder
  return { userId: 'user123' };
}

async function fetchData(userId: string) {
  // Placeholder
  return [];
}

async function processData(data: any[]) {
  // Placeholder
  return data;
}