# GitHub Actions Secrets Configuration

This document lists all the secrets that need to be configured in your GitHub repository for the CI/CD pipeline to work correctly.

## Required Secrets

### Core Secrets (Required)

1. **SUPABASE_URL**
   - Description: Your Supabase project URL
   - Example: `https://your-project.supabase.co`
   - Where to find: Supabase Dashboard → Settings → API

2. **SUPABASE_ANON_KEY**
   - Description: Your Supabase anonymous/public key
   - Where to find: Supabase Dashboard → Settings → API → Project API keys

3. **NEXT_PUBLIC_SUPABASE_URL**
   - Description: Same as SUPABASE_URL (for client-side)
   - Value: Same as SUPABASE_URL

4. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Description: Same as SUPABASE_ANON_KEY (for client-side)
   - Value: Same as SUPABASE_ANON_KEY

5. **DATABASE_URL**
   - Description: PostgreSQL connection string for migrations
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Where to find: Supabase Dashboard → Settings → Database

### Vercel Deployment (Required for deployment)

6. **VERCEL_TOKEN**
   - Description: Vercel API token for deployments
   - Where to find: Vercel Dashboard → Settings → Tokens
   - Create new token with full access

7. **VERCEL_ORG_ID**
   - Description: Your Vercel organization/team ID
   - Where to find: Vercel Dashboard → Settings → General → Team ID

8. **VERCEL_PROJECT_ID**
   - Description: Your Vercel project ID
   - Where to find: Vercel Dashboard → Project → Settings → General → Project ID

### Optional Secrets

9. **CODECOV_TOKEN** (Optional)
   - Description: Token for uploading test coverage to Codecov
   - Where to find: codecov.io → Your repository → Settings

10. **SNYK_TOKEN** (Optional)
    - Description: Token for security scanning with Snyk
    - Where to find: app.snyk.io → Account Settings → Auth Token

11. **SLACK_WEBHOOK_URL** (Optional)
    - Description: Webhook URL for Slack notifications
    - Where to find: Slack → Apps → Incoming Webhooks

12. **DISCORD_WEBHOOK_URL** (Optional)
    - Description: Webhook URL for Discord notifications
    - Where to find: Discord Server Settings → Integrations → Webhooks

13. **PRODUCTION_URL** (Optional)
    - Description: Your production URL for health checks
    - Example: `https://amelia-mini.vercel.app`

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name (exactly as listed above)
6. Enter the secret value
7. Click **Add secret**

## Verifying Secrets

After adding all required secrets, you can verify they're working by:

1. Running the CI workflow manually:
   ```bash
   # From the Actions tab, select "CI" workflow
   # Click "Run workflow" → "Run workflow"
   ```

2. Checking the workflow logs for any missing secret errors

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Rotate secrets regularly** (every 90 days recommended)
3. **Use different secrets for different environments** (dev, staging, prod)
4. **Limit secret access** to only necessary workflows
5. **Monitor secret usage** in GitHub's audit log

## Environment-Specific Secrets

For different environments, prefix your secrets:
- Development: `DEV_*`
- Staging: `STAGING_*`
- Production: `PROD_*`

## Troubleshooting

### Secret not found error
- Verify the secret name matches exactly (case-sensitive)
- Check if the secret is added to the correct repository
- Ensure the workflow has access to the secret

### Authentication failures
- Verify the secret value doesn't have extra spaces or quotes
- Check if the token/key has expired
- Ensure the token has necessary permissions

### Deployment failures
- Verify Vercel project ID and org ID are correct
- Ensure Vercel token has deployment permissions
- Check if the project exists in Vercel

## Local Development

For local development, create a `.env.local` file with the same variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
```

**Note**: Never commit `.env.local` to version control!