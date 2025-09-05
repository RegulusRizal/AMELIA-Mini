# CI/CD Pipeline Documentation

## Overview

AMELIA-Mini uses GitHub Actions for continuous integration and continuous deployment. The pipeline automatically runs tests, security checks, and deploys to Vercel on successful merges to the main branch.

## Workflows

### 1. CI (Continuous Integration)
**File**: `.github/workflows/ci.yml`
**Triggers**: Push to main/master, Pull requests
**Jobs**:
- **Linting**: ESLint and Prettier checks
- **Type Checking**: TypeScript compilation
- **Testing**: Unit tests with coverage
- **Building**: Next.js build verification
- **Security**: Vulnerability scanning
- **Performance**: Bundle size checking

### 2. Deploy (Continuous Deployment)
**File**: `.github/workflows/deploy.yml`
**Triggers**: Push to main/master, Manual dispatch
**Jobs**:
- **Deploy to Vercel**: Automatic production deployment
- **Database Migrations**: Supabase schema updates
- **Smoke Tests**: Post-deployment verification
- **Notifications**: Slack/Discord alerts

### 3. PR Checks
**File**: `.github/workflows/pr-checks.yml`
**Triggers**: Pull request events
**Features**:
- Auto-labeling based on files changed
- PR size checking
- Conventional commits validation
- Automated code review suggestions
- Bundle size comparison
- Test coverage reporting

### 4. Scheduled Tasks
**File**: `.github/workflows/scheduled.yml`
**Triggers**: Daily at 2 AM UTC
**Tasks**:
- Security vulnerability scanning
- Dependency updates check
- Production health monitoring
- Performance monitoring with Lighthouse
- Cleanup of old artifacts

### 5. CodeQL Security Analysis
**File**: `.github/workflows/codeql.yml`
**Triggers**: Push, PR, Weekly schedule
**Purpose**: Deep security analysis for JavaScript/TypeScript code

## Quick Start

### 1. Setup Required Secrets
See `.github/SECRETS.md` for the complete list of required GitHub secrets.

Minimum required:
```
SUPABASE_URL
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
DATABASE_URL
```

### 2. Configure Vercel Project
1. Link your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Obtain Vercel tokens and project IDs

### 3. Enable GitHub Actions
Actions should be automatically enabled. If not:
1. Go to repository Settings → Actions → General
2. Select "Allow all actions and reusable workflows"

## Local Development

### Running CI Checks Locally
```bash
# Install dependencies
npm ci --legacy-peer-deps

# Run all CI checks
npm run ci:test

# Individual checks
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run test:coverage # Tests with coverage
npm run build         # Build check
npm run bundle:check  # Bundle size
```

### Pre-commit Hooks
```bash
# Before committing
npm run precommit

# Before pushing
npm run prepush
```

## Pipeline Features

### Security
- Automated vulnerability scanning with npm audit
- CodeQL analysis for code security
- Snyk integration (optional)
- Dependency license checking

### Quality
- ESLint and Prettier formatting
- TypeScript strict type checking
- Test coverage requirements
- Bundle size monitoring
- Lighthouse performance scores

### Automation
- Auto-assign reviewers to PRs
- Auto-label PRs based on changes
- Dependabot for dependency updates
- Automated rollback on deployment failure

## Monitoring

### Health Checks
- **Endpoint**: `/api/health`
- **Checks**: API, Database, Auth service
- **Monitoring**: Daily automated checks

### Performance
- Bundle size tracked on every build
- Lighthouse scores for key pages
- Response time monitoring in smoke tests

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and rebuild
npm run cache:clear
npm run build
```

#### 2. Test Failures
```bash
# Run tests locally with debugging
npm run test:watch
```

#### 3. Deployment Failures
- Check Vercel logs
- Verify environment variables
- Ensure database migrations are compatible

#### 4. Secret Errors
- Verify all secrets are configured
- Check secret names (case-sensitive)
- Ensure tokens haven't expired

### Debugging Workflows
1. Check workflow runs in Actions tab
2. Download artifacts for detailed logs
3. Re-run failed jobs with debugging enabled

## Best Practices

### For Contributors
1. Always create feature branches
2. Ensure PR title follows conventional commits
3. Keep PRs small and focused
4. Include tests for new features
5. Update documentation as needed

### For Maintainers
1. Regularly review and update dependencies
2. Monitor security alerts
3. Keep secrets rotated (90-day cycle)
4. Review workflow performance metrics
5. Maintain test coverage above 80%

## Customization

### Adding New Checks
Edit workflow files in `.github/workflows/` to add new jobs or steps.

### Changing Triggers
Modify the `on:` section in workflow files to change when they run.

### Adjusting Thresholds
- Bundle size limits: `scripts/ci/check-bundle-size.js`
- Test coverage: Jest configuration
- Performance budgets: Lighthouse CI configuration

## Support

For issues with the CI/CD pipeline:
1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check `.github/SECRETS.md` for secret configuration
4. Open an issue with the `ci/cd` label