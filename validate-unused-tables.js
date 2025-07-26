import fs from 'fs';
import path from 'path';

console.log('🔍 VALIDATING POTENTIALLY UNUSED TABLES');
console.log('='.repeat(50));

// The 13 potentially unused tables from our analysis
const potentiallyUnused = [
  'active_tickets', 'business_members', 'deleted_tickets', 'document_approvals',
  'document_revisions', 'gdpr_deleted_data', 'jobs', 'legal_jurisdictions',
  'marketing_contacts', 'project_notifications', 'project_tasks', 
  'ticket_documents', 'ticket_time_entries'
];

// More comprehensive search patterns
const searchPatterns = [
  // Direct database queries
  'from\\([\'"]{table}[\'"]\\)',
  'from\\(`{table}`\\)',
  'INSERT INTO {table}',
  'UPDATE {table}',
  'DELETE FROM {table}',
  'DROP TABLE {table}',
  'ALTER TABLE {table}',
  'CREATE TABLE {table}',
  
  // API routes and endpoints
  '/{table}',
  'api/{table}',
  'route.*{table}',
  'endpoint.*{table}',
  
  // Configuration and mapping
  '{table}.*:',
  '[\'"]{table}[\'"].*:',
  'table.*[\'"]{table}[\'"]',
  
  // Views and functions
  'CREATE VIEW.*{table}',
  'FUNCTION.*{table}',
  'TRIGGER.*{table}',
  
  // Type definitions and interfaces
  'interface.*{table}',
  'type.*{table}',
  '{table}Type',
  '{table}Interface',
  
  // Enum and constants
  'enum.*{table}',
  'const.*{table}',
  
  // Comments and documentation
  '//.*{table}',
  '/\\*.*{table}.*\\*/',
  '<!--.*{table}.*-->',
  
  // URL patterns
  'href.*{table}',
  'url.*{table}',
  'path.*{table}',
  
  // Variable names
  '{table}Data',
  '{table}List',
  '{table}Array',
  '{table}Object',
  'get{table}',
  'set{table}',
  'create{table}',
  'update{table}',
  'delete{table}',
];

// File types to search more comprehensively  
const fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.sql', '.json', '.md', '.yml', '.yaml', '.env'];

// Additional directories to check that might be missed
const criticalDirectories = [
  'src/api',
  'src/routes', 
  'src/pages/api',
  'pages/api',
  'api/',
  'routes/',
  'config/',
  'docs/',
  'supabase/functions',
  'supabase/migrations',
  '.env',
  'package.json',
  'README.md'
];

function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (['node_modules', '.git', '.next', 'dist', 'build', 'out'].includes(file)) {
          continue;
        }
        getAllFiles(filePath, fileList);
      } else {
        const ext = path.extname(file);
        if (fileExtensions.includes(ext) || file === '.env' || file === 'Dockerfile') {
          fileList.push(filePath);
        }
      }
    }
  } catch (err) {
    console.log(`Cannot read directory ${dir}: ${err.message}`);
  }
  
  return fileList;
}

function deepSearchTable(tableName, files) {
  const results = {
    directReferences: [],
    apiRoutes: [],
    typeDefinitions: [],
    configurations: [],
    comments: [],
    other: []
  };
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Search with regex patterns
      searchPatterns.forEach(pattern => {
        const regexPattern = pattern.replace(/{table}/g, tableName);
        const regex = new RegExp(regexPattern, 'gi');
        
        lines.forEach((line, lineIndex) => {
          if (regex.test(line)) {
            const reference = {
              file: filePath.replace(process.cwd(), '.'),
              line: lineIndex + 1,
              content: line.trim(),
              pattern: pattern
            };
            
            // Categorize the reference
            if (pattern.includes('from\\(') || pattern.includes('INSERT') || pattern.includes('UPDATE') || pattern.includes('DELETE')) {
              results.directReferences.push(reference);
            } else if (pattern.includes('/') || pattern.includes('api') || pattern.includes('route')) {
              results.apiRoutes.push(reference);
            } else if (pattern.includes('interface') || pattern.includes('type') || pattern.includes('Type')) {
              results.typeDefinitions.push(reference);
            } else if (pattern.includes(':') || pattern.includes('const') || pattern.includes('enum')) {
              results.configurations.push(reference);
            } else if (pattern.includes('//') || pattern.includes('/*') || pattern.includes('<!--')) {
              results.comments.push(reference);
            } else {
              results.other.push(reference);
            }
          }
        });
      });
      
      // Also search for simple string matches (case-insensitive)
      lines.forEach((line, lineIndex) => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes(tableName.toLowerCase()) && 
            !results.directReferences.some(r => r.file === filePath.replace(process.cwd(), '.') && r.line === lineIndex + 1)) {
          
          results.other.push({
            file: filePath.replace(process.cwd(), '.'),
            line: lineIndex + 1,
            content: line.trim(),
            pattern: 'string_match'
          });
        }
      });
      
    } catch (err) {
      // Skip files we can't read
    }
  });
  
  return results;
}

console.log('📂 Scanning all files comprehensively...');
const allFiles = getAllFiles('./');
console.log(`📄 Found ${allFiles.length} files to analyze`);

const detailedResults = {};

potentiallyUnused.forEach((tableName, index) => {
  console.log(`\n🔎 [${index + 1}/${potentiallyUnused.length}] Deep analysis: ${tableName}`);
  
  const results = deepSearchTable(tableName, allFiles);
  detailedResults[tableName] = results;
  
  const totalRefs = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalRefs === 0) {
    console.log(`   ✅ Confirmed: NO references found`);
  } else {
    console.log(`   ⚠️  Found ${totalRefs} potential references:`);
    if (results.directReferences.length > 0) {
      console.log(`      🔴 ${results.directReferences.length} direct database queries`);
    }
    if (results.apiRoutes.length > 0) {
      console.log(`      🟡 ${results.apiRoutes.length} API/route references`);
    }
    if (results.typeDefinitions.length > 0) {
      console.log(`      🔵 ${results.typeDefinitions.length} type definitions`);
    }
    if (results.configurations.length > 0) {
      console.log(`      🟣 ${results.configurations.length} configuration references`);
    }
    if (results.comments.length > 0) {
      console.log(`      ⚪ ${results.comments.length} in comments/docs`);
    }
    if (results.other.length > 0) {
      console.log(`      ⚫ ${results.other.length} other references`);
    }
  }
});

console.log('\n' + '='.repeat(70));
console.log('📊 FINAL VALIDATION RESULTS');
console.log('='.repeat(70));

const safeToRemove = [];
const needsInvestigation = [];
const hasActiveReferences = [];

potentiallyUnused.forEach(tableName => {
  const results = detailedResults[tableName];
  const totalRefs = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalRefs === 0) {
    safeToRemove.push(tableName);
  } else if (results.directReferences.length > 0 || results.apiRoutes.length > 0) {
    hasActiveReferences.push({ table: tableName, refs: totalRefs, critical: true });
  } else {
    needsInvestigation.push({ table: tableName, refs: totalRefs, critical: false });
  }
});

console.log(`\n🟢 SAFE TO REMOVE (${safeToRemove.length}):`);
safeToRemove.forEach(table => {
  console.log(`  ✅ ${table} - No references found anywhere`);
});

console.log(`\n🔴 DO NOT REMOVE (${hasActiveReferences.length}):`);
hasActiveReferences.forEach(({ table, refs }) => {
  console.log(`  ❌ ${table} - ${refs} references including active database queries or API routes`);
});

console.log(`\n🟡 NEEDS MANUAL INVESTIGATION (${needsInvestigation.length}):`);
needsInvestigation.forEach(({ table, refs }) => {
  console.log(`  ⚠️  ${table} - ${refs} references (types/comments only)`);
});

// Generate detailed report for investigation
console.log(`\n📝 DETAILED BREAKDOWN:`);
potentiallyUnused.forEach(tableName => {
  const results = detailedResults[tableName];
  const totalRefs = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalRefs > 0) {
    console.log(`\n🔍 ${tableName.toUpperCase()}:`);
    
    if (results.directReferences.length > 0) {
      console.log(`  🔴 Direct Database References (${results.directReferences.length}):`);
      results.directReferences.slice(0, 3).forEach(ref => {
        console.log(`    └─ ${ref.file}:${ref.line} - ${ref.content.substring(0, 60)}...`);
      });
      if (results.directReferences.length > 3) {
        console.log(`    └─ ... and ${results.directReferences.length - 3} more`);
      }
    }
    
    if (results.apiRoutes.length > 0) {
      console.log(`  🟡 API/Route References (${results.apiRoutes.length}):`);
      results.apiRoutes.slice(0, 2).forEach(ref => {
        console.log(`    └─ ${ref.file}:${ref.line} - ${ref.content.substring(0, 60)}...`);
      });
    }
    
    if (results.typeDefinitions.length > 0) {
      console.log(`  🔵 Type Definitions (${results.typeDefinitions.length}):`);
      results.typeDefinitions.slice(0, 2).forEach(ref => {
        console.log(`    └─ ${ref.file}:${ref.line}`);
      });
    }
  }
});

// Export detailed results
const validationReport = {
  summary: {
    totalAnalyzed: potentiallyUnused.length,
    safeToRemove: safeToRemove.length,
    needsInvestigation: needsInvestigation.length,
    hasActiveReferences: hasActiveReferences.length
  },
  safeToRemove,
  needsInvestigation: needsInvestigation.map(item => item.table),
  hasActiveReferences: hasActiveReferences.map(item => item.table),
  detailedFindings: detailedResults
};

fs.writeFileSync('unused-tables-validation.json', JSON.stringify(validationReport, null, 2));
console.log(`\n💾 Detailed validation report saved to: unused-tables-validation.json`);

console.log('\n✨ Validation complete!');
