import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const startTime = Date.now();
  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      api: false,
      database: false,
      auth: false
    },
    responseTime: 0
  };

  try {
    // Check API is responsive
    checks.checks.api = true;

    // Check database connectivity
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      checks.checks.database = !error;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      checks.checks.database = false;
    }

    // Check auth service
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      checks.checks.auth = true; // Auth service is responding
    } catch (authError) {
      console.error('Auth health check failed:', authError);
      checks.checks.auth = false;
    }

    // Determine overall status
    const allChecks = Object.values(checks.checks);
    if (allChecks.every(check => check === true)) {
      checks.status = 'healthy';
    } else if (allChecks.some(check => check === true)) {
      checks.status = 'degraded';
    } else {
      checks.status = 'unhealthy';
    }

    checks.responseTime = Date.now() - startTime;

    // Return appropriate status code based on health
    const statusCode = checks.status === 'healthy' ? 200 : 
                       checks.status === 'degraded' ? 206 : 503;

    return NextResponse.json(checks, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    
    checks.status = 'unhealthy';
    checks.responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...checks,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}