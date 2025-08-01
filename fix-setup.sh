#!/bin/bash

# Fix Setup Script for Morning Sync Issues
echo "🔧 Fixing Morning Sync Issues..."

# Step 1: Check current environment
echo "📋 Checking current setup..."
echo "Current directory: $(pwd)"
echo "Files present:"
ls -la enhanced-morning-sync.js unified-diagnostics.js 2>/dev/null || echo "Files need to be created"

# Step 2: Check environment variables
echo ""
echo "🔐 Environment Variables Check:"
if [ -f .env ]; then
    echo "✅ .env file exists"
    if grep -q "SUPABASE_URL" .env; then
        echo "✅ SUPABASE_URL found"
    else
        echo "❌ SUPABASE_URL missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY found"
    elif grep -q "SUPABASE_ANON_KEY" .env; then
        echo "⚠️ Only SUPABASE_ANON_KEY found (will use as fallback)"
    else
        echo "❌ No Supabase keys found"
    fi
else
    echo "❌ .env file missing"
fi

# Step 3: Check existing diagnostics
echo ""
echo "🔍 Checking existing diagnostics..."
if [ -f "project-health/diagnostics/queries/unified-diagnostics.js" ]; then
    echo "✅ Existing unified diagnostics found"
    echo "Testing existing diagnostics..."
    timeout 30s node project-health/diagnostics/queries/unified-diagnostics.js >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Existing diagnostics work"
        EXISTING_DIAGNOSTICS_WORK=true
    else
        echo "⚠️ Existing diagnostics have issues"
        EXISTING_DIAGNOSTICS_WORK=false
    fi
else
    echo "❌ No existing unified diagnostics found"
    EXISTING_DIAGNOSTICS_WORK=false
fi

# Step 4: Test database connection
echo ""
echo "🗄️ Testing database connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || 'https://wjpunccqxowctouvhwis.supabase.co';
let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!key) {
  console.log('❌ No Supabase key available');
  process.exit(1);
}

const supabase = createClient(url, key);

supabase.from('profiles').select('id').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection works');
      console.log('Records found:', data?.length || 0);
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('❌ Database test failed:', err.message);
    process.exit(1);
  });
" 2>/dev/null
DB_CONNECTION_STATUS=$?

# Step 5: Create directories
echo ""
echo "📁 Creating required directories..."
mkdir -p project-health/morning-sync/latest
mkdir -p project-health/morning-sync/archive
mkdir -p project-health/upload-to-claude
mkdir -p project-health/diagnostics/outputs
mkdir -p project-health/diagnostics/queries
echo "✅ Directories created"

# Step 6: Recommendations
echo ""
echo "📋 RECOMMENDATIONS:"
echo ""

if [ $DB_CONNECTION_STATUS -eq 0 ]; then
    echo "✅ Database connection works - proceed with fixes"
else
    echo "❌ Database connection failed - fix environment first:"
    echo "   1. Check .env file has correct SUPABASE_URL and keys"
    echo "   2. Verify Supabase project is accessible"
    echo "   3. Test: node -e \"console.log(process.env.SUPABASE_URL)\""
fi

if [ "$EXISTING_DIAGNOSTICS_WORK" = true ]; then
    echo "✅ Use existing diagnostics in morning-sync integration"
else
    echo "⚠️ Existing diagnostics need fixing or don't exist"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Fix environment variables if database connection failed"
echo "2. Update enhanced-morning-sync.js with fixed version"
echo "3. Update unified-diagnostics.js with fixed version"
echo "4. Test: npm run morning-sync"
echo ""

# Step 7: Quick file check
echo "📄 Current file status:"
[ -f enhanced-morning-sync.js ] && echo "✅ enhanced-morning-sync.js exists" || echo "❌ enhanced-morning-sync.js missing"
[ -f unified-diagnostics.js ] && echo "✅ unified-diagnostics.js exists" || echo "❌ unified-diagnostics.js missing"
[ -f run-diagnostics.js ] && echo "✅ run-diagnostics.js exists" || echo "❌ run-diagnostics.js missing"

echo ""
echo "🔧 Fix setup complete. Address the recommendations above."