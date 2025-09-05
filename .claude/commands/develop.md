---
description: Adaptive multi-agent development cycle with dynamic scaling based on complexity
argument-hint: [feature-description or module-name]
allowed-tools: Task, TodoWrite, Read, Grep, Glob
---

# Adaptive Multi-Agent Development Cycle

I'll implement a comprehensive development cycle for: $ARGUMENTS

## Stage 1: Complexity Analysis & Dynamic Planning

First, I'll use the planner agent to analyze complexity and allocate the optimal number of specialized agents.

Use the Task tool to invoke the planner agent with this prompt:
"FIRST, analyze the existing codebase structure and assess the complexity of: $ARGUMENTS

Use your Read, Grep, and Glob tools to:
1. Search for related existing implementations in app/(modules)/
2. Identify all files that need creation or modification
3. Assess database complexity (number of tables, relationships, RLS policies needed)
4. Evaluate UI complexity (pages, components, forms required)
5. Determine server logic requirements (actions, validations, integrations)
6. Review existing patterns that should be followed

THEN, determine optimal agent allocation (1-3 per specialization, max 12 total):

## Complexity Assessment
Provide scores (Low/Medium/High/Very High):
- Database Complexity: [score] - [reasoning]
- Frontend Complexity: [score] - [reasoning]  
- Server Logic Complexity: [score] - [reasoning]
- Integration Complexity: [score] - [reasoning]

## Agent Allocation Decision
Based on complexity, I'm allocating:

**Database Agents (1-3):** [number]
- 1 agent for: Simple schema, 1-2 tables, basic RLS
- 2 agents for: Multiple related tables, complex migrations
- 3 agents for: Large module, many tables, intricate relationships

**Frontend Agents (1-3):** [number]
- 1 agent for: Single page or simple components
- 2 agents for: Multiple pages, complex forms, dashboards
- 3 agents for: Full module UI with many interactive components

**Server Logic Agents (1-3):** [number]
- 1 agent for: Basic CRUD operations
- 2 agents for: Complex business logic, multiple action files
- 3 agents for: Extensive server processing, external integrations

**Integration Agents (0-2):** [number]
- 0 agents for: Simple isolated feature
- 1 agent for: Standard types and module connections
- 2 agents for: Complex cross-module integration

## Detailed Work Distribution

Create a TodoWrite list with specific tasks for each allocated agent:

### Database Track
Database Agent 1: 
- Files: [specific migration files]
- Tasks: [specific tables, columns, relationships]
- Dependencies: None

Database Agent 2 (if allocated):
- Files: [different migration files]
- Tasks: [additional tables, RLS policies]
- Dependencies: After Agent 1's core tables

Database Agent 3 (if allocated):
- Files: [optimization/index files]
- Tasks: [indexes, functions, complex policies]
- Dependencies: After Agents 1 & 2

### Frontend Track
Frontend Agent 1:
- Files: [specific component files]
- Tasks: [main pages, layouts]
- Dependencies: Types from Integration Agent

Frontend Agent 2 (if allocated):
- Files: [different components]
- Tasks: [forms, modals, interactions]
- Dependencies: None, works in parallel

Frontend Agent 3 (if allocated):
- Files: [additional UI files]
- Tasks: [dashboards, reports, visualizations]
- Dependencies: None, works in parallel

### Server Logic Track
Server Agent 1:
- Files: [main actions.ts]
- Tasks: [core CRUD operations]
- Dependencies: Database schema ready

Server Agent 2 (if allocated):
- Files: [additional action files]
- Tasks: [business logic, validations]
- Dependencies: None, different endpoints

Server Agent 3 (if allocated):
- Files: [integration/webhook files]
- Tasks: [external APIs, background jobs]
- Dependencies: None, isolated logic

### Integration Track (if allocated)
Integration Agent 1:
- Files: [types.ts, interfaces]
- Tasks: [TypeScript definitions, module exports]
- Dependencies: None, defines contracts

Integration Agent 2 (if allocated):
- Files: [cross-module connections]
- Tasks: [shared utilities, module composition]
- Dependencies: Core types from Agent 1

Ensure each agent has:
- Clear file boundaries (no conflicts)
- Roughly equal workload
- Explicit dependencies noted
- Specific success criteria"

## Stage 2: Dynamic Parallel Implementation

Based on the planner's allocation, I'll spawn the exact number of agents needed for optimal parallel execution.

### Database Implementation (1-3 agents as allocated)

[If Database Agent 1 allocated]:
Use Task tool for Database Coder 1:
"Implement the database layer tasks assigned to Database Agent 1 for: $ARGUMENTS
Focus exclusively on your assigned files and tables.
Use your tools to:
- Create migrations in supabase/migrations/ 
- Define table schemas with proper types
- Implement RLS policies following security best practices
- Add necessary indexes for performance
Do not modify files assigned to other agents."

[If Database Agent 2 allocated]:
Use Task tool for Database Coder 2:
"Implement the database layer tasks assigned to Database Agent 2 for: $ARGUMENTS
Focus exclusively on your assigned tables and relationships.
Work in parallel with Agent 1 - do not wait or depend on their output.
Create your assigned migrations and RLS policies.
Ensure proper foreign key relationships where specified."

[If Database Agent 3 allocated]:
Use Task tool for Database Coder 3:
"Implement the database optimization tasks assigned to Database Agent 3 for: $ARGUMENTS
Focus on performance optimizations, complex RLS policies, and database functions.
Add indexes, materialized views, or stored procedures as needed.
Ensure all security policies are bulletproof."

### Frontend Implementation (1-3 agents as allocated)

[If Frontend Agent 1 allocated]:
Use Task tool for Frontend Coder 1:
"Implement the UI components assigned to Frontend Agent 1 for: $ARGUMENTS
Focus exclusively on your assigned components and pages.
Use your tools to:
- Create React components with proper TypeScript types
- Implement responsive layouts with Tailwind CSS
- Follow existing component patterns from the codebase
- Add proper loading and error states
Do not modify files assigned to other frontend agents."

[If Frontend Agent 2 allocated]:
Use Task tool for Frontend Coder 2:
"Implement the UI components assigned to Frontend Agent 2 for: $ARGUMENTS
Work in parallel on your assigned forms and interactive components.
Implement form validation, user feedback, and state management.
Follow the established UI patterns and design system."

[If Frontend Agent 3 allocated]:
Use Task tool for Frontend Coder 3:
"Implement the UI components assigned to Frontend Agent 3 for: $ARGUMENTS
Focus on your assigned dashboard and visualization components.
Create data displays, charts, and reporting interfaces.
Ensure responsive design and accessibility."

### Server Logic Implementation (1-3 agents as allocated)

[If Server Agent 1 allocated]:
Use Task tool for Server Coder 1:
"Implement server actions assigned to Server Agent 1 for: $ARGUMENTS
Focus exclusively on your assigned server actions.
Use your tools to:
- Create server actions with 'use server' directive
- Implement CRUD operations with proper validation
- Add error handling and logging
- Ensure proper TypeScript types for all functions
Do not modify files assigned to other server agents."

[If Server Agent 2 allocated]:
Use Task tool for Server Coder 2:
"Implement server logic assigned to Server Agent 2 for: $ARGUMENTS
Work on your assigned business logic and complex operations.
Implement data transformations, calculations, and workflows.
Add comprehensive error handling and validation."

[If Server Agent 3 allocated]:
Use Task tool for Server Coder 3:
"Implement integration logic assigned to Server Agent 3 for: $ARGUMENTS
Focus on external API integrations and background processing.
Implement webhooks, queues, or scheduled jobs as needed.
Ensure proper error recovery and retry mechanisms."

### Integration Implementation (0-2 agents as allocated)

[If Integration Agent 1 allocated]:
Use Task tool for Integration Coder 1:
"Implement type definitions and interfaces assigned to Integration Agent 1 for: $ARGUMENTS
Define all TypeScript types, interfaces, and contracts.
Create shared types that other components will use.
Ensure type safety across the entire feature."

[If Integration Agent 2 allocated]:
Use Task tool for Integration Coder 2:
"Implement cross-module integration assigned to Integration Agent 2 for: $ARGUMENTS
Connect modules, create shared utilities, and compose features.
Ensure proper module boundaries and clean architecture.
Add integration tests if applicable."

## Stage 3: Parallel Quality Auditing

I'll launch exactly 2 auditor agents in parallel to comprehensively review all implementations.

Use the Task tool TWICE IN A SINGLE MESSAGE (for true parallel execution) to invoke auditor agents:

1. Security Auditor Agent:
"Perform a comprehensive security audit on ALL implementations from the allocated agents for: $ARGUMENTS
Review outputs from all [number] agents deployed.
Check for:
- Authentication and authorization vulnerabilities
- RLS policy completeness and correctness
- Input validation and sanitization
- SQL injection risks
- XSS vulnerabilities
- Proper secret management
- GDPR compliance
Provide specific file:line references for any issues found.
Rate security: CRITICAL/HIGH/MEDIUM/LOW risk with detailed evidence."

2. Performance Auditor Agent:
"Analyze performance and code quality for ALL implementations from the allocated agents for: $ARGUMENTS
Review outputs from all [number] agents deployed.
Evaluate:
- Database query efficiency
- Frontend rendering performance
- Bundle size impact
- Code duplication
- TypeScript type safety
- Error handling completeness
- Testing readiness
Provide specific file:line references for any issues found.
Rate quality: EXCELLENT/GOOD/ACCEPTABLE/NEEDS_IMPROVEMENT with detailed evidence."

IMPORTANT: Both auditor agents must run simultaneously in parallel for efficiency.

## Stage 4: Synthesis & Codebase Verification

After both parallel auditors complete, I'll deploy a third auditor to synthesize findings and verify the codebase.

Use the Task tool to invoke the auditor agent:
"You are receiving reports from two parallel auditor agents (Security and Performance) for: $ARGUMENTS

FIRST, synthesize their findings:
- Identify overlapping concerns found by both auditors
- Prioritize issues by severity and impact (CRITICAL → HIGH → MEDIUM → LOW)
- Check for contradictions or conflicts between audit recommendations
- Group related issues that may have common root causes

THEN, double-check the actual codebase to verify these findings:
- Use your Read and Grep tools to examine each flagged code section
- Verify that reported issues actually exist at the specified file:line locations
- Look for any critical issues the parallel auditors may have missed
- Check integration points between all [number] agent implementations:
  * Database ↔ Server layer interfaces
  * Frontend ↔ Server action connections
  * Type consistency across all layers
  * Module boundary violations

FINALLY, provide comprehensive verdict with evidence:

**Verdict Options:**
- SATISFACTORY: All checks passed, code is production-ready
- MINOR_FIXES: Small issues found, quick iteration needed
- NEEDS_REVISION: Significant issues requiring substantial re-implementation

**Required Output:**
1. Confirmed Issues (with exact file:line references)
2. False Positives from initial audits (if any)
3. Additional Issues discovered during verification
4. Root Cause Analysis for systemic problems
5. Specific remediation steps for each confirmed issue
6. Priority order for fixes if revision needed"

## Stage 5: Adaptive Re-iteration

Based on synthesis results, I'll re-allocate agents for fixes if needed.

If verdict is NEEDS_REVISION or MINOR_FIXES:
- Re-run Stage 1 with updated requirements and audit feedback
- Potentially adjust agent allocation based on where issues were found
- Re-deploy only the agents needed for fixes (not full re-implementation)
- May allocate different numbers based on fix complexity
- Document what was fixed in this iteration

Example re-allocation patterns:
- Frontend issues only: Re-deploy 1-2 frontend agents
- Security issues: Deploy 1 database + 1 server agent for fixes
- Integration issues: Deploy 1 integration agent to fix type mismatches

## Stage 6: Comprehensive Documentation

Once implementation is satisfactory, I'll create complete documentation.

Use the Task tool to invoke the documenter agent:
"Create comprehensive documentation for the feature implemented by [number] agents for: $ARGUMENTS

Document all components created:
- Database: [number] agents created [list tables/migrations]
- Frontend: [number] agents created [list components/pages]  
- Server: [number] agents created [list actions/endpoints]
- Integration: [number] agents created [list types/interfaces]

Include:
- Architecture overview showing how all pieces connect
- API documentation for all server actions
- Component documentation with props and usage
- Database schema documentation
- Integration guide for other modules
- Deployment considerations
- Testing recommendations

Update ARCHITECTURE.md if architectural patterns changed.
Create README files in appropriate module directories."

## Final Summary

I'll provide a comprehensive summary including:
- Total agents deployed: [number] ([breakdown by type])
- Features implemented by each agent team
- Complexity assessment accuracy
- Iterations required: [number]
- Audit results and fixes applied
- Documentation created
- Performance metrics (if available)
- Remaining TODOs or future enhancements