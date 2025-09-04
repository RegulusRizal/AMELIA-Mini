# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMELIA-Mini is a Vertical Slice Architecture (VSA) Enterprise Resource Planning (ERP) application built with:
- **Frontend/API**: Next.js 14 (App Router) + TypeScript
- **Database/Auth**: Supabase (PostgreSQL with RLS)
- **Deployment**: Vercel (serverless)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Architecture**: Modules organized by business features, not technical layers

## Essential Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production (run before deploying)
npm run lint         # Run ESLint

# Database Management
npx supabase db push # Push migrations to remote database
npx supabase db pull # Pull remote schema changes
npx supabase migration new <name> # Create new migration

# Deployment
vercel --prod --yes  # Deploy to production
git push origin master # Triggers automatic Vercel deployment
```

## Database Credentials

- **Project URL**: `aigrahysczmodaqpbbqp`
- **Database Password**: `SuperTester!123`
- **Connection String**: `postgresql://postgres.aigrahysczmodaqpbbqp:SuperTester!123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`

## Architecture & Module Structure

### Module Organization
Each module follows VSA principles with self-contained features:
```
app/
├── (modules)/        # Business modules with shared layout
│   ├── users/       # User Management module
│   ├── hr/          # HR module (planned)
│   └── ...
├── auth/            # Authentication pages
├── api/             # API routes
└── lib/             # Shared utilities
```

### Database Schema Patterns
- **Profiles**: Extends auth.users with business data
- **RBAC**: roles, permissions, user_roles, role_permissions tables
- **Module Independence**: Each module owns its tables but can reference shared IDs (like employee_id)
- **RLS Policies**: All tables use Row Level Security - be careful with recursive policies

### Key Implementation Details

1. **Supabase Client Setup**:
   - Server: `lib/supabase/server.ts` - Use for server components/actions
   - Client: `lib/supabase/client.ts` - Use for client components

2. **Authentication Flow**:
   - Middleware at `/middleware.ts` protects routes
   - Protected paths: `/dashboard`, `/users`, `/hr`, etc.
   - Auth callback: `/auth/callback`

3. **Server Actions**:
   - Located in `app/{module}/actions.ts`
   - Use `'use server'` directive
   - Handle form submissions and CRUD operations

## Common Issues & Solutions

### RLS Infinite Recursion
**Problem**: Policies referencing user_roles table can cause infinite loops
**Solution**: Use simple policies without self-referencing subqueries:
```sql
-- BAD: Causes recursion
CREATE POLICY "Check roles" ON user_roles
USING (EXISTS (SELECT 1 FROM user_roles WHERE ...));

-- GOOD: Direct check
CREATE POLICY "Check roles" ON user_roles  
USING (user_id = auth.uid());
```

### TypeScript Build Errors
**Problem**: Supabase types don't match actual return values
**Solution**: Use type assertion with unknown first:
```typescript
return (data as unknown as YourType[]) || [];
```

### Database Migrations Not Applied
**Solution**: Run migrations directly:
```bash
echo "SuperTester!123" | npx supabase db push --db-url "postgresql://..."
```

## Module Development Pattern

When creating a new module:

1. **Database**: Create migration in `supabase/migrations/`
2. **UI**: Create pages in `app/(modules)/{module}/`
3. **Actions**: Add server actions in `app/{module}/actions.ts`
4. **Types**: Define interfaces in the component files
5. **RLS**: Always enable and test Row Level Security

## Current Implementation Status

✅ **Completed**:
- User Management with full CRUD
- Authentication system
- RBAC with roles/permissions
- Dashboard with module navigation

🚧 **In Progress**:
- HR Module integration
- Advanced search/filtering

📋 **Planned**:
- POS Module
- Inventory Management
- Finance Module

## Testing & Debugging

```bash
# Check database state
curl http://localhost:3000/api/debug-users

# Test Supabase connection
curl http://localhost:3000/api/test

# View build errors
npm run build

# Check deployment logs
vercel logs
```

## Important Files

- `/FIX_DATABASE.sql` - Database repair script for RLS issues
- `/ARCHITECTURE.md` - Complete VSA-ERP architecture documentation
- `/middleware.ts` - Route protection logic
- `/app/users/` - Reference implementation for new modules