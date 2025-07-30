#!/bin/bash

echo "🔧 Organizing Your Existing Working System..."
echo "=============================================="
echo ""

# Step 1: Create the organized structure
echo "📁 Step 1: Creating organized structure..."
mkdir -p project-health/morning-sync/latest
mkdir -p project-health/morning-sync/archive
mkdir -p project-health/diagnostics/queries
mkdir -p project-health/diagnostics/outputs/latest  
mkdir -p project-health/diagnostics/archive
mkdir -p project-health/testing/outputs/latest
mkdir -p project-health/testing/archive

echo "   ✅ Organized directory structure created"

# Step 2: Move scattered output files to organized locations
echo "📦 Step 2: Moving scattered output files..."

# Move current analysis outputs to latest
[ -f "./codebase-analysis-report.md" ] && mv "./codebase-analysis-report.md" "./project-health/morning-sync/latest/" && echo "   Moved codebase-analysis-report.md"
[ -f "./full-analysis.json" ] && mv "./full-analysis.json" "./project-health/morning-sync/latest/" && echo "   Moved full-analysis.json"
[ -f "./route-mapping.ts" ] && mv "./route-mapping.ts" "./project-health/morning-sync/latest/" && echo "   Moved route-mapping.ts"

# Move scattered files from project-health root to archive
ARCHIVE_DATE=$(date +%Y-%m-%d)
mkdir -p "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files"

[ -f "./project-health/complete-project-health.json" ] && mv "./project-health/complete-project-health.json" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived complete-project-health.json"
[ -f "./project-health/project-health.json" ] && mv "./project-health/project-health.json" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived project-health.json"
[ -f "./project-health/route-mapping.ts" ] && mv "./project-health/route-mapping.ts" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived duplicate route-mapping.ts"

# Move backup files to archive
mkdir -p "./project-health/morning-sync/archive/backups"
[ -f "./daily-health-check-backup.js" ] && mv "./daily-health-check-backup.js" "./project-health/morning-sync/archive/backups/" && echo "   Archived daily-health-check-backup.js"
[ -f "./daily-health-check.js.backup" ] && mv "./daily-health-check.js.backup" "./project-health/morning-sync/archive/backups/" && echo "   Archived daily-health-check.js.backup"
[ -f "./supabase-analyzer.js.backup" ] && mv "./supabase-analyzer.js.backup" "./project-health/morning-sync/archive/backups/" && echo "   Archived supabase-analyzer.js.backup"

# Archive large analysis files that are probably old
[ -f "./depcruise.json" ] && mv "./depcruise.json" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived depcruise.json"
[ -f "./eslint-complexity.json" ] && mv "./eslint-complexity.json" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived eslint-complexity.json"
[ -f "./jobseeker-deps.json" ] && mv "./jobseeker-deps.json" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived jobseeker-deps.json"
[ -f "./madge.json" ] && mv "./madge.json" "./project-health/morning-sync/archive/${ARCHIVE_DATE}/old-scattered-files/" && echo "   Archived madge.json"

echo "   ✅ Scattered files organized"

# Step 3: Create diagnostic runner
echo "🔬 Step 3: Creating diagnostic system..."
cat > project-health/diagnostics/run-diagnostics.js << 'EOF'
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputsDir = './project-health/diagnostics/outputs/latest';
const queriesDir = './project-health/diagnostics/queries';

console.log('🔬 Starting Diagnostic Suite...');
fs.mkdirSync(outputsDir, { recursive: true });

// Get diagnostic query files
let queryFiles = [];
try {
  if (fs.existsSync(queriesDir)) {
    queryFiles = fs.readdirSync(queriesDir).filter(f => f.endsWith('.js'));
  }
} catch (error) {
  console.log('📭 Cannot read queries directory');
}

if (queryFiles.length === 0) {
  console.log('📭 No diagnostic queries found in', queriesDir);
  console.log('ℹ️  Add .js files to', queriesDir, 'to run diagnostic queries');
  process.exit(0);
}

console.log(`🔍 Found ${queryFiles.length} diagnostic queries`);

const results = { successful: 0, failed: 0, queries: {} };

queryFiles.forEach(file => {
  const queryName = path.basename(file, '.js');
  console.log(`📊 Running: ${queryName}`);
  
  try {
    const output = execSync(`node "${path.join(queriesDir, file)}"`, { 
      encoding: 'utf8', timeout: 30000 
    });
    
    let parsedOutput;
    try { parsedOutput = JSON.parse(output); } 
    catch { parsedOutput = { type: 'text', content: output, timestamp: new Date().toISOString() }; }
    
    fs.writeFileSync(
      path.join(outputsDir, `${queryName}-latest.json`), 
      JSON.stringify(parsedOutput, null, 2)
    );
    
    results.queries[queryName] = { status: 'SUCCESS', timestamp: new Date().toISOString() };
    results.successful++;
    console.log(`   ✅ ${queryName} completed`);
  } catch (error) {
    fs.writeFileSync(
      path.join(outputsDir, `${queryName}-error.json`),
      JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }, null, 2)
    );
    results.queries[queryName] = { status: 'FAILED', error: error.message.split('\n')[0] };
    results.failed++;
    console.log(`   ❌ ${queryName} failed:`, error.message.split('\n')[0]);
  }
});

const summary = { ...results, timestamp: new Date().toISOString() };
fs.writeFileSync(path.join(outputsDir, 'diagnostic-summary.json'), JSON.stringify(summary, null, 2));

console.log(`\n🎉 Diagnostics Complete!`);
console.log(`   ✅ Successful: ${results.successful}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   📁 Results in: ${outputsDir}`);
EOF

chmod +x project-health/diagnostics/run-diagnostics.js

# Step 4: Create archiving scripts
echo "📦 Step 4: Creating archiving scripts..."

cat > project-health/morning-sync/archive-morning-sync.js << 'EOF'
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const today = new Date().toISOString().split('T')[0];
const latestDir = './project-health/morning-sync/latest';
const archiveDir = `./project-health/morning-sync/archive/${today}`;

console.log('📦 Archiving morning-sync outputs...');
fs.mkdirSync(archiveDir, { recursive: true });

if (!fs.existsSync(latestDir)) {
  console.log('❌ No latest outputs to archive');
  process.exit(0);
}

const files = fs.readdirSync(latestDir);
if (files.length === 0) {
  console.log('📭 No files to archive');
  process.exit(0);
}

let archived = 0;
files.forEach(file => {
  try {
    const source = path.join(latestDir, file);
    const dest = path.join(archiveDir, file);
    fs.copyFileSync(source, dest);
    fs.unlinkSync(source);
    archived++;
  } catch (error) {
    console.log(`⚠️  Failed to archive ${file}:`, error.message);
  }
});

console.log(`✅ Archived ${archived} files to ${archiveDir}`);
EOF

chmod +x project-health/morning-sync/archive-morning-sync.js

# Step 5: Update package.json scripts
echo "📝 Step 5: Updating package.json scripts..."
node -e "
const fs = require('fs');
try {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const newScripts = {
    ...pkg.scripts,
    'morning-sync': 'node daily-health-check.js',
    'morning-sync:archive': 'node project-health/morning-sync/archive-morning-sync.js',
    'diagnostics': 'node project-health/diagnostics/run-diagnostics.js',
    'health-check': 'npm run morning-sync && npm run diagnostics',
    'cleanup:outputs': 'rm -rf project-health/*/latest/* && echo Cleaned all latest outputs'
  };
  
  pkg.scripts = newScripts;
  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
  console.log('✅ Package.json updated with organized scripts');
} catch (error) {
  console.log('❌ Failed to update package.json:', error.message);
}
"

echo ""
echo "🎉 ORGANIZATION COMPLETE!"
echo "========================"
echo ""
echo "✅ All scattered files organized into structured directories"
echo "✅ Output files moved to project-health/morning-sync/latest/"
echo "✅ Old files archived to project-health/morning-sync/archive/"
echo "✅ Package.json updated with new scripts"
echo ""
echo "�� NEW STRUCTURE:"
echo "   project-health/"
echo "   ├── morning-sync/latest/     # Current analysis outputs"
echo "   ├── morning-sync/archive/    # Historical files"
echo "   ├── diagnostics/outputs/     # Diagnostic query results"
echo "   └── testing/outputs/         # Testing results"
echo ""
echo "🎯 NEW COMMANDS:"
echo "   npm run morning-sync         # Run daily health check"
echo "   npm run diagnostics          # Run diagnostic queries"
echo "   npm run health-check         # Both morning-sync + diagnostics"
echo "   npm run morning-sync:archive # Archive current outputs"
echo "   npm run cleanup:outputs      # Clean all latest outputs"
echo ""
echo "🚀 TEST THE ORGANIZED SYSTEM:"
echo "   npm run morning-sync"
echo ""
echo "🔍 CHECK THE RESULTS:"
echo "   ls -la project-health/morning-sync/latest/"
echo ""
echo "Your project is now organized! 🎉"
