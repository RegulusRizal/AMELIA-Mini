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

## Specialized Agents for Development

Claude Code provides specialized agents to handle complex, multi-step tasks autonomously. Use the `Task` tool to invoke these agents when dealing with intricate development scenarios.

### When to Use Agents vs Direct Tools
- **Use Agents**: For complex multi-step tasks, open-ended searches, module generation, comprehensive planning
- **Use Direct Tools**: For specific file reads, single edits, simple searches with known paths

### Available Specialized Agents

#### Core Development Agents

**`coder`** - VSA Module Development Expert
- **Use For**: Implementing new features, CRUD operations, UI components, fixing module bugs
- **Example**: "Use coder agent to implement employee onboarding workflow in HR module"
- **Tools**: Read, Edit, MultiEdit, Write, Bash, Grep, Glob, TodoWrite

**`module-generator`** - VSA Module Scaffolding Specialist  
- **Use For**: Creating complete ERP modules with database, UI, server actions, and types
- **Example**: "Use module-generator to create POS module with inventory tracking"
- **Tools**: Read, Write, MultiEdit, Bash, Grep, Glob

#### Architecture & Database Agents

**`database-specialist`** - PostgreSQL/Supabase Expert
- **Use For**: Creating migrations, fixing RLS policies, optimizing queries, database design
- **CRITICAL**: Essential for avoiding RLS infinite recursion issues documented in this project
- **Example**: "Use database-specialist to create inventory tables with proper RLS policies"
- **Tools**: Read, Write, Edit, MultiEdit, Bash, Grep

**`planner`** - Strategic Architecture Specialist
- **Use For**: Module integration planning, system design, breaking down complex features
- **Example**: "Use planner to design integration between HR and Finance modules"
- **Tools**: Read, TodoWrite, WebSearch, Grep, Glob

#### Quality & Operations Agents

**`auditor`** - Security & Code Quality Specialist
- **Use For**: Security reviews, RLS policy verification, performance analysis, compliance
- **Example**: "Use auditor to verify all RLS policies in user management module"
- **Tools**: Read, Grep, Glob, Bash, WebSearch, TodoWrite

**`deployment`** - DevOps & Vercel Specialist
- **Use For**: Deployment issues, build optimization, CI/CD setup, Vercel configuration
- **Example**: "Use deployment agent to fix Vercel build errors and optimize bundle size"
- **Tools**: Bash, Read, Edit, WebFetch, Grep, Glob

**`test-engineer`** - Testing & QA Specialist
- **Use For**: Creating unit/integration/E2E tests, improving test coverage
- **Example**: "Use test-engineer to create tests for user CRUD operations"
- **Tools**: Read, Write, Edit, MultiEdit, Bash, Grep, Glob

**`documenter`** - Documentation Specialist
- **Use For**: Creating API docs, module guides, updating ARCHITECTURE.md
- **Example**: "Use documenter to create API documentation for HR module endpoints"
- **Tools**: Read, Write, Edit, MultiEdit, Grep, Glob

**`exporter`** - Code Export & Audit Specialist
- **Use For**: Generating code exports for external verification, audit, or review
- **CRITICAL**: Dynamically handles ANY module (current or future) without configuration
- **Example**: "Use exporter to create audit export for HR module" or "Use exporter for full codebase audit"
- **Tools**: Bash, Read, Write, Glob, Grep

#### Utility Agents

**`general-purpose`** - Multi-Purpose Research Agent
- **Use For**: Complex searches, investigating issues across multiple files
- **Example**: "Use general-purpose to find all employee_id references across modules"
- **Tools**: All available tools

**`statusline-setup`** - Claude Code Configuration
- **Use For**: Configuring Claude Code status line settings
- **Tools**: Read, Edit

**`output-style-setup`** - Output Style Configuration
- **Use For**: Creating Claude Code output styles
- **Tools**: Read, Write, Edit, Glob, Grep

### Strategic Agent Usage for AMELIA-Mini

1. **Module Development Workflow**:
   ```
   planner → module-generator → database-specialist → coder → test-engineer → exporter
   ```

2. **Database Changes with RLS**:
   - Always use `database-specialist` for RLS policies to avoid recursion
   - Follow up with `auditor` for security verification

3. **Audit & Export Workflow**:
   - Development: `coder` → `test-engineer` → `exporter` (for review)
   - Security Review: `exporter` → external audit → `auditor` for fixes
   - Module Handoff: `exporter` to create module documentation

4. **Concurrent Agent Execution**:
   - Launch multiple agents in parallel for independent tasks
   - Example: `planner` for architecture + `auditor` for existing code review

5. **Common Patterns**:
   - New Module: `module-generator` then `database-specialist` for migrations
   - Bug Fix: `general-purpose` to investigate, then `coder` to fix
   - Deployment Issues: `deployment` for Vercel, `database-specialist` for Supabase
   - Code Review: `exporter` for consolidated view, then `auditor` for analysis

### Agent Task Examples for This Project

```typescript
// Creating HR Module
"Use module-generator to scaffold HR module with employees, departments, and leave management"

// Fixing RLS Issues  
"Use database-specialist to fix RLS infinite recursion in user_roles table"

// Planning Integration
"Use planner to design data flow between POS and Inventory modules"

// Security Audit
"Use auditor to verify no sensitive data leaks in API endpoints"

// Export for Review
"Use exporter to create audit export for the HR module"
"Use exporter to generate full codebase export for external security review"
"Use exporter to create multi-module export for users and finance modules"
```

## Custom Slash Commands

Advanced orchestration commands that leverage multiple specialized agents for complex workflows. Located in `.claude/commands/`.

### Available Commands

**`/develop [feature-description]`** - Adaptive Multi-Agent Development Cycle
- Dynamically allocates 1-3 specialized agents per layer based on complexity (4-12 total)
- Orchestrates: complexity analysis → parallel coders → dual audits → synthesis → documentation
- Features conditional re-iteration with smart re-allocation if quality standards not met
- Adapts to task complexity: simple features use fewer agents, complex modules use more
- Perfect for any scale of implementation with optimal resource usage

**`/document [module|file|"all"]`** - Comprehensive Documentation
- Generates API docs, module guides, database schemas
- Updates ARCHITECTURE.md and creates READMEs
- Context-aware based on target scope

**`/audit-multi [num-auditors] [target]`** - Parallel Multi-Audit Analysis  
- Runs 2-5 specialized auditors in parallel (default: 3)
- Each auditor focuses on different aspects (security, performance, quality, etc.)
- Synthesizes all findings into prioritized action plan
- Provides consolidated risk assessment and roadmap

### Usage Examples
```bash
# Simple feature - uses ~4 agents (1 per layer)
/develop "add email validation to user form"

# Complex module - uses ~10 agents (multiple per layer)  
/develop "employee onboarding workflow with approvals"

# Document specific module
/document users

# Run 4 parallel audits on module
/audit-multi 4 app/users

# Document entire project
/document all
```

### Command Benefits
- **Adaptive Scaling**: Automatically adjusts agent count based on task complexity (4-12 agents)
- **Optimal Resource Usage**: Simple tasks use fewer agents, complex tasks use more
- **Maximum Parallelization**: Up to 3 agents per specialization work simultaneously  
- **Smart Re-allocation**: Only deploys needed agents for fixes during re-iteration
- **Quality Assurance**: Multiple audit stages with conditional re-implementation
- **Comprehensive Documentation**: Automatic documentation proportional to implementation scale

## Database Credentials

Database credentials should be stored in environment variables:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)
- `DATABASE_URL`: PostgreSQL connection string

See `.env.local.example` for the required environment variables.
Never commit actual credentials to the repository.

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
npx supabase db push --db-url "$DATABASE_URL"
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