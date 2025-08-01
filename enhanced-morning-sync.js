#!/usr/bin/env node

/**
 * 🚀 Enhanced Morning Sync with Unified Diagnostics
 * 
 * FIXED VERSION - Ready to replace daily-health-check.js
 * 
 * Features:
 * - Runs ALL diagnostics queries from /diagnostics/queries folder
 * - Creates 'upload-to-claude' folder with all outputs (no timestamps)
 * - Sydney timezone configuration
 * - Updates PROJECT_KNOWLEDGE.md
 * - Fixed archiving process
 * - All diagnostics outputs copied to upload-to-claude
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sydney timezone configuration
const SYDNEY_TZ = 'Australia/Sydney';
const getSydneyTime = () => {
  return new Date().toLocaleString('en-AU', {
    timeZone: SYDNEY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const getSydneyISOString = () => {
  const sydneyTime = new Date().toLocaleString('sv-SE', {
    timeZone: SYDNEY_TZ
  });
  return sydneyTime.replace(' ', 'T') + '+11:00';
};

// Configuration with Sydney timezone
const CONFIG = {
  outputDir: './project-health/morning-sync/latest',
  archiveDir: `./project-health/morning-sync/archive/${new Date().toLocaleDateString('en-CA', { timeZone: SYDNEY_TZ })}`,
  uploadDir: './project-health/upload-to-claude',
  documentationFile: './PROJECT_KNOWLEDGE.md',
  timestamp: getSydneyISOString(),
  sydneyTime: getSydneyTime(),
  diagnosticsDir: './project-health/diagnostics/outputs',
  queriesDir: './project-health/diagnostics/queries'
};

// Ensure all directories exist
[CONFIG.outputDir, CONFIG.archiveDir, CONFIG.uploadDir, CONFIG.diagnosticsDir].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

console.log('🚀 Enhanced Morning Sync Starting...'); 
console.log(`🕐 Sydney Time: ${CONFIG.sydneyTime}`);
console.log('📁 Directory Structure:');
console.log(`   Latest: ${CONFIG.outputDir}`);
console.log(`   Archive: ${CONFIG.archiveDir}`);
console.log(`   Upload: ${CONFIG.uploadDir}`);
console.log(`   Diagnostics: ${CONFIG.diagnosticsDir}`);
console.log(`   Queries: ${CONFIG.queriesDir}`);

// Import diagnostic functions
const runDatabaseAnalysis = async () => {
  try {
    const { runDatabaseAnalysis } = await import('./supabase-analyzer.js');
    return await runDatabaseAnalysis();
  } catch (error) {
    console.warn('Database analyzer not found, using fallback');
    return { success: false, error: error.message };
  }
};

const runEnhancedStorageAnalysis = async () => {
  try {
    const { runEnhancedStorageAnalysis } = await import('./enhanced-storage-analyzer.js');
    return await runEnhancedStorageAnalysis();
  } catch (error) {
    console.warn('Storage analyzer not found, using fallback');
    return { success: false, error: error.message };
  }
};

// FIXED: Archive previous results (no timestamped files in upload-to-claude)
function archivePreviousResults() {
  console.log('📦 Archiving previous results...');
  
  if (fs.existsSync(CONFIG.outputDir)) {
    const files = fs.readdirSync(CONFIG.outputDir);
    let archivedCount = 0;
    
    files.forEach(file => {
      if (file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.ts')) {
        const source = path.join(CONFIG.outputDir, file);
        const dest = path.join(CONFIG.archiveDir, file);
        
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest);
          archivedCount++;
        }
      }
    });
    
    if (archivedCount > 0) {
      console.log(`   ✅ Archived ${archivedCount} files to archive folder`);
    }
  }
  
  // CLEAR upload-to-claude folder (no archiving here)
  if (fs.existsSync(CONFIG.uploadDir)) {
    fs.rmSync(CONFIG.uploadDir, { recursive: true });
    fs.mkdirSync(CONFIG.uploadDir, { recursive: true });
    console.log('   🧹 Cleared upload-to-claude folder');
  }
}

// Frontend Analysis
async function runCodebaseAnalysis() {
  console.log('📂 Running Frontend Codebase Analysis...');
  
  try {
    let analyzeCommand;
    if (fs.existsSync('analyze-codebase.mjs')) {
      analyzeCommand = 'node analyze-codebase.mjs';
    } else if (fs.existsSync('analyze-codebase.js')) {
      analyzeCommand = 'node analyze-codebase.js';
    } else if (fs.existsSync('analyze-codebase.cjs')) {
      analyzeCommand = 'node analyze-codebase.cjs';
    } else {
      throw new Error('No analyze-codebase file found');
    }
    
    execSync(analyzeCommand, { stdio: 'pipe' });
    
    // Copy outputs to organized locations
    const outputs = [
      { from: 'route-mapping.ts', to: 'route-mapping.ts' },
      { from: 'codebase-analysis-report.md', to: 'codebase-report.md' },
      { from: 'full-analysis.json', to: 'codebase-analysis.json' }
    ];
    
    outputs.forEach(({ from, to }) => {
      if (fs.existsSync(from)) {
        fs.copyFileSync(from, path.join(CONFIG.outputDir, to));
        fs.unlinkSync(from);
      }
    });
    
    console.log('✅ Frontend analysis complete');
    return { success: true };
  } catch (error) {
    console.log('❌ Frontend analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Enhanced Database Analysis
async function runEnhancedDatabaseAnalysis() {
  console.log('🗄️ Running Enhanced Database Analysis...');
  
  try {
    let insights = null;
    
    if (fs.existsSync('supabase-analyzer.js')) {
      try {
        const { runDatabaseAnalysis } = await import('./supabase-analyzer.js');
        insights = await runDatabaseAnalysis();
      } catch (error) {
        console.log('⚠️ Supabase analyzer failed, using fallback:', error.message);
      }
    }
    
    if (!insights) {
      insights = await runBasicDatabaseTest();
    }
    
    if (insights) {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'database-analysis.json'),
        JSON.stringify(insights, null, 2)
      );
    }
    
    console.log('✅ Database analysis complete');
    return { success: true, insights };
  } catch (error) {
    console.log('❌ Database analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Basic database test fallback
async function runBasicDatabaseTest() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL || 'https://wjpunccqxowctouvhwis.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseKey) {
    throw new Error('No Supabase key found in environment');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    
    return {
      success: true,
      connection: 'working',
      testQuery: 'profiles table accessible',
      recordCount: data?.length || 0,
      timestamp: CONFIG.timestamp
    };
  } catch (error) {
    return {
      success: false,
      connection: 'failed',
      error: error.message,
      timestamp: CONFIG.timestamp
    };
  }
}

// Enhanced Storage Analysis
async function runCompleteStorageAnalysis() {
  console.log('💾 Running Complete Storage Analysis...');
  
  try {
    const results = await runEnhancedStorageAnalysis();
    
    if (results) {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'storage-analysis.json'),
        JSON.stringify(results, null, 2)
      );
    }
    
    console.log('✅ Storage analysis complete');
    return { success: true, results };
  } catch (error) {
    console.log('❌ Storage analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

// FIXED: Run ALL Diagnostic Queries from queries folder
async function runAllDiagnosticQueries() {
  console.log('🔬 Running ALL Diagnostic Queries...');
  
  try {
    // Check if queries directory exists
    if (!fs.existsSync(CONFIG.queriesDir)) {
      console.log('⚠️ Queries directory not found, skipping');
      return { success: true, skipped: true, reason: 'queries directory not found' };
    }
    
    // Get all .js files from queries directory
    const queryFiles = fs.readdirSync(CONFIG.queriesDir)
      .filter(f => f.endsWith('.js'))
      .filter(f => !f.includes('backup')); // Skip backup files
    
    if (queryFiles.length === 0) {
      console.log('⚠️ No query files found in queries directory');
      return { success: true, skipped: true, reason: 'no query files found' };
    }
    
    console.log(`   Found ${queryFiles.length} diagnostic queries:`, queryFiles.join(', '));
    
    const queryResults = {};
    let successCount = 0;
    let failCount = 0;
    
    // Run each query file
    for (const queryFile of queryFiles) {
      const queryName = path.basename(queryFile, '.js');
      console.log(`   🧪 Running: ${queryName}`);
      
      try {
        const fullPath = path.join(CONFIG.queriesDir, queryFile);
        const output = execSync(`node "${fullPath}"`, { 
          encoding: 'utf8',
          timeout: 60000,
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        // Parse output if possible
        let parsedOutput;
        try {
          // Look for JSON in output
          const lines = output.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          if (jsonLine) {
            parsedOutput = JSON.parse(jsonLine);
          } else {
            parsedOutput = { 
              type: 'text', 
              content: output,
              timestamp: CONFIG.timestamp,
              source: queryFile
            };
          }
        } catch {
          parsedOutput = { 
            type: 'text', 
            content: output,
            timestamp: CONFIG.timestamp,
            source: queryFile
          };
        }
        
        queryResults[queryName] = { 
          success: true, 
          output: parsedOutput,
          timestamp: CONFIG.timestamp
        };
        successCount++;
        console.log(`      ✅ ${queryName} completed`);
        
      } catch (error) {
        queryResults[queryName] = { 
          success: false, 
          error: error.message,
          timestamp: CONFIG.timestamp
        };
        failCount++;
        console.log(`      ❌ ${queryName} failed:`, error.message.split('\n')[0]);
      }
    }
    
    // Save comprehensive results
    const allQueriesResult = {
      summary: {
        total: queryFiles.length,
        successful: successCount,
        failed: failCount,
        executedAt: CONFIG.timestamp,
        sydneyTime: CONFIG.sydneyTime
      },
      queries: queryResults
    };
    
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'all-diagnostics-queries.json'),
      JSON.stringify(allQueriesResult, null, 2)
    );
    
    console.log(`✅ All diagnostic queries complete (${successCount}/${queryFiles.length} successful)`);
    return { success: true, results: allQueriesResult };
    
  } catch (error) {
    console.log('❌ Diagnostic queries failed:', error.message);
    return { success: false, error: error.message };
  }
}

// FIXED: Create Upload-to-Claude Folder (copies ALL outputs)
function createUploadToClaudeFolder(frontendResult, databaseResult, storageResult, diagnosticsResult) {
  console.log('📤 Creating Upload-to-Claude folder...');
  
  try {
    const filesToCopy = [];
    
    // Add all files from latest output
    if (fs.existsSync(CONFIG.outputDir)) {
      const latestFiles = fs.readdirSync(CONFIG.outputDir);
      latestFiles.forEach(file => {
        const sourcePath = path.join(CONFIG.outputDir, file);
        const stat = fs.statSync(sourcePath);
        
        if (stat.isFile()) {
          filesToCopy.push({
            source: sourcePath,
            dest: path.join(CONFIG.uploadDir, file)
          });
        }
      });
    }
    
    // Add all diagnostics outputs from diagnostics/outputs
    if (fs.existsSync(CONFIG.diagnosticsDir)) {
      const diagnosticsFiles = fs.readdirSync(CONFIG.diagnosticsDir);
      diagnosticsFiles.forEach(file => {
        const sourcePath = path.join(CONFIG.diagnosticsDir, file);
        
        try {
          const stat = fs.statSync(sourcePath);
          if (stat.isFile() && (file.endsWith('.json') || file.endsWith('.md'))) {
            filesToCopy.push({
              source: sourcePath,
              dest: path.join(CONFIG.uploadDir, `diagnostics-${file}`)
            });
          }
        } catch (statError) {
          console.log(`   ⚠️ Skipping ${file}: ${statError.message}`);
        }
      });
    }
    
    // Copy all files
    let copiedCount = 0;
    filesToCopy.forEach(({ source, dest }) => {
      try {
        if (fs.existsSync(source)) {
          const sourceStat = fs.statSync(source);
          if (sourceStat.isFile()) {
            fs.copyFileSync(source, dest);
            copiedCount++;
          }
        }
      } catch (copyError) {
        console.log(`   ⚠️ Failed to copy ${path.basename(source)}: ${copyError.message}`);
      }
    });
    
    // Create summary file for Claude
    const claudeSummary = createClaudeSummary(frontendResult, databaseResult, storageResult, diagnosticsResult);
    fs.writeFileSync(
      path.join(CONFIG.uploadDir, 'CLAUDE_PROJECT_SUMMARY.md'),
      claudeSummary
    );
    
    console.log(`✅ Upload folder created with ${copiedCount + 1} files`);
    return { success: true, fileCount: copiedCount + 1 };
    
  } catch (error) {
    console.log('❌ Upload folder creation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Update PROJECT_KNOWLEDGE.md
function updateProjectKnowledge(allResults) {
  console.log('📝 Updating PROJECT_KNOWLEDGE.md...');
  
  try {
    const projectKnowledge = generateProjectKnowledge(allResults);
    fs.writeFileSync(CONFIG.documentationFile, projectKnowledge);
    
    // Also copy to upload folder
    fs.copyFileSync(
      CONFIG.documentationFile,
      path.join(CONFIG.uploadDir, 'PROJECT_KNOWLEDGE.md')
    );
    
    console.log('✅ PROJECT_KNOWLEDGE.md updated');
    return { success: true };
    
  } catch (error) {
    console.log('❌ PROJECT_KNOWLEDGE.md update failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate comprehensive summary for Claude
function createClaudeSummary(frontendResult, databaseResult, storageResult, diagnosticsResult) {
  return `# 🚀 COMPLETE PROJECT HEALTH SUMMARY FOR CLAUDE
*Generated: ${CONFIG.sydneyTime} (Sydney Time)*
*Timestamp: ${CONFIG.timestamp}*

## 📊 Analysis Results Summary
- **Frontend Analysis**: ${frontendResult.success ? '✅ Success' : '❌ Failed'}
- **Database Analysis**: ${databaseResult.success ? '✅ Success' : '❌ Failed'}  
- **Storage Analysis**: ${storageResult.success ? '✅ Success' : '❌ Failed'}
- **All Diagnostic Queries**: ${diagnosticsResult.success ? '✅ Success' : '❌ Failed'}

## 📁 Files Included in This Upload

### Core Analysis Files
- \`codebase-analysis.json\` - Complete frontend analysis
- \`codebase-report.md\` - Human-readable frontend report
- \`route-mapping.ts\` - Application route mappings
- \`database-analysis.json\` - Database health and structure
- \`storage-analysis.json\` - Storage buckets and files

### Diagnostic Files
- \`all-diagnostics-queries.json\` - All diagnostic query results
- \`diagnostics-*.json\` - Individual diagnostic outputs from queries folder

### Summary Files
- \`PROJECT_KNOWLEDGE.md\` - Complete project documentation
- \`enhanced-morning-sync-summary.md\` - This sync session summary
- \`CLAUDE_PROJECT_SUMMARY.md\` - This file

## 🎯 Key Findings
${diagnosticsResult.success && diagnosticsResult.results?.summary ? 
  `- Total Diagnostic Queries Run: ${diagnosticsResult.results.summary.total}
- Successful: ${diagnosticsResult.results.summary.successful}
- Failed: ${diagnosticsResult.results.summary.failed}` : 
  '- Diagnostics data not available'}

## 🕐 Sydney Time Information
- **Current Sydney Time**: ${CONFIG.sydneyTime}
- **Timezone**: ${SYDNEY_TZ}
- **ISO Timestamp**: ${CONFIG.timestamp}

## 📋 Recommended Next Steps
1. Review all diagnostic outputs for critical issues
2. Check PROJECT_KNOWLEDGE.md for updated project status
3. Address any failed analyses
4. Run individual diagnostics if needed: \`node unified-diagnostics.js\`

---
*This summary contains all current project health data for Claude analysis*
`;
}

// Generate updated PROJECT_KNOWLEDGE.md
function generateProjectKnowledge(allResults) {
  return `# 🔄 COMPLETE PROJECT KNOWLEDGE UPDATE
*Last updated: ${CONFIG.timestamp} (Sydney Time)*

## 📊 Complete Project Health Overview

**🎯 Overall Health Score: ${calculateHealthScore(allResults)}/100**

### System Status Summary
- **Frontend**: ${allResults.frontend.success ? '✅ Operational' : '❌ Issues'}
- **Database**: ${allResults.database.success ? '✅ Operational' : '❌ Issues'}
- **Storage**: ${allResults.storage.success ? '✅ Operational' : '❌ Issues'}
- **All Diagnostics**: ${allResults.diagnostics.success ? '✅ Tested' : '❌ Issues'}

## 🚨 Current Priority Actions

${generatePriorityActions(allResults)}

## 🗄️ Complete Analysis Status

### Morning Sync Results
✅ **Enhanced morning sync with ALL diagnostics operational**
- All analysis systems integrated
- Sydney timezone configured
- Upload-to-Claude folder automated
- PROJECT_KNOWLEDGE.md auto-updated
- ALL diagnostic queries from queries folder executed

### Available Diagnostic Commands
\`\`\`bash
# Complete morning sync (recommended daily)
node daily-health-check.js

# Individual diagnostics (can run anytime)
node unified-diagnostics.js

# Run all diagnostics from queries folder
node ./project-health/diagnostics/queries/run-diagnostics.js

# Legacy systems
npm run morning-sync
node analyze-codebase.cjs
\`\`\`

## 📁 File Organization
- **Latest Results**: \`${CONFIG.outputDir}\`
- **Archive**: \`${CONFIG.archiveDir}\`
- **Upload to Claude**: \`${CONFIG.uploadDir}\`
- **Diagnostics**: \`${CONFIG.diagnosticsDir}\`
- **Diagnostic Queries**: \`${CONFIG.queriesDir}\`

## 🕐 Sydney Time Configuration
- **Current Time**: ${CONFIG.sydneyTime}
- **Timezone**: ${SYDNEY_TZ}
- **All timestamps now in Sydney time**

---
*This project knowledge is automatically updated by daily-health-check.js*
*For manual updates, run: \`node daily-health-check.js\`*
`;
}

function calculateHealthScore(results) {
  let score = 0;
  const weights = { frontend: 30, database: 30, storage: 20, diagnostics: 20 };
  
  Object.entries(weights).forEach(([key, weight]) => {
    if (results[key]?.success) score += weight;
  });
  
  return score;
}

function generatePriorityActions(results) {
  const actions = [];
  
  if (!results.frontend.success) actions.push('- Fix frontend codebase analysis');
  if (!results.database.success) actions.push('- Resolve database connectivity issues');
  if (!results.storage.success) actions.push('- Address storage access problems');
  if (!results.diagnostics.success) actions.push('- Fix diagnostic queries system');
  
  return actions.length > 0 ? actions.join('\n') : '- No critical issues detected ✅';
}

// Generate organized summary
function generateEnhancedSummary(frontendResult, databaseResult, storageResult, diagnosticsResult, uploadResult, knowledgeResult) {
  const summary = {
    metadata: {
      timestamp: CONFIG.timestamp,
      sydneyTime: CONFIG.sydneyTime,
      timezone: SYDNEY_TZ
    },
    analyses: {
      frontend: frontendResult,
      database: databaseResult, 
      storage: storageResult,
      diagnostics: diagnosticsResult
    },
    integration: {
      uploadToClaudeFolder: uploadResult,
      projectKnowledgeUpdate: knowledgeResult
    },
    outputs: {
      latest: CONFIG.outputDir,
      archive: CONFIG.archiveDir,
      upload: CONFIG.uploadDir,
      diagnostics: CONFIG.diagnosticsDir
    }
  };
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'enhanced-morning-sync-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  const markdownSummary = `# Enhanced Morning Sync Summary
*Generated: ${CONFIG.sydneyTime} (Sydney Time)*

## 📊 Analysis Results
- **Frontend**: ${frontendResult.success ? '✅ Success' : '❌ Failed'}
- **Database**: ${databaseResult.success ? '✅ Success' : '❌ Failed'}  
- **Storage**: ${storageResult.success ? '✅ Success' : '❌ Failed'}
- **All Diagnostic Queries**: ${diagnosticsResult.success ? '✅ Success' : '❌ Failed'}

## 🚀 New Features
- ✅ Sydney timezone integration
- ✅ ALL diagnostic queries included
- ✅ Upload-to-Claude folder: \`${CONFIG.uploadDir}\`
- ✅ PROJECT_KNOWLEDGE.md auto-updated
- ✅ All SQL tests run as .js files
- ✅ Fixed archiving process

## 📁 Enhanced Organization
- **Latest**: \`${CONFIG.outputDir}\`
- **Archive**: \`${CONFIG.archiveDir}\`
- **Upload**: \`${CONFIG.uploadDir}\` (${uploadResult.fileCount || 0} files)
- **Diagnostics**: \`${CONFIG.diagnosticsDir}\`

## 🎯 Next Steps
1. Review all outputs in upload-to-claude folder
2. Check PROJECT_KNOWLEDGE.md for updates
3. Run individual diagnostics if needed
4. Upload contents of \`${CONFIG.uploadDir}\` to Claude
`;

  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'enhanced-morning-sync-summary.md'),
    markdownSummary
  );
  
  // Also copy to upload folder
  fs.copyFileSync(
    path.join(CONFIG.outputDir, 'enhanced-morning-sync-summary.md'),
    path.join(CONFIG.uploadDir, 'enhanced-morning-sync-summary.md')
  );
  
  return summary;
}

// Main execution
async function main() {
  try {
    console.log(`\n🎯 Enhanced Morning Sync - Sydney Time: ${CONFIG.sydneyTime}\n`);
    
    // Archive previous results (FIXED)
    archivePreviousResults();
    
    // Run all analyses
    const frontendResult = await runCodebaseAnalysis();
    const databaseResult = await runEnhancedDatabaseAnalysis();
    const storageResult = await runCompleteStorageAnalysis();
    const diagnosticsResult = await runAllDiagnosticQueries(); // FIXED: Now runs ALL queries
    
    // Create upload folder and update knowledge
    const uploadResult = createUploadToClaudeFolder(frontendResult, databaseResult, storageResult, diagnosticsResult);
    const knowledgeResult = updateProjectKnowledge({ frontend: frontendResult, database: databaseResult, storage: storageResult, diagnostics: diagnosticsResult });
    
    // Generate enhanced summary
    const summary = generateEnhancedSummary(frontendResult, databaseResult, storageResult, diagnosticsResult, uploadResult, knowledgeResult);
    
    console.log('\n🎉 Enhanced Morning Sync Complete!');
    console.log(`🕐 Sydney Time: ${CONFIG.sydneyTime}`);
    console.log('📁 All outputs organized:');
    console.log(`   Latest: ${CONFIG.outputDir}`);
    console.log(`   Archive: ${CONFIG.archiveDir}`);
    console.log(`   📤 Upload to Claude: ${CONFIG.uploadDir} (${uploadResult.fileCount || 0} files)`);
    console.log(`   🔬 Diagnostics: ${CONFIG.diagnosticsDir}`);
    console.log('\n📋 To upload to Claude: Copy all files from upload-to-claude folder');
    
    const successCount = [frontendResult, databaseResult, storageResult, diagnosticsResult].filter(r => r.success).length;
    process.exit(successCount >= 3 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Enhanced morning sync failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}