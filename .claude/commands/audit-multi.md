---
description: Run multiple parallel auditors with synthesis planning
argument-hint: [number-of-auditors (2-5)] [target-module or file-path]
allowed-tools: Task, TodoWrite, Read, Grep, Glob
---

# Multi-Auditor Parallel Analysis with Synthesis

I'll orchestrate multiple parallel audits for comprehensive analysis.

## Configuration
Parsing arguments to determine:
- Number of parallel auditors: $1 (default: 3, max: 5)
- Target for analysis: $2 (or entire codebase if not specified)

## Parallel Auditing Phase
I'll launch multiple specialized auditors simultaneously, each focusing on different aspects.

Based on the number requested, I'll use the Task tool to invoke auditor agents in parallel with these specialized prompts:

### Auditor 1: Security & Authentication
"Perform a comprehensive security audit on: $2. Focus on:
- Authentication and authorization implementation
- RLS policies and potential bypasses
- SQL injection vulnerabilities
- XSS and CSRF protection
- Secrets management and exposure risks
- Input validation and sanitization
- API endpoint security
- Session management
Report critical vulnerabilities with severity levels."

### Auditor 2: Performance & Optimization
"Analyze performance characteristics of: $2. Evaluate:
- Database query efficiency and N+1 problems
- Bundle size and code splitting opportunities
- Rendering performance and unnecessary re-renders
- API response times and bottlenecks
- Caching strategies and opportunities
- Memory leaks and resource management
- Lazy loading and virtualization needs
Provide specific optimization recommendations with impact assessment."

### Auditor 3: Code Quality & Architecture
"Review code quality and architectural compliance for: $2. Assess:
- VSA principles adherence
- Module boundary violations
- Code duplication and DRY violations
- TypeScript type safety and any types
- Error handling completeness
- Testing coverage gaps
- Documentation quality
- Technical debt and refactoring needs
Rate code quality on a scale with specific improvement areas."

### Auditor 4: Database & Data Integrity (if 4+ auditors requested)
"Audit database design and data integrity for: $2. Check:
- Schema design and normalization
- RLS policy completeness and correctness
- Migration safety and reversibility
- Index optimization opportunities
- Data consistency constraints
- Transaction handling
- Backup and recovery considerations
Identify data risks and provide mitigation strategies."

### Auditor 5: Compliance & Best Practices (if 5 auditors requested)
"Evaluate compliance and best practices adherence for: $2. Review:
- Accessibility (WCAG) compliance
- GDPR/privacy considerations
- Industry best practices (OWASP, etc.)
- Error logging and monitoring setup
- CI/CD pipeline integration
- Dependency vulnerabilities
- License compliance
- Production readiness checklist
Provide compliance scorecard with remediation priorities."

## Synthesis Planning Phase
After all auditors complete, I'll use the planner agent to synthesize findings.

Use the Task tool to invoke the planner agent:
"Synthesize the findings from $1 parallel audit reports for: $2. 
Create a unified action plan that:

1. **Critical Issues Matrix**
   - Cross-reference issues found by multiple auditors
   - Identify root causes affecting multiple areas
   - Prioritize by severity and impact

2. **Consolidated Recommendations**
   - Group related recommendations
   - Identify quick wins vs long-term improvements
   - Estimate effort and impact for each

3. **Implementation Roadmap**
   - Order tasks by dependencies and priority
   - Define clear success metrics
   - Identify required resources and expertise

4. **Risk Assessment**
   - Calculate overall risk score
   - Highlight blockers for production deployment
   - Provide mitigation strategies

5. **Quality Metrics Dashboard**
   - Security score
   - Performance grade
   - Code quality rating
   - Architecture compliance percentage
   - Overall health score

Generate a clear, actionable plan with:
- Immediate actions (fix within 24 hours)
- Short-term improvements (1 week)
- Long-term refactoring (1 month)
- Monitoring and prevention strategies"

## Final Report
I'll compile and present:
- Executive summary of all findings
- Detailed issue breakdown by category
- Prioritized action items
- Resource requirements
- Timeline recommendations
- Success metrics and KPIs
- Follow-up audit schedule