#!/bin/bash

# AMELIA-Mini Full Codebase Export Script
# Generates comprehensive code exports for external audit and review

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Set export type
EXPORT_TYPE="${1:-full}"

# Determine output file name based on export type
if [ "$EXPORT_TYPE" == "full" ]; then
    OUTPUT_FILE="FOR_AUDIT/full-codebase_${TIMESTAMP}.md"
    print_status "Generating full codebase export..."
elif [ "$EXPORT_TYPE" == "user-management" ]; then
    OUTPUT_FILE="FOR_AUDIT/user-management_${TIMESTAMP}.md"
    print_status "Generating user-management module export..."
else
    OUTPUT_FILE="FOR_AUDIT/${EXPORT_TYPE}_${TIMESTAMP}.md"
    print_status "Generating ${EXPORT_TYPE} export..."
fi

# Initialize the export file
cat > "$OUTPUT_FILE" << 'EOF'
# AMELIA-Mini - Full Codebase Audit Export
EOF

echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "Export Type: $EXPORT_TYPE" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'

## Project Overview

AMELIA-Mini is a Vertical Slice Architecture (VSA) Enterprise Resource Planning (ERP) application built with:
- **Frontend/API**: Next.js 14 (App Router) + TypeScript
- **Database/Auth**: Supabase (PostgreSQL with RLS)
- **Deployment**: Vercel (serverless)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Architecture**: Modules organized by business features, not technical layers

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Configuration Files](#configuration-files)
3. [Database Schema & Migrations](#database-schema--migrations)
4. [Application Modules](#application-modules)
5. [API Routes](#api-routes)
6. [Components](#components)
7. [Library & Utilities](#library--utilities)
8. [Authentication & Middleware](#authentication--middleware)
9. [Styles](#styles)
10. [Documentation](#documentation)

---

## Directory Structure

```
EOF

# Add directory tree (excluding node_modules, .git, .next)
print_status "Generating directory structure..."
tree -I 'node_modules|.git|.next|.vercel|.claude' -a >> "$OUTPUT_FILE" 2>/dev/null || {
    find . -type d \( -name node_modules -o -name .git -o -name .next -o -name .vercel -o -name .claude \) -prune -o -type d -print | sed 's|^\./||' | sort >> "$OUTPUT_FILE"
}

echo '```' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Configuration Files Section
echo "## Configuration Files" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Process each configuration file
CONFIG_FILES=(
    "package.json"
    "tsconfig.json"
    "next.config.mjs"
    "tailwind.config.ts"
    "postcss.config.mjs"
    "components.json"
    ".env.local.example"
    ".eslintrc.json"
    "middleware.ts"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Adding $file..."
        echo "### $file" >> "$OUTPUT_FILE"
        echo '```json' >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

# Database Schema & Migrations
echo "## Database Schema & Migrations" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ -d "supabase/migrations" ]; then
    print_status "Processing database migrations..."
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "### $(basename "$migration")" >> "$OUTPUT_FILE"
            echo '```sql' >> "$OUTPUT_FILE"
            cat "$migration" >> "$OUTPUT_FILE"
            echo '```' >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
        fi
    done
fi

# Application Modules
echo "## Application Modules" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Process (modules) directory
if [ -d "app/(modules)" ]; then
    print_status "Processing application modules..."
    
    # Process each module directory
    for module_dir in app/\(modules\)/*/; do
        if [ -d "$module_dir" ]; then
            module_name=$(basename "$module_dir")
            echo "### Module: $module_name" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            
            # Find all TypeScript/JavaScript files in the module
            find "$module_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
                relative_path="${file#./}"
                echo "#### $relative_path" >> "$OUTPUT_FILE"
                echo '```typescript' >> "$OUTPUT_FILE"
                cat "$file" >> "$OUTPUT_FILE"
                echo '```' >> "$OUTPUT_FILE"
                echo "" >> "$OUTPUT_FILE"
            done
        fi
    done
    
    # Process layout file
    if [ -f "app/(modules)/layout.tsx" ]; then
        echo "#### app/(modules)/layout.tsx" >> "$OUTPUT_FILE"
        echo '```typescript' >> "$OUTPUT_FILE"
        cat "app/(modules)/layout.tsx" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
fi

# API Routes
echo "## API Routes" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ -d "app/api" ]; then
    print_status "Processing API routes..."
    find app/api -name "route.ts" -o -name "route.js" | while read -r file; do
        relative_path="${file#./}"
        echo "### $relative_path" >> "$OUTPUT_FILE"
        echo '```typescript' >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
fi

# Components
echo "## Components" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ -d "components" ]; then
    print_status "Processing components..."
    find components -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) | while read -r file; do
        relative_path="${file#./}"
        echo "### $relative_path" >> "$OUTPUT_FILE"
        echo '```typescript' >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
fi

# Library & Utilities
echo "## Library & Utilities" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ -d "lib" ]; then
    print_status "Processing library files..."
    find lib -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
        relative_path="${file#./}"
        echo "### $relative_path" >> "$OUTPUT_FILE"
        echo '```typescript' >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
fi

# Authentication & Middleware
echo "## Authentication & Middleware" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Auth directory
if [ -d "app/auth" ]; then
    print_status "Processing authentication files..."
    find app/auth -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
        relative_path="${file#./}"
        echo "### $relative_path" >> "$OUTPUT_FILE"
        echo '```typescript' >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
fi

# Root app files
print_status "Processing root application files..."
for file in app/layout.tsx app/page.tsx app/globals.css; do
    if [ -f "$file" ]; then
        echo "### $file" >> "$OUTPUT_FILE"
        if [[ "$file" == *.css ]]; then
            echo '```css' >> "$OUTPUT_FILE"
        else
            echo '```typescript' >> "$OUTPUT_FILE"
        fi
        cat "$file" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

# Styles
echo "## Styles" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ -f "app/globals.css" ]; then
    print_status "Processing global styles..."
    echo "### app/globals.css" >> "$OUTPUT_FILE"
    echo '```css' >> "$OUTPUT_FILE"
    cat "app/globals.css" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# Documentation Files
echo "## Documentation" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

DOC_FILES=(
    "README.md"
    "ARCHITECTURE.md"
    "CLAUDE.md"
    "CRITICAL_FIX_PLAN.md"
    "PHASE1_SECURITY_FIXES.md"
)

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        print_status "Adding $doc..."
        echo "### $doc" >> "$OUTPUT_FILE"
        echo '```markdown' >> "$OUTPUT_FILE"
        cat "$doc" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

# Add summary statistics
echo "## Export Summary" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- **Export Generated**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "- **Export Type**: $EXPORT_TYPE" >> "$OUTPUT_FILE"

# Count files
total_files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.sql" -o -name "*.css" -o -name "*.md" \) | grep -v node_modules | grep -v .next | grep -v .git | wc -l)
echo "- **Total Files Collected**: $total_files" >> "$OUTPUT_FILE"

# File size
file_size=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "- **Export File Size**: $file_size" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "This export was generated automatically for audit and review purposes." >> "$OUTPUT_FILE"
echo "All sensitive information (API keys, credentials, .env files) has been excluded." >> "$OUTPUT_FILE"

# Print completion message
print_success "Export completed successfully!"
echo ""
print_status "Output file: $OUTPUT_FILE"
print_status "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
print_status "Total files processed: $total_files"
echo ""
print_success "Export ready for external review!"