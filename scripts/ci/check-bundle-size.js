#!/usr/bin/env node
/**
 * Bundle size checker for CI
 * Ensures bundle sizes stay within acceptable limits
 */

const fs = require('fs');
const path = require('path');

// Configuration for bundle size limits (in KB)
const BUNDLE_LIMITS = {
  'app-client': 500,  // Main app bundle
  'commons': 300,     // Common chunks
  'pages': 200,       // Individual pages
  'total': 2000       // Total bundle size
};

// Warning thresholds (percentage of limit)
const WARNING_THRESHOLD = 0.8;

function getFileSizeInKB(filePath) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return stats.size / 1024;
  }
  return 0;
}

function checkBundleSizes() {
  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    console.error('Build directory not found. Run npm run build first.');
    process.exit(1);
  }

  const results = {
    passed: true,
    warnings: [],
    errors: [],
    sizes: {}
  };

  // Check static chunks
  const staticDir = path.join(buildDir, 'static', 'chunks');
  if (fs.existsSync(staticDir)) {
    const files = fs.readdirSync(staticDir);
    let totalSize = 0;

    files.forEach(file => {
      const filePath = path.join(staticDir, file);
      const size = getFileSizeInKB(filePath);
      totalSize += size;

      // Check individual file sizes
      if (file.includes('app') && size > BUNDLE_LIMITS['app-client']) {
        results.errors.push(`App bundle (${file}): ${size.toFixed(2)}KB exceeds limit of ${BUNDLE_LIMITS['app-client']}KB`);
        results.passed = false;
      } else if (file.includes('app') && size > BUNDLE_LIMITS['app-client'] * WARNING_THRESHOLD) {
        results.warnings.push(`App bundle (${file}): ${size.toFixed(2)}KB is approaching limit`);
      }

      results.sizes[file] = size;
    });

    // Check total size
    if (totalSize > BUNDLE_LIMITS.total) {
      results.errors.push(`Total bundle size: ${totalSize.toFixed(2)}KB exceeds limit of ${BUNDLE_LIMITS.total}KB`);
      results.passed = false;
    } else if (totalSize > BUNDLE_LIMITS.total * WARNING_THRESHOLD) {
      results.warnings.push(`Total bundle size: ${totalSize.toFixed(2)}KB is approaching limit`);
    }

    results.sizes['total'] = totalSize;
  }

  // Output results
  console.log('\n=== Bundle Size Report ===\n');
  
  console.log('Bundle Sizes:');
  Object.entries(results.sizes).forEach(([file, size]) => {
    console.log(`  ${file}: ${size.toFixed(2)}KB`);
  });

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (results.passed) {
    console.log('\n✅ All bundle size checks passed!');
  } else {
    console.log('\n❌ Bundle size limits exceeded!');
    process.exit(1);
  }

  // Write report to file for artifact upload
  const reportPath = path.join(process.cwd(), 'bundle-size-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

// Run the checker
checkBundleSizes();