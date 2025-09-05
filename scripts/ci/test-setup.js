/**
 * Test setup script for CI environment
 * This script sets up the test environment for running tests in CI
 */

const fs = require('fs');
const path = require('path');

// Create test environment file if it doesn't exist
const envTestPath = path.join(process.cwd(), '.env.test');
if (!fs.existsSync(envTestPath)) {
  const envContent = `
# Test Environment Variables
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54321/postgres
SKIP_ENV_VALIDATION=true
`.trim();

  fs.writeFileSync(envTestPath, envContent);
  console.log('Created .env.test file');
}

// Create test directories if they don't exist
const testDirs = [
  '__tests__',
  '__tests__/unit',
  '__tests__/integration',
  '__tests__/e2e',
  'coverage'
];

testDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('Test setup complete');