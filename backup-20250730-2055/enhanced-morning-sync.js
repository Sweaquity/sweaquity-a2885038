#!/usr/bin/env node

/**
 * 🚀 Enhanced Morning Sync with Unified Diagnostics
 * 
 * Features:
 * - Includes unified-diagnostics.js integration
 * - Creates 'upload-to-claude' folder with all outputs
 * - Fixes timezone to Sydney, Australia
 * - Runs all SQL tests as .js files
 * - Updates PROJECT_KNOWLEDGE.md
 * - Maintains organized structure
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
  diagnosticsDir: './project-health/diagnostics/outputs'
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

// Archive previous results
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
      console.log(`   ✅ Archived ${archivedCount} files`);
    }
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
    const insights = await runDatabaseAnalysis();
    
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

// NEW: Unified Diagnostics Integration
async function runUnifiedDiagnostics() {
  console.log('🔬 Running Unified Diagnostics...');
  
  try {
    let diagnosticsCommand;
    
    // Check for unified diagnostics file
    if (fs.existsSync('unified-diagnostics.js')) {
      diagnosticsCommand = 'node unified-diagnostics.js';
    } else if (fs.existsSync('project-health/diagnostics/queries/unified-diagnostics.js')) {
      diagnosticsCommand = 'node project-health/diagnostics/queries/unified-diagnostics.js';
    } else {
      throw new Error('unified-diagnostics.js not found');
    }
    
    const output = execSync(diagnosticsCommand, { 
      encoding: 'utf8',
      timeout: 60000
    });
    
    // Parse output if it's JSON
    let diagnosticsResult;
    try {
      diagnosticsResult = JSON.parse(output);
    } catch {
      diagnosticsResult = { 
        type: 'text', 
        content: output,
        timestamp: CONFIG.timestamp
      };
    }
    
    // Save to outputs
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'unified-diagnostics.json'),
      JSON.stringify(diagnosticsResult, null, 2)
    );
    
    // Also save to diagnostics directory
    fs.writeFileSync(
      path.join(CONFIG.diagnosticsDir, 'latest-unified-diagnostics.json'),
      JSON.stringify(diagnosticsResult, null, 2)
    );
    
    console.log('✅ Unified diagnostics complete');
    return { success: true, diagnosticsResult };
    
  } catch (error) {
    console.log('❌ Unified diagnostics failed:', error.message);
    return { success: false, error: error.message };
  }
}

// NEW: Run All SQL Diagnostic Tests
async function runAllSQLDiagnostics() {
  console.log('🧪 Running All SQL Diagnostic Tests...');
  
  try {
    const queriesDir = './project-health/diagnostics/queries';
    
    if (!fs.existsSync(queriesDir)) {
      fs.mkdirSync(queriesDir, { recursive: true });
    }
    
    // Run the diagnostic runner
    const diagnosticsCommand = 'node run-diagnostics.js';
    execSync(diagnosticsCommand, { stdio: 'pipe' });
    
    // Copy results to our outputs
    if (fs.existsSync(CONFIG.diagnosticsDir)) {
      const diagnosticsFiles = fs.readdirSync(CONFIG.diagnosticsDir);
      diagnosticsFiles.forEach(file => {
        if (file.endsWith('.json') || file.endsWith('.md')) {
          fs.copyFileSync(
            path.join(CONFIG.diagnosticsDir, file),
            path.join(CONFIG.outputDir, `sql-${file}`)
          );
        }
      });
    }
    
    console.log('✅ SQL diagnostics complete');
    return { success: true };
    
  } catch (error) {
    console.log('❌ SQL diagnostics failed:', error.message);
    return { success: false, error: error.message };
  }
}

// NEW: Create Upload-to-Claude Folder
function createUploadToClaudeFolder(frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult) {
  console.log('📤 Creating Upload-to-Claude folder...');
  
  try {
    // Clear upload directory
    if (fs.existsSync(CONFIG.uploadDir)) {
      fs.rmSync(CONFIG.uploadDir, { recursive: true });
    }
    fs.mkdirSync(CONFIG.uploadDir, { recursive: true });
    
    // Copy all outputs to upload folder
    const filesToCopy = [];
    
    // Add all files from latest output
    if (fs.existsSync(CONFIG.outputDir)) {
      const latestFiles = fs.readdirSync(CONFIG.outputDir);
      latestFiles.forEach(file => {
        filesToCopy.push({
          source: path.join(CONFIG.outputDir, file),
          dest: path.join(CONFIG.uploadDir, file)
        });
      });
    }
    
    // Add diagnostics outputs
    if (fs.existsSync(CONFIG.diagnosticsDir)) {
      const diagnosticsFiles = fs.readdirSync(CONFIG.diagnosticsDir);
      diagnosticsFiles.forEach(file => {
        if (file.includes('latest')) {
          filesToCopy.push({
            source: path.join(CONFIG.diagnosticsDir, file),
            dest: path.join(CONFIG.uploadDir, `diagnostics-${file}`)
          });
        }
      });
    }
    
    // Copy all files
    let copiedCount = 0;
    filesToCopy.forEach(({ source, dest }) => {
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        copiedCount++;
      }
    });
    
    // Create summary file for Claude
    const claudeSummary = createClaudeSummary(frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult);
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

// NEW: Update PROJECT_KNOWLEDGE.md
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
function createClaudeSummary(frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult) {
  return `# 🚀 COMPLETE PROJECT HEALTH SUMMARY FOR CLAUDE
*Generated: ${CONFIG.sydneyTime} (Sydney Time)*
*Timestamp: ${CONFIG.timestamp}*

## 📊 Analysis Results Summary
- **Frontend Analysis**: ${frontendResult.success ? '✅ Success' : '❌ Failed'}
- **Database Analysis**: ${databaseResult.success ? '✅ Success' : '❌ Failed'}  
- **Storage Analysis**: ${storageResult.success ? '✅ Success' : '❌ Failed'}
- **Unified Diagnostics**: ${diagnosticsResult.success ? '✅ Success' : '❌ Failed'}
- **SQL Diagnostics**: ${sqlResult.success ? '✅ Success' : '❌ Failed'}

## 📁 Files Included in This Upload

### Core Analysis Files
- \`codebase-analysis.json\` - Complete frontend analysis
- \`codebase-report.md\` - Human-readable frontend report
- \`route-mapping.ts\` - Application route mappings
- \`database-analysis.json\` - Database health and structure
- \`storage-analysis.json\` - Storage buckets and files

### Diagnostic Files
- \`unified-diagnostics.json\` - Comprehensive automation testing
- \`sql-*.json\` - Individual SQL diagnostic results
- \`diagnostics-*.json\` - Detailed diagnostic outputs

### Summary Files
- \`PROJECT_KNOWLEDGE.md\` - Complete project documentation
- \`morning-sync-summary.md\` - This sync session summary
- \`CLAUDE_PROJECT_SUMMARY.md\` - This file

## 🎯 Key Findings
${diagnosticsResult.success && diagnosticsResult.diagnosticsResult?.summary ? 
  `- Overall System Status: ${diagnosticsResult.diagnosticsResult.summary.overallStatus}
- Tests Run: ${diagnosticsResult.diagnosticsResult.summary.total}
- Issues Found: ${diagnosticsResult.diagnosticsResult.summary.critical + diagnosticsResult.diagnosticsResult.summary.warnings}` : 
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
- **Automation**: ${allResults.diagnostics.success ? '✅ Tested' : '❌ Issues'}
- **SQL Tests**: ${allResults.sql.success ? '✅ Passed' : '❌ Issues'}

## 🚨 Current Priority Actions

${generatePriorityActions(allResults)}

## 🗄️ Complete Analysis Status

### Morning Sync Results
✅ **Enhanced morning sync with unified diagnostics operational**
- All analysis systems integrated
- Sydney timezone configured
- Upload-to-Claude folder automated
- PROJECT_KNOWLEDGE.md auto-updated

### Available Diagnostic Commands
\`\`\`bash
# Complete morning sync (recommended daily)
node enhanced-morning-sync.js

# Individual diagnostics (can run anytime)
node unified-diagnostics.js

# SQL-only diagnostics
node run-diagnostics.js

# Legacy systems
npm run morning-sync
node analyze-codebase.cjs
\`\`\`

## 📁 File Organization
- **Latest Results**: \`${CONFIG.outputDir}\`
- **Archive**: \`${CONFIG.archiveDir}\`
- **Upload to Claude**: \`${CONFIG.uploadDir}\`
- **Diagnostics**: \`${CONFIG.diagnosticsDir}\`

## 🕐 Sydney Time Configuration
- **Current Time**: ${CONFIG.sydneyTime}
- **Timezone**: ${SYDNEY_TZ}
- **All timestamps now in Sydney time**

---
*This project knowledge is automatically updated by enhanced-morning-sync.js*
*For manual updates, run: \`node enhanced-morning-sync.js\`*
`;
}

function calculateHealthScore(results) {
  let score = 0;
  const weights = { frontend: 25, database: 30, storage: 20, diagnostics: 15, sql: 10 };
  
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
  if (!results.diagnostics.success) actions.push('- Fix unified diagnostics system');
  if (!results.sql.success) actions.push('- Resolve SQL diagnostic failures');
  
  return actions.length > 0 ? actions.join('\n') : '- No critical issues detected ✅';
}

// Generate organized summary
function generateEnhancedSummary(frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult, uploadResult, knowledgeResult) {
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
      diagnostics: diagnosticsResult,
      sql: sqlResult
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
- **Unified Diagnostics**: ${diagnosticsResult.success ? '✅ Success' : '❌ Failed'}
- **SQL Diagnostics**: ${sqlResult.success ? '✅ Success' : '❌ Failed'}

## 🚀 New Features
- ✅ Sydney timezone integration
- ✅ Unified diagnostics included
- ✅ Upload-to-Claude folder: \`${CONFIG.uploadDir}\`
- ✅ PROJECT_KNOWLEDGE.md auto-updated
- ✅ All SQL tests run as .js files

## 📁 Enhanced Organization
- **Latest**: \`${CONFIG.outputDir}\`
- **Archive**: \`${CONFIG.archiveDir}\`
- **Upload**: \`${CONFIG.uploadDir}\` (${uploadResult.fileCount || 0} files)
- **Diagnostics**: \`${CONFIG.diagnosticsDir}\`

## 🎯 Next Steps
1. Review all outputs in upload-to-claude folder
2. Check PROJECT_KNOWLEDGE.md for updates
3. Run \`node unified-diagnostics.js\` for standalone diagnostics
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
    
    // Archive previous results
    archivePreviousResults();
    
    // Run all analyses
    const frontendResult = await runCodebaseAnalysis();
    const databaseResult = await runEnhancedDatabaseAnalysis();
    const storageResult = await runCompleteStorageAnalysis();
    const diagnosticsResult = await runUnifiedDiagnostics();
    const sqlResult = await runAllSQLDiagnostics();
    
    // Create upload folder and update knowledge
    const uploadResult = createUploadToClaudeFolder(frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult);
    const knowledgeResult = updateProjectKnowledge({ frontend: frontendResult, database: databaseResult, storage: storageResult, diagnostics: diagnosticsResult, sql: sqlResult });
    
    // Generate enhanced summary
    const summary = generateEnhancedSummary(frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult, uploadResult, knowledgeResult);
    
    console.log('\n🎉 Enhanced Morning Sync Complete!');
    console.log(`🕐 Sydney Time: ${CONFIG.sydneyTime}`);
    console.log('📁 All outputs organized:');
    console.log(`   Latest: ${CONFIG.outputDir}`);
    console.log(`   Archive: ${CONFIG.archiveDir}`);
    console.log(`   📤 Upload to Claude: ${CONFIG.uploadDir} (${uploadResult.fileCount || 0} files)`);
    console.log(`   🔬 Diagnostics: ${CONFIG.diagnosticsDir}`);
    console.log('\n📋 To upload to Claude: Copy all files from upload-to-claude folder');
    
    const successCount = [frontendResult, databaseResult, storageResult, diagnosticsResult, sqlResult].filter(r => r.success).length;
    process.exit(successCount >= 3 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Enhanced morning sync failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}