#!/bin/bash

# 🧹 Complete Project Cleanup & Organization Script
# Fixes all identified issues in one go

echo "🚀 Starting Complete Project Cleanup & Organization..."
echo "📅 Date: $(date)"
echo ""

# Create comprehensive archive structure
echo "📁 Step 1: Creating archive structure..."
mkdir -p ./project-health/archive/scattered-json-files
mkdir -p ./project-health/archive/backup-diagnostics
mkdir -p ./project-health/archive/old-configs

# Step 2: Clean up scattered .json files in project-health root
echo "📁 Step 2: Archiving scattered .json files from project-health root..."
cd ./project-health/

json_count=0
# Archive all .json files except PROJECT_KNOWLEDGE.md
for file in *.json; do
    if [ -f "$file" ]; then
        echo "   📦 Moving: $file"
        mv "$file" "./archive/scattered-json-files/"
        ((json_count++))
    fi
done

# Also archive any timestamped files
for file in *2025-*; do
    if [ -f "$file" ]; then
        echo "   📦 Moving timestamped file: $file"
        mv "$file" "./archive/scattered-json-files/"
        ((json_count++))
    fi
done

echo "   ✅ Archived $json_count scattered files"
cd ..

# Step 3: Clean up backup diagnostic files (reduce noise)
echo "📁 Step 3: Archiving backup diagnostic files..."
cd ./project-health/diagnostics/queries/

backup_count=0
backup_files=(
    "unified-diagnostics-broken-backup*.js"
    "unified-diagnostics-simple-backup*.js"
    "*backup*.js"
)

for pattern in "${backup_files[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "   📦 Moving backup: $file"
            mv "$file" "../../archive/backup-diagnostics/"
            ((backup_count++))
        fi
    done
done

echo "   ✅ Archived $backup_count backup diagnostic files"
cd ../../..

# Step 4: Verify and report current diagnostic structure
echo "📁 Step 4: Verifying diagnostic file structure..."
echo ""
echo "   🔍 Active diagnostic queries in /queries/:"
if [ -d "./project-health/diagnostics/queries" ]; then
    active_files=($(find ./project-health/diagnostics/queries -name "*.js" -not -name "*backup*" | wc -l))
    find ./project-health/diagnostics/queries -name "*.js" -not -name "*backup*" -exec basename {} \; | sed 's/^/      ✅ /'
    echo "      📊 Total active queries: $active_files"
else
    echo "      ❌ Queries directory not found!"
fi

# Step 5: Verify output directories exist and are clean
echo ""
echo "📁 Step 5: Verifying output directory structure..."
mkdir -p ./project-health/diagnostics/outputs
mkdir -p ./project-health/upload-to-claude

echo "   ✅ Diagnostics outputs: ./project-health/diagnostics/outputs"
echo "   ✅ Upload to Claude: ./project-health/upload-to-claude"

# Step 6: Create file organization summary
echo ""
echo "📁 Step 6: Creating file organization documentation..."
cat > ./project-health/FILE_ORGANIZATION.md << 'EOF'
# 📁 Project Health File Organization

## Current Structure (After Cleanup)

### 🎯 Primary Files
- **daily-health-check.js** (root) - Main morning sync with git integration
- **run-diagnostics.js** (root) - Runs all diagnostic queries individually

### 📂 Directory Structure
```
project-health/
├── morning-sync/
│   ├── latest/          # Latest morning sync outputs
│   └── archive/         # Previous morning sync results
├── diagnostics/
│   ├── queries/         # Active diagnostic test files
│   └── outputs/         # Individual diagnostic outputs (from run-diagnostics.js)
├── upload-to-claude/    # All outputs for Claude analysis (from daily-health-check.js)
└── archive/             # Archived/backup files
    ├── scattered-json-files/
    ├── backup-diagnostics/
    └── old-configs/
```

### 🔄 Data Flow
1. **daily-health-check.js** (root):
   - Runs ALL queries from `/diagnostics/queries/`
   - Saves outputs to `/upload-to-claude/`
   - Includes git integration with confirmation prompts
   - Updates PROJECT_KNOWLEDGE.md

2. **run-diagnostics.js** (root):
   - Runs ALL queries from `/diagnostics/queries/`
   - Saves outputs to `/diagnostics/outputs/`
   - Individual diagnostic testing

### 🧪 Diagnostic Files (ACTIVE)
These files are executed by both daily-health-check.js and run-diagnostics.js:
- ✅ database-function-tests.js
- ✅ nda-workflow-tests.js
- ✅ unified-diagnostics.js
- ⚠️ e2e-automation-test.js (needs database fix)

### 📦 Archived Files
- Backup diagnostic files (unified-diagnostics-*backup*.js)
- Scattered .json files from project-health root
- Timestamped configuration files

## Usage Commands

```bash
# Complete daily health check (recommended)
node daily-health-check.js

# Individual diagnostics only
node run-diagnostics.js

# Individual unified diagnostics
node unified-diagnostics.js
```

---
*Updated after cleanup on $(date)*
EOF

echo "   ✅ Created FILE_ORGANIZATION.md"

# Step 7: Apply e2e test fix if file exists
echo ""
echo "📁 Step 7: Checking e2e-automation-test.js..."
if [ -f "./project-health/diagnostics/queries/e2e-automation-test.js" ]; then
    echo "   ⚠️  MANUAL ACTION REQUIRED:"
    echo "      1. Edit ./project-health/diagnostics/queries/e2e-automation-test.js"
    echo "      2. Replace step1_CreateTestBusiness function with fixed version"
    echo "      3. See Claude's 'Fixed e2e-automation-test.js' artifact for exact code"
    echo "      4. OR temporarily move to archive until fixed:"
    echo "         mv ./project-health/diagnostics/queries/e2e-automation-test.js ./project-health/archive/backup-diagnostics/e2e-automation-test-needs-fix.js"
else
    echo "   ℹ️  e2e-automation-test.js not found in queries folder"
fi

# Step 8: Final verification and summary
echo ""
echo "📁 Step 8: Final structure verification..."
echo ""
echo "🎉 CLEANUP COMPLETE!"
echo ""
echo "📊 Cleanup Summary:"
echo "   📦 Archived JSON files: $json_count"
echo "   📦 Archived backup diagnostics: $backup_count"
echo "   ✅ Active diagnostic queries: $(find ./project-health/diagnostics/queries -name "*.js" -not -name "*backup*" 2>/dev/null | wc -l)"
echo "   ✅ Directory structure: Organized"
echo "   ✅ Documentation: Updated"
echo ""
echo "🔧 Next Actions:"
echo "   1. Apply e2e-automation-test.js fix (see artifact)"
echo "   2. Test: node daily-health-check.js"
echo "   3. Test: node run-diagnostics.js"
echo "   4. Verify outputs in correct directories"
echo ""
echo "📁 File Organization:"
echo "   ✅ daily-health-check.js → /upload-to-claude/"
echo "   ✅ run-diagnostics.js → /diagnostics/outputs/"
echo "   ✅ Archive: ./project-health/archive/"
echo ""
echo "💡 Expected Success Rate: Should improve to 3-4/4 after e2e fix!"
echo ""
echo "📋 Quick Test Commands:"
echo "   node daily-health-check.js  # Complete sync with git integration"
echo "   node run-diagnostics.js     # Individual diagnostics only"