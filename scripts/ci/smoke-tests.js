#!/usr/bin/env node
/**
 * Smoke tests for production deployments
 * Verifies critical functionality is working after deployment
 */

const https = require('https');
const http = require('http');

// Get deployment URL from environment or use localhost
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const isHttps = DEPLOYMENT_URL.startsWith('https');
const client = isHttps ? https : http;

// Test configuration
const TIMEOUT = 10000; // 10 seconds
const CRITICAL_ENDPOINTS = [
  { path: '/', expectedStatus: 200, name: 'Homepage' },
  { path: '/api/health', expectedStatus: 200, name: 'Health Check' },
  { path: '/auth/login', expectedStatus: 200, name: 'Login Page' },
  { path: '/dashboard', expectedStatus: [200, 302, 307], name: 'Dashboard (may redirect)' }
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function testEndpoint(url, endpoint) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${url}${endpoint.path}`;
    console.log(`Testing: ${colors.blue}${endpoint.name}${colors.reset} - ${fullUrl}`);

    const startTime = Date.now();
    
    client.get(fullUrl, { timeout: TIMEOUT }, (res) => {
      const responseTime = Date.now() - startTime;
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
        ? endpoint.expectedStatus 
        : [endpoint.expectedStatus];

      if (expectedStatuses.includes(res.statusCode)) {
        console.log(`  ${colors.green}✓${colors.reset} Status: ${res.statusCode} (${responseTime}ms)`);
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          status: res.statusCode,
          responseTime,
          success: true
        });
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Status: ${res.statusCode} (expected: ${expectedStatuses.join(' or ')})`);
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          status: res.statusCode,
          expectedStatus: expectedStatuses,
          responseTime,
          success: false
        });
      }
    }).on('error', (err) => {
      console.log(`  ${colors.red}✗${colors.reset} Error: ${err.message}`);
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        error: err.message,
        success: false
      });
    }).on('timeout', () => {
      console.log(`  ${colors.red}✗${colors.reset} Timeout after ${TIMEOUT}ms`);
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        error: 'Request timeout',
        success: false
      });
    });
  });
}

async function runSmokeTests() {
  console.log(`\n${colors.yellow}=== Running Smoke Tests ===${colors.reset}`);
  console.log(`Target: ${DEPLOYMENT_URL}\n`);

  const results = [];
  
  for (const endpoint of CRITICAL_ENDPOINTS) {
    const result = await testEndpoint(DEPLOYMENT_URL, endpoint);
    results.push(result);
    console.log(); // Add spacing between tests
  }

  // Generate summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length || 0;

  console.log(`${colors.yellow}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms\n`);

  // Performance warnings
  const slowEndpoints = results.filter(r => r.responseTime > 3000);
  if (slowEndpoints.length > 0) {
    console.log(`${colors.yellow}⚠ Performance Warnings:${colors.reset}`);
    slowEndpoints.forEach(endpoint => {
      console.log(`  - ${endpoint.endpoint}: ${endpoint.responseTime}ms`);
    });
    console.log();
  }

  // Exit with appropriate code
  if (failed > 0) {
    console.log(`${colors.red}✗ Smoke tests failed!${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ All smoke tests passed!${colors.reset}\n`);
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error(`${colors.red}Unhandled rejection: ${err}${colors.reset}`);
  process.exit(1);
});

// Run the tests
runSmokeTests();