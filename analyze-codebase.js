// 🔍 QUICK CODEBASE ANALYSIS SCRIPT
// Run this to understand your current structure before implementing the workflow

const fs = import('fs');
const path = import('path');

// Configuration
const SRC_DIR = './src';
const SEARCH_PATTERNS = {
  jobseeker: /seeker|job.*application|application.*job/i,
  workflow: /workflow|process|step|stage/i,
  components: /component|tsx|jsx/i,
  hooks: /hook|use[A-Z]/i,
  types: /type|interface|\.d\.ts/i
};

// Analysis functions
function analyzeCodebase() {
  console.log('🔍 CODEBASE ANALYSIS FOR WORKFLOW IMPLEMENTATION\n');
  
  // Check if src directory exists
  if (!fs.existsSync(SRC_DIR)) {
    console.log('❌ src directory not found. Adjust SRC_DIR in this script.');
    return;
  }

  // Find all relevant files
  const allFiles = getAllFiles(SRC_DIR);
  const relevantFiles = findRelevantFiles(allFiles);
  
  console.log('📊 OVERVIEW');
  console.log(`Total files in src: ${allFiles.length}`);
  console.log(`Potentially relevant files: ${relevantFiles.length}\n`);
  
  // Analyze by category
  console.log('📁 FILE CATEGORIES');
  Object.entries(SEARCH_PATTERNS).forEach(([category, pattern]) => {
    const files = allFiles.filter(file => pattern.test(file));
    console.log(`${category}: ${files.length} files`);
    if (files.length > 0 && files.length < 10) {
      files.forEach(file => console.log(`  - ${file}`));
    }
  });
  
  console.log('\n🎯 JOBSEEKER-RELATED FILES');
  const jobseekerFiles = findJobseekerFiles(allFiles);
  if (jobseekerFiles.length === 0) {
    console.log('❌ No jobseeker-related files found!');
    console.log('💡 You may need to create the workflow from scratch.');
  } else {
    jobseekerFiles.forEach(file => console.log(`  - ${file}`));
  }
  
  console.log('\n🔧 INTEGRATION RECOMMENDATIONS');
  const recommendations = generateRecommendations(allFiles, jobseekerFiles);
  recommendations.forEach(rec => console.log(`${rec.icon} ${rec.text}`));
  
  console.log('\n📋 NEXT STEPS');
  console.log('1. Review the files listed above');
  console.log('2. Choose integration approach based on recommendations');
  console.log('3. Start with the self-contained WorkflowManager component');
  console.log('4. Gradually integrate based on your existing patterns\n');
  
  // Generate integration code snippets
  generateIntegrationSnippets(jobseekerFiles);
}

function getAllFiles(dir, files = []) {
  const dirFiles = fs.readdirSync(dir);
  
  for (const file of dirFiles) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      getAllFiles(filePath, files);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      files.push(filePath.replace('./src/', ''));
    }
  }
  
  return files;
}

function findRelevantFiles(files) {
  const keywords = ['seeker', 'job', 'application', 'dashboard', 'profile', 'contract', 'workflow'];
  return files.filter(file => 
    keywords.some(keyword => file.toLowerCase().includes(keyword))
  );
}

function findJobseekerFiles(files) {
  return files.filter(file => 
    /seeker|job.*application|application.*job|jobseeker/i.test(file)
  );
}

function generateRecommendations(allFiles, jobseekerFiles) {
  const recommendations = [];
  
  // Check for existing patterns
  const hasComponents = allFiles.some(f => f.includes('components/'));
  const hasPages = allFiles.some(f => f.includes('pages/'));
  const hasHooks = allFiles.some(f => f.includes('hooks/') || /use[A-Z]/.test(f));
  const hasTypes = allFiles.some(f => f.includes('types/') || f.includes('.d.ts'));
  
  if (jobseekerFiles.length === 0) {
    recommendations.push({
      icon: '🚀',
      text: 'START FRESH: Create new jobseeker workflow in a clean file structure'
    });
    recommendations.push({
      icon: '📁',
      text: 'LOCATION: Consider src/components/workflow/ or src/features/jobseeker/'
    });
  } else {
    recommendations.push({
      icon: '🔧',
      text: `EXTEND EXISTING: Build on ${jobseekerFiles.length} existing jobseeker files`
    });
  }
  
  if (hasComponents) {
    recommendations.push({
      icon: '✅',
      text: 'GOOD: You have a components folder - use consistent patterns'
    });
  } else {
    recommendations.push({
      icon: '⚠️',
      text: 'CONSIDER: Creating a components folder for better organization'
    });
  }
  
  if (hasHooks) {
    recommendations.push({
      icon: '🎯',
      text: 'LEVERAGE: Use your existing hook patterns for workflow state'
    });
  }
  
  if (!hasTypes) {
    recommendations.push({
      icon: '💡',
      text: 'IMPROVE: Consider adding TypeScript types for better maintainability'
    });
  }
  
  // Complexity assessment
  if (allFiles.length > 200) {
    recommendations.push({
      icon: '🔴',
      text: 'HIGH COMPLEXITY: Use self-contained approach to avoid dependency hell'
    });
  } else if (allFiles.length > 50) {
    recommendations.push({
      icon: '🟡',
      text: 'MEDIUM COMPLEXITY: Gradual integration should work well'
    });
  } else {
    recommendations.push({
      icon: '🟢',
      text: 'LOW COMPLEXITY: Standard component patterns should work fine'
    });
  }
  
  return recommendations;
}

function generateIntegrationSnippets(jobseekerFiles) {
  console.log('🎬 INTEGRATION CODE SNIPPETS\n');
  
  if (jobseekerFiles.length > 0) {
    console.log('// Option 1: Extend existing file');
    console.log(`// In ${jobseekerFiles[0] || 'your-jobseeker-component.tsx'}:`);
    console.log(`import { WorkflowManager } from './WorkflowManager';`);
    console.log('');
    console.log('// Add to your JSX:');
    console.log('{application.status && [\'negotiation\', \'pending\', \'accepted\'].includes(application.status) && (');
    console.log('  <WorkflowManager applicationId={application.job_app_id} />');
    console.log(')}');
    console.log('');
  }
  
  console.log('// Option 2: New standalone page');
  console.log('// Create src/pages/ApplicationWorkflow.tsx:');
  console.log('export const ApplicationWorkflow = ({ applicationId }) => {');
  console.log('  return <WorkflowManager applicationId={applicationId} />;');
  console.log('};');
  console.log('');
  
  console.log('// Option 3: Dashboard integration');
  console.log('// In your main dashboard component:');
  console.log('const dashboardTabs = [');
  console.log('  { name: "Applications", component: ApplicationsList },');
  console.log('  { name: "Workflow", component: () => <WorkflowManager applicationId={selectedApp?.id} /> }');
  console.log('];');
  console.log('');
}

// Analyze current project structure
function checkProjectStructure() {
  console.log('📁 PROJECT STRUCTURE ANALYSIS\n');
  
  const importantDirs = [
    'src/components',
    'src/pages', 
    'src/hooks',
    'src/types',
    'src/lib',
    'src/utils',
    'src/features'
  ];
  
  importantDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).length;
      console.log(`✅ ${dir} (${files} items)`);
    } else {
      console.log(`❌ ${dir} (missing)`);
    }
  });
  
  console.log('\n');
}

// Check for potential conflicts
function checkForConflicts() {
  console.log('⚠️  POTENTIAL CONFLICTS\n');
  
  const conflictFiles = [
    'src/components/Workflow.tsx',
    'src/components/WorkflowManager.tsx',
    'src/pages/Workflow.tsx'
  ];
  
  conflictFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`⚠️  ${file} already exists - choose different name`);
    }
  });
  
  console.log('');
}

// Main execution
function main() {
  console.clear();
  checkProjectStructure();
  checkForConflicts();
  analyzeCodebase();
  
  console.log('🎯 WORKFLOW IMPLEMENTATION READINESS');
  console.log('Based on this analysis, you can now:');
  console.log('1. Choose the right integration approach');
  console.log('2. Avoid naming conflicts');
  console.log('3. Follow your existing patterns');
  console.log('4. Start with minimal dependencies\n');
  
  console.log('💡 TIP: Save this analysis and refer back to it during implementation.');
}

// Export for use
if (import.main === module) {
  main();
}

module.exports = {
  analyzeCodebase,
  getAllFiles,
  findJobseekerFiles,
  generateRecommendations
};