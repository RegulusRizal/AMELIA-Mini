---
description: Generate comprehensive documentation for modules, APIs, and architecture
argument-hint: [module-name | file-path | "all" for entire project]
allowed-tools: Task, Read, Grep, Glob
---

# Comprehensive Documentation Generation

I'll generate thorough documentation for: $ARGUMENTS

## Analyzing Scope
First, I'll determine what needs to be documented based on your request.

Use Glob and Grep tools to identify:
- Relevant module files if a module name was provided
- API endpoints and server actions
- Database schemas and migrations
- Component interfaces and props
- Existing documentation that needs updating

## Documentation Generation
I'll use the documenter agent to create comprehensive documentation.

Use the Task tool to invoke the documenter agent with this prompt:
"Generate comprehensive documentation for: $ARGUMENTS. Include the following sections as applicable:

### For Modules:
- Module overview and business purpose
- API endpoints with request/response schemas
- Server actions with parameters and return types
- Database tables and relationships
- UI components with props documentation
- Integration points with other modules
- Usage examples and common patterns
- Security considerations and RLS policies

### For APIs:
- Endpoint documentation (method, path, description)
- Request parameters and body schemas
- Response schemas with status codes
- Authentication requirements
- Rate limiting and quotas
- Example requests using curl/fetch
- Error responses and handling

### For Components:
- Component purpose and usage
- Props interface with TypeScript types
- Event handlers and callbacks
- Styling and customization options
- Accessibility considerations
- Code examples with common use cases

### For Database:
- Table schemas with column descriptions
- Relationships and foreign keys
- RLS policies and security model
- Migration history and rationale
- Performance indexes
- Common queries and patterns

Update these files as needed:
- ARCHITECTURE.md for architectural changes
- README.md for setup/usage updates
- Create module-specific READMEs in appropriate directories
- API.md for endpoint documentation
- DATABASE.md for schema documentation"

## Documentation Structure
Based on the scope, I'll organize documentation in the appropriate locations:

- `/docs/` - Project-wide documentation
- `/app/(modules)/[module]/README.md` - Module-specific docs
- `/docs/api/` - API endpoint documentation
- `/docs/database/` - Database schema docs
- Component documentation inline with JSDoc/TSDoc comments

## Cross-Reference Updates
I'll ensure documentation is properly cross-referenced:

- Update table of contents in main README
- Add links between related documentation
- Update ARCHITECTURE.md with new modules/features
- Ensure consistent terminology across all docs

## Final Output
I'll provide:
- Summary of documentation created/updated
- File locations for new documentation
- Any gaps or areas needing manual review
- Suggested next documentation tasks