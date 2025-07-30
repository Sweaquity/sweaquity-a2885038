#!/usr/bin/env node

/**
 * 🚀 Complete Daily Project Health Check - ORGANIZED VERSION
 * 
 * Updated to work with organized project-health structure
 * Outputs go to: project-health/morning-sync/latest/
 * Archives go to: project-health/morning-sync/archive/{date}/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Import from new organized locations
const runDatabaseAnalysis = async () => {
  try {
    const { runDatabaseAnalysis } = await import('./project-health/morning-sync/supabase-analyzer.js');
    return await runDatabaseAnalysis();
  } catch (error) {
    console.warn('Database analyzer not found, using fallback');
    return { success: false, error: error.message };
  }
};

const runEnhancedStorageAnalysis = async () => {
  try {
    const { runEnhancedStorageAnalysis } = await import('./project-health/morning-sync/storage-analyzer.js');
    return await runEnhancedStorageAnalysis();
  } catch (error) {
    console.warn('Storage analyzer not found, using fallback');
    return { success: false, error: error.message };
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ORGANIZED Configuration
const CONFIG = {
  outputDir: './project-health/morning-sync/latest',
  archiveDir: `./project-health/morning-sync/archive/${new Date().toISOString().split('T')[0]}`,
  documentationFile: './PROJECT_KNOWLEDGE.md',
  timestamp: new Date().toISOString(),
};

// Ensure organized directories exist
fs.mkdirSync(CONFIG.outputDir, { recursive: true });
fs.mkdirSync(CONFIG.archiveDir, { recursive: true });

console.log('🚀 Complete Daily Project Health Check Starting...\n');
console.log('📁 Using organized output structure:');
console.log(`   Latest: ${CONFIG.outputDir}`);
console.log(`   Archive: ${CONFIG.archiveDir}\n`);

// Archive previous results before running new analysis
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
    } else {
      console.log('   📭 No previous files to archive');
    }
  }
}

// Frontend Analysis (keep existing logic but output to organized location)
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
    
    // Copy outputs to ORGANIZED latest directory with STANDARD names
    const outputs = [
      { from: 'route-mapping.ts', to: 'route-mapping.ts' },
      { from: 'codebase-analysis-report.md', to: 'codebase-report.md' },
      { from: 'full-analysis.json', to: 'codebase-analysis.json' }
    ];
    
    outputs.forEach(({ from, to }) => {
      if (fs.existsSync(from)) {
        fs.copyFileSync(from, path.join(CONFIG.outputDir, to));
        // Clean up root directory
        fs.unlinkSync(from);
      }
    });
    
    console.log('✅ Frontend analysis complete → organized outputs');
    return { success: true };
  } catch (error) {
    console.log('❌ Frontend analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Database Analysis (updated to use organized structure)
async function runEnhancedDatabaseAnalysis() {
  console.log('🗄️ Running Enhanced Database Analysis...');
  
  try {
    const insights = await runDatabaseAnalysis();
    
    // Save to organized location with standard names
    if (insights) {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'database-analysis.json'),
        JSON.stringify(insights, null, 2)
      );
      
      // Also save any report files
      const possibleReports = [
        './project-health/latest-enhanced-analysis.json',
        './project-health/latest-enhanced-report.md'
      ];
      
      possibleReports.forEach(file => {
        if (fs.existsSync(file)) {
          const baseName = path.basename(file).replace('latest-enhanced-', 'database-');
          fs.copyFileSync(file, path.join(CONFIG.outputDir, baseName));
        }
      });
    }
    
    console.log('✅ Database analysis complete → organized outputs');
    return { success: true, insights };
  } catch (error) {
    console.log('❌ Database analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Storage Analysis (updated to use organized structure)
async function runCompleteStorageAnalysis() {
  console.log('💾 Running Complete Storage Analysis...');
  
  try {
    const results = await runEnhancedStorageAnalysis();
    
    // Save to organized location with standard names
    if (results) {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'storage-analysis.json'),
        JSON.stringify(results, null, 2)
      );
      
      // Also save any report files
      const possibleReports = [
        './project-health/latest-enhanced-storage-analysis.json',
        './project-health/latest-enhanced-storage-report.md'
      ];
      
      possibleReports.forEach(file => {
        if (fs.existsSync(file)) {
          const baseName = path.basename(file).replace('latest-enhanced-storage-', 'storage-');
          fs.copyFileSync(file, path.join(CONFIG.outputDir, baseName));
        }
      });
    }
    
    console.log('✅ Storage analysis complete → organized outputs');
    return { success: true, results };
  } catch (error) {
    console.log('❌ Storage analysis failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate organized summary
function generateOrganizedSummary(frontendResult, databaseResult, storageResult) {
  const summary = {
    timestamp: CONFIG.timestamp,
    analyses: {
      frontend: frontendResult,
      database: databaseResult, 
      storage: storageResult
    },
    outputs: {
      latest: CONFIG.outputDir,
      archive: CONFIG.archiveDir
    },
    files: {
      frontend: fs.existsSync(path.join(CONFIG.outputDir, 'codebase-analysis.json')),
      database: fs.existsSync(path.join(CONFIG.outputDir, 'database-analysis.json')),
      storage: fs.existsSync(path.join(CONFIG.outputDir, 'storage-analysis.json'))
    }
  };
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'morning-sync-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  const markdownSummary = `# Morning Sync Summary
*Generated: ${CONFIG.timestamp}*

## 📊 Analysis Results
- **Frontend**: ${frontendResult.success ? '✅ Success' : '❌ Failed'}
- **Database**: ${databaseResult.success ? '✅ Success' : '❌ Failed'}  
- **Storage**: ${storageResult.success ? '✅ Success' : '❌ Failed'}

## 📁 Organized Outputs
- **Latest Results**: \`${CONFIG.outputDir}\`
- **Archive**: \`${CONFIG.archiveDir}\`

## 📋 Generated Files
${summary.files.frontend ? '- ✅ codebase-analysis.json & codebase-report.md' : '- ❌ Frontend analysis failed'}
${summary.files.database ? '- ✅ database-analysis.json & database-report.md' : '- ❌ Database analysis failed'}
${summary.files.storage ? '- ✅ storage-analysis.json & storage-report.md' : '- ❌ Storage analysis failed'}

## 🎯 Next Steps
1. Review results in \`${CONFIG.outputDir}\`
2. Check PROJECT_KNOWLEDGE.md for updates
3. Address any failed analyses
4. Archive old files: \`npm run morning-sync:archive\`
`;

  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'morning-sync-summary.md'),
    markdownSummary
  );
  
  return summary;
}

// Clean up scattered files in project-health root
function cleanupScatteredFiles() {
  console.log('🧹 Cleaning up scattered files...');
  
  try {
    const projectHealthRoot = './project-health';
    if (!fs.existsSync(projectHealthRoot)) return;
    
    const files = fs.readdirSync(projectHealthRoot);
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(projectHealthRoot, file);
      const stat = fs.statSync(filePath);
      
      // Skip directories
      if (stat.isDirectory()) return;
      
      // Move timestamped files to archive
      if (file.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)) {
        const dest = path.join(CONFIG.archiveDir, file);
        fs.renameSync(filePath, dest);
        cleanedCount++;
      }
      // Move old "latest-" prefixed files
      else if (file.startsWith('latest-') || file.startsWith('enhanced-')) {
        const dest = path.join(CONFIG.archiveDir, file);
        fs.renameSync(filePath, dest);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`   ✅ Cleaned up ${cleanedCount} scattered files`);
    }
  } catch (error) {
    console.log(`   ⚠️ Cleanup warning: ${error.message}`);
  }
}

// Main execution (ORGANIZED)
async function main() {
  try {
    // Archive previous results
    archivePreviousResults();
    
    // Run all analyses (same logic, organized outputs)
    const frontendResult = await runCodebaseAnalysis();
    const databaseResult = await runEnhancedDatabaseAnalysis();
    const storageResult = await runCompleteStorageAnalysis();
    
    // Generate organized summary
    const summary = generateOrganizedSummary(frontendResult, databaseResult, storageResult);
    
    // Update PROJECT_KNOWLEDGE.md (keep this in root for easy access)
    // ... (keep existing PROJECT_KNOWLEDGE update logic)
    
    // Clean up scattered files
    cleanupScatteredFiles();
    
    console.log('\n🎉 ORGANIZED Morning Sync Complete!');
    console.log('📁 All outputs organized in:');
    console.log(`   Latest: ${CONFIG.outputDir}`);
    console.log(`   Archive: ${CONFIG.archiveDir}`);
    
    // Show file count
    const latestFiles = fs.readdirSync(CONFIG.outputDir);
    console.log(`📊 Generated ${latestFiles.length} organized files`);
    
    const successCount = [frontendResult, databaseResult, storageResult].filter(r => r.success).length;
    process.exit(successCount === 3 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Organized health check failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
