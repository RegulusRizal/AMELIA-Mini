# AMELIA-Mini Audit Exports

This directory contains comprehensive code exports for external audit, review, and verification purposes.

## Available Exports

### Full Codebase Export
- **File**: `full-codebase_[TIMESTAMP].md`
- **Command**: `bash collect-audit.sh full`
- **Contains**: Complete snapshot of entire codebase including all modules, configurations, database schemas, and documentation
- **Use Case**: Security audits, comprehensive code reviews, external verification

### User Management Module Export
- **File**: `user-management_[TIMESTAMP].md`
- **Command**: `bash collect-audit.sh user-management`
- **Contains**: Complete user management module including authentication, RBAC, profiles
- **Use Case**: Module-specific reviews, focused security audits

## Export Script Usage

The `collect-audit.sh` script generates timestamped exports automatically:

```bash
# Generate full codebase export
bash collect-audit.sh full

# Generate user-management module export
bash collect-audit.sh user-management

# Generate custom module export (any module name)
bash collect-audit.sh [module-name]
```

## Export Features

All exports automatically:
- Generate timestamped filenames (e.g., `full-codebase_20250905_210157.md`)
- Exclude sensitive information (.env files, credentials, API keys)
- Include comprehensive table of contents
- Provide complete file listings with syntax highlighting
- Generate summary statistics
- Maintain consistent formatting for easy review

## Security Considerations

### Excluded from Exports
- `.env` files (all variations)
- `node_modules/` directory
- `.next/` build directory
- `.git/` directory
- Any hardcoded credentials or API keys
- Database connection strings with passwords

### Included in Exports
- All source code files (.ts, .tsx, .js, .jsx)
- SQL schema files and migrations
- Configuration files (without secrets)
- Documentation files
- Public API routes
- Component and utility libraries

## Latest Export

**Most Recent Full Export**: `full-codebase_20250905_210157.md`
- Size: 214KB
- Files Included: 104
- Generated: 2025-09-05 21:01:57

## Sharing Exports

The generated markdown files can be:
- Viewed directly in any markdown viewer
- Converted to PDF for formal documentation
- Imported into documentation systems
- Shared via secure file transfer for external review
- Used as input for automated security scanning tools

## Verification

To verify export integrity:
1. Check file size matches reported size
2. Confirm timestamp in filename
3. Verify table of contents is complete
4. Ensure no sensitive data is present
5. Validate all expected modules are included

## Support

For questions about exports or to request custom export configurations, refer to the main project documentation in `/CLAUDE.md` or `/ARCHITECTURE.md`.