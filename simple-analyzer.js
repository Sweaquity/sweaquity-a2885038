import fs from 'fs';
import path from 'path';

console.log('🔍 Starting simple table analysis...');
console.log('📁 Current directory:', process.cwd());

// Your table names
const tables = [
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

const results = {};

// Function to get files recursively
function getFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip these directories
        if (['node_modules', '.git', '.next', 'dist', 'build', 'out'].includes(file)) {
          continue;
        }
        getFiles(filePath, fileList);
      } else {
        // Only check code files
        if (file.match(/\.(js|ts|jsx|tsx|vue|py|sql)$/)) {
          fileList.push(filePath);
        }
      }
    }
  } catch (err) {
    console.log(`Cannot read directory ${dir}: ${err.message}`);
  }
  
  return fileList;
}

console.log('📂 Scanning for code files...');
const files = getFiles('./');
console.log(`📄 Found ${files.length} code files`);

if (files.length === 0) {
  console.log('❌ No code files found. Make sure you\'re in the right directory.');
  process.exit(1);
}

// Initialize results
tables.forEach(table => {
  results[table] = [];
});

console.log('🔎 Searching for table references...');

// Search each file
let totalReferences = 0;
files.forEach((filePath, index) => {
  if (index % 20 === 0) {
    console.log(`   Processing file ${index + 1}/${files.length}...`);
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    tables.forEach(table => {
      // Simple search patterns
      const patterns = [
        `from('${table}')`,
        `from("${table}")`,
        `'${table}'`,
        `"${table}"`,
        table
      ];
      
      patterns.forEach(pattern => {
        if (content.includes(pattern)) {
          results[table].push({
            file: filePath.replace(process.cwd(), '.'),
            pattern: pattern
          });
          totalReferences++;
        }
      });
    });
  } catch (err) {
    // Skip files we can't read
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 TABLE USAGE ANALYSIS RESULTS');
console.log('='.repeat(60));

const usedTables = [];
const unusedTables = [];

tables.forEach(table => {
  if (results[table].length > 0) {
    usedTables.push(table);
  } else {
    unusedTables.push(table);
  }
});

console.log(`\n✅ USED TABLES (${usedTables.length}/${tables.length}):`);
usedTables.forEach(table => {
  const refs = results[table];
  console.log(`  📋 ${table}: ${refs.length} references`);
  
  // Show first few files
  const uniqueFiles = [...new Set(refs.map(r => r.file))];
  uniqueFiles.slice(0, 3).forEach(file => {
    console.log(`    └─ ${file}`);
  });
  
  if (uniqueFiles.length > 3) {
    console.log(`    └─ ... and ${uniqueFiles.length - 3} more files`);
  }
});

console.log(`\n❌ UNUSED TABLES (${unusedTables.length}):`);
if (unusedTables.length > 0) {
  unusedTables.forEach(table => {
    console.log(`  🗑️  ${table}`);
  });
  
  console.log(`\n⚠️  RECOMMENDATION:`);
  console.log(`   These ${unusedTables.length} tables might be safe to remove:`);
  unusedTables.forEach(table => {
    console.log(`   • ${table}`);
  });
} else {
  console.log('  🎉 All tables are being used!');
}

console.log(`\n📈 SUMMARY:`);
console.log(`  • Total tables: ${tables.length}`);
console.log(`  • Used tables: ${usedTables.length}`);
console.log(`  • Unused tables: ${unusedTables.length}`);
console.log(`  • Total references found: ${totalReferences}`);
console.log(`  • Usage percentage: ${((usedTables.length / tables.length) * 100).toFixed(1)}%`);

// Export results
const exportData = {
  summary: {
    totalTables: tables.length,
    usedTables: usedTables.length,
    unusedTables: unusedTables.length,
    totalReferences: totalReferences
  },
  usedTables: usedTables,
  unusedTables: unusedTables,
  detailedResults: results
};

fs.writeFileSync('table-analysis.json', JSON.stringify(exportData, null, 2));
console.log(`\n💾 Detailed results saved to: table-analysis.json`);

console.log('\n✨ Analysis complete!');
