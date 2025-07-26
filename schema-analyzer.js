import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract table names from your schema
const tableNames = [
  'accepted_jobs', 'active_tickets', 'admin_users', 'business_invitations',
  'business_members', 'business_projects', 'business_roles', 'businesses',
  'cv_parsed_data', 'deleted_tickets', 'document_approvals', 'document_revisions',
  'document_signatures', 'document_templates', 'documents', 'gdpr_deleted_data',
  'job_applications', 'jobs', 'jobseeker_active_projects', 'legal_documents',
  'legal_jurisdictions', 'marketing_contacts', 'profiles', 'project_notifications',
  'project_sub_tasks', 'project_tasks', 'recruiter_organizations', 'recruiters',
  'ticket_comments', 'ticket_documents', 'ticket_time_entries', 'tickets',
  'time_entries', 'user_messages'
];

// File extensions to search
const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.sql'];

// Results storage
const results = {
  tablesFound: {},
  tablesNotFound: [],
  fileAnalysis: {},
  relationshipPatterns: {}
};

// Function to recursively get all files
function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          // Skip node_modules, .git, dist, build directories
          if (!['node_modules', '.git', 'dist', 'build', '.next', 'out'].includes(file)) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
          }
        } else {
          const ext = path.extname(file);
          if (codeExtensions.includes(ext)) {
            arrayOfFiles.push(fullPath);
          }
        }
      } catch (err) {
        // Skip files we can't access
        console.log(`Skipping ${fullPath}: ${err.message}`);
      }
    });
  } catch (err) {
    console.log(`Cannot read directory ${dirPath}: ${err.message}`);
  }

  return arrayOfFiles;
}

// Function to search for table usage in a file
function searchFileForTables(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileResults = {
      tables: [],
      queries: [],
      relationships: []
    };

    // Search for each table
    tableNames.forEach(tableName => {
      const patterns = [
        // Supabase patterns
        `from('${tableName}')`,
        `from("${tableName}")`,
        `from(\`${tableName}\`)`,
        
        // SQL patterns
        `FROM ${tableName}`,
        `from ${tableName}`,
        `JOIN ${tableName}`,
        `join ${tableName}`,
        `UPDATE ${tableName}`,
        `update ${tableName}`,
        `INSERT INTO ${tableName}`,
        `insert into ${tableName}`,
        `DELETE FROM ${tableName}`,
        `delete from ${tableName}`,
        
        // Table name as string
        `'${tableName}'`,
        `"${tableName}"`,
        `\`${tableName}\``,
        
        // Variable/constant names
        tableName.toUpperCase(),
        tableName.toLowerCase()
      ];

      patterns.forEach(pattern => {
        if (content.includes(pattern)) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes(pattern)) {
              fileResults.tables.push({
                table: tableName,
                line: index + 1,
                content: line.trim(),
                pattern: pattern
              });
            }
          });
        }
      });
    });

    // Look for relationship patterns (JOIN, foreign key usage)
    const relationshipPatterns = [
      /JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi,
      /join\(['"](\w+)['"]\)/gi,
      /\.select\(['"][^'"]*(\w+_id)[^'"]*['"]\)/gi,
      /\.eq\(['"](\w+_id)['"],/gi,
      /\.filter\(['"](\w+_id)['"],/gi
    ];

    relationshipPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        fileResults.relationships.push({
          match: match[0],
          groups: match.slice(1)
        });
      }
    });

    return fileResults;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Main analysis function
function analyzeCodebase(rootDir = './') {
  console.log('🔍 Starting codebase analysis...');
  console.log(`📁 Scanning directory: ${path.resolve(rootDir)}`);

  const files = getAllFiles(rootDir);
  console.log(`📄 Found ${files.length} code files to analyze`);

  // Initialize results
  tableNames.forEach(table => {
    results.tablesFound[table] = [];
  });

  // Analyze each file
  files.forEach(filePath => {
    const fileResults = searchFileForTables(filePath);
    if (fileResults) {
      results.fileAnalysis[filePath] = fileResults;

      // Aggregate table usage
      fileResults.tables.forEach(tableUsage => {
        results.tablesFound[tableUsage.table].push({
          file: filePath,
          line: tableUsage.line,
          content: tableUsage.content,
          pattern: tableUsage.pattern
        });
      });

      // Store relationship patterns
      if (fileResults.relationships.length > 0) {
        results.relationshipPatterns[filePath] = fileResults.relationships;
      }
    }
  });

  // Find unused tables
  results.tablesNotFound = tableNames.filter(table => 
    results.tablesFound[table].length === 0
  );

  return results;
}

// Generate report
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE SCHEMA TO CODE ANALYSIS REPORT');
  console.log('='.repeat(60));

  // Used tables summary
  const usedTables = Object.keys(results.tablesFound).filter(table => 
    results.tablesFound[table].length > 0
  );

  console.log(`\n✅ USED TABLES (${usedTables.length}/${tableNames.length}):`);
  usedTables.forEach(table => {
    const usage = results.tablesFound[table];
    console.log(`  📋 ${table}: ${usage.length} references`);
    
    // Show first few references
    usage.slice(0, 3).forEach(ref => {
      const shortPath = ref.file.replace(process.cwd(), '.');
      console.log(`    └─ ${shortPath}:${ref.line} - ${ref.content.substring(0, 60)}...`);
    });
    
    if (usage.length > 3) {
      console.log(`    └─ ... and ${usage.length - 3} more references`);
    }
  });

  // Unused tables
  console.log(`\n❌ UNUSED TABLES (${results.tablesNotFound.length}):`);
  if (results.tablesNotFound.length > 0) {
    results.tablesNotFound.forEach(table => {
      console.log(`  🗑️  ${table}`);
    });
  } else {
    console.log('  🎉 All tables are being used!');
  }

  // Relationship analysis
  console.log(`\n🔗 RELATIONSHIP PATTERNS FOUND:`);
  const relationshipFiles = Object.keys(results.relationshipPatterns);
  if (relationshipFiles.length > 0) {
    relationshipFiles.forEach(file => {
      const shortPath = file.replace(process.cwd(), '.');
      console.log(`  📁 ${shortPath}:`);
      results.relationshipPatterns[file].forEach(rel => {
        console.log(`    └─ ${rel.match}`);
      });
    });
  } else {
    console.log('  ⚠️  No explicit relationship patterns found');
  }

  // Summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`  • Total tables in schema: ${tableNames.length}`);
  console.log(`  • Tables found in code: ${usedTables.length}`);
  console.log(`  • Unused tables: ${results.tablesNotFound.length}`);
  console.log(`  • Files with relationships: ${relationshipFiles.length}`);
  
  const usagePercentage = ((usedTables.length / tableNames.length) * 100).toFixed(1);
  console.log(`  • Schema usage: ${usagePercentage}%`);
}

// Export results to JSON
function exportResults(results, filename = 'schema-analysis.json') {
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results exported to: ${filename}`);
}

// Run the analysis only if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  // Change this path to your project root
  const projectRoot = './';
  
  const results = analyzeCodebase(projectRoot);
  generateReport(results);
  exportResults(results);
}

export { analyzeCodebase, generateReport, exportResults };
