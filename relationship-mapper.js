import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract foreign key relationships from your schema
const foreignKeyRelationships = [
  // Format: { from_table, from_column, to_table, to_column }
  { from: 'accepted_jobs', column: 'job_app_id', to: 'job_applications', toColumn: 'job_app_id' },
  { from: 'accepted_jobs', column: 'work_contract_document_id', to: 'legal_documents', toColumn: 'id' },
  { from: 'accepted_jobs', column: 'award_agreement_document_id', to: 'legal_documents', toColumn: 'id' },
  
  { from: 'admin_users', column: 'user_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'business_members', column: 'business_id', to: 'businesses', toColumn: 'businesses_id' },
  
  { from: 'business_projects', column: 'business_id', to: 'businesses', toColumn: 'businesses_id' },
  { from: 'business_projects', column: 'created_by', to: 'profiles', toColumn: 'id' },
  
  { from: 'business_roles', column: 'business_id', to: 'businesses', toColumn: 'businesses_id' },
  
  { from: 'businesses', column: 'parent_id', to: 'businesses', toColumn: 'businesses_id' },
  
  { from: 'cv_parsed_data', column: 'user_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'document_approvals', column: 'document_id', to: 'legal_documents', toColumn: 'id' },
  { from: 'document_approvals', column: 'approver_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'document_revisions', column: 'document_id', to: 'legal_documents', toColumn: 'id' },
  { from: 'document_revisions', column: 'changed_by', to: 'profiles', toColumn: 'id' },
  
  { from: 'document_signatures', column: 'document_id', to: 'legal_documents', toColumn: 'id' },
  { from: 'document_signatures', column: 'signer_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'document_templates', column: 'jurisdiction_code', to: 'legal_jurisdictions', toColumn: 'jurisdiction_code' },
  
  { from: 'documents', column: 'ticket_id', to: 'tickets', toColumn: 'id' },
  { from: 'documents', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'documents', column: 'uploaded_by', to: 'profiles', toColumn: 'id' },
  
  { from: 'job_applications', column: 'user_id', to: 'profiles', toColumn: 'id' },
  { from: 'job_applications', column: 'task_id', to: 'project_sub_tasks', toColumn: 'task_id' },
  { from: 'job_applications', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'job_applications', column: 'nda_document_id', to: 'legal_documents', toColumn: 'id' },
  
  { from: 'jobs', column: 'business_id', to: 'businesses', toColumn: 'businesses_id' },
  
  { from: 'legal_documents', column: 'business_id', to: 'businesses', toColumn: 'businesses_id' },
  { from: 'legal_documents', column: 'jobseeker_id', to: 'profiles', toColumn: 'id' },
  { from: 'legal_documents', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'legal_documents', column: 'job_application_id', to: 'job_applications', toColumn: 'job_app_id' },
  { from: 'legal_documents', column: 'accepted_job_id', to: 'accepted_jobs', toColumn: 'id' },
  
  { from: 'marketing_contacts', column: 'user_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'project_notifications', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'project_notifications', column: 'task_id', to: 'project_sub_tasks', toColumn: 'task_id' },
  
  { from: 'project_sub_tasks', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'project_sub_tasks', column: 'created_by', to: 'profiles', toColumn: 'id' },
  
  { from: 'project_tasks', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'project_tasks', column: 'assigned_to', to: 'profiles', toColumn: 'id' },
  
  { from: 'recruiters', column: 'organization_id', to: 'recruiter_organizations', toColumn: 'id' },
  
  { from: 'ticket_comments', column: 'ticket_id', to: 'tickets', toColumn: 'id' },
  { from: 'ticket_comments', column: 'user_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'ticket_documents', column: 'ticket_id', to: 'tickets', toColumn: 'id' },
  { from: 'ticket_documents', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'ticket_documents', column: 'uploaded_by', to: 'profiles', toColumn: 'id' },
  
  { from: 'ticket_time_entries', column: 'ticket_id', to: 'tickets', toColumn: 'id' },
  { from: 'ticket_time_entries', column: 'user_id', to: 'profiles', toColumn: 'id' },
  
  { from: 'tickets', column: 'assigned_to', to: 'profiles', toColumn: 'id' },
  { from: 'tickets', column: 'reporter', to: 'profiles', toColumn: 'id' },
  { from: 'tickets', column: 'project_id', to: 'business_projects', toColumn: 'project_id' },
  { from: 'tickets', column: 'task_id', to: 'project_sub_tasks', toColumn: 'task_id' },
  { from: 'tickets', column: 'job_app_id', to: 'job_applications', toColumn: 'job_app_id' },
  
  { from: 'time_entries', column: 'ticket_id', to: 'tickets', toColumn: 'id' },
  { from: 'time_entries', column: 'user_id', to: 'profiles', toColumn: 'id' },
  { from: 'time_entries', column: 'job_app_id', to: 'job_applications', toColumn: 'job_app_id' },
  
  { from: 'user_messages', column: 'sender_id', to: 'profiles', toColumn: 'id' },
  { from: 'user_messages', column: 'recipient_id', to: 'profiles', toColumn: 'id' },
  { from: 'user_messages', column: 'related_ticket', to: 'tickets', toColumn: 'id' }
];

// Function to find relationship usage in code
function findRelationshipUsage(rootDir = './') {
  const results = {
    relationshipsFound: {},
    relationshipsNotFound: [],
    joinPatterns: [],
    potentialOrphans: []
  };

  // Initialize results
  foreignKeyRelationships.forEach(rel => {
    const key = `${rel.from}.${rel.column} -> ${rel.to}.${rel.toColumn}`;
    results.relationshipsFound[key] = [];
  });

  // Get all code files
  const files = getAllFiles(rootDir);

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');

    foreignKeyRelationships.forEach(rel => {
      const key = `${rel.from}.${rel.column} -> ${rel.to}.${rel.toColumn}`;
      
      // Search patterns for this relationship
      const patterns = [
        // Supabase join patterns
        `from('${rel.from}').*select.*${rel.to}`,
        `from("${rel.from}").*select.*${rel.to}`,
        
        // SQL JOIN patterns
        `${rel.from}.*JOIN.*${rel.to}.*ON.*${rel.column}`,
        `${rel.to}.*JOIN.*${rel.from}.*ON.*${rel.column}`,
        
        // Filter by foreign key
        `eq('${rel.column}'`,
        `eq("${rel.column}"`,
        `filter('${rel.column}'`,
        `filter("${rel.column}"`,
        
        // Foreign key column usage
        rel.column,
        
        // Both table names in same file (potential relationship usage)
        `${rel.from}.*${rel.to}|${rel.to}.*${rel.from}`
      ];

      patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(content)) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              results.relationshipsFound[key].push({
                file: filePath,
                line: index + 1,
                content: line.trim(),
                pattern: pattern
              });
            }
          });
        }
      });
    });

    // Look for explicit JOIN patterns
    const joinPatterns = [
      /JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi,
      /\.join\(['"](\w+)['"],.*['"](\w+)['"]/gi,
    ];

    joinPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        results.joinPatterns.push({
          file: filePath,
          match: match[0],
          tables: match.slice(1)
        });
      }
    });
  });

  // Find unused relationships
  results.relationshipsNotFound = Object.keys(results.relationshipsFound).filter(key => 
    results.relationshipsFound[key].length === 0
  );

  return results;
}

// Function to get all files (reuse from previous script)
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.sql'];

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file);
      if (codeExtensions.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Generate relationship report
function generateRelationshipReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('🔗 FOREIGN KEY RELATIONSHIP ANALYSIS REPORT');
  console.log('='.repeat(70));

  const usedRelationships = Object.keys(results.relationshipsFound).filter(key => 
    results.relationshipsFound[key].length > 0
  );

  console.log(`\n✅ USED RELATIONSHIPS (${usedRelationships.length}/${foreignKeyRelationships.length}):`);
  usedRelationships.forEach(key => {
    const usage = results.relationshipsFound[key];
    console.log(`\n  🔗 ${key}`);
    console.log(`     Found in ${usage.length} places:`);
    
    usage.slice(0, 2).forEach(ref => {
      const shortPath = ref.file.replace(process.cwd(), '.');
      console.log(`     └─ ${shortPath}:${ref.line}`);
      console.log(`        ${ref.content.substring(0, 80)}...`);
    });
    
    if (usage.length > 2) {
      console.log(`     └─ ... and ${usage.length - 2} more references`);
    }
  });

  console.log(`\n❌ UNUSED RELATIONSHIPS (${results.relationshipsNotFound.length}):`);
  if (results.relationshipsNotFound.length > 0) {
    results.relationshipsNotFound.forEach(key => {
      console.log(`  🔓 ${key}`);
    });
    
    console.log(`\n⚠️  WARNING: These foreign key relationships exist in your database`);
    console.log(`   but aren't being used in your code. Consider:`);
    console.log(`   • Are these tables actually unused?`);
    console.log(`   • Are there missing features that should use these relationships?`);
    console.log(`   • Can these foreign keys be safely removed?`);
  } else {
    console.log('  🎉 All foreign key relationships are being used!');
  }

  if (results.joinPatterns.length > 0) {
    console.log(`\n🔄 EXPLICIT JOIN PATTERNS FOUND (${results.joinPatterns.length}):`);
    results.joinPatterns.forEach(join => {
      const shortPath = join.file.replace(process.cwd(), '.');
      console.log(`  📁 ${shortPath}: ${join.match}`);
    });
  }

  // Summary
  const usagePercentage = ((usedRelationships.length / foreignKeyRelationships.length) * 100).toFixed(1);
  console.log(`\n📊 RELATIONSHIP SUMMARY:`);
  console.log(`  • Total FK relationships: ${foreignKeyRelationships.length}`);
  console.log(`  • Relationships used in code: ${usedRelationships.length}`);
  console.log(`  • Unused relationships: ${results.relationshipsNotFound.length}`);
  console.log(`  • Explicit JOINs found: ${results.joinPatterns.length}`);
  console.log(`  • Relationship usage: ${usagePercentage}%`);
}

// Run the analysis
if (import.meta.url === `file://${__filename}`) {
  const projectRoot = './';
  const results = findRelationshipUsage(projectRoot);
  generateRelationshipReport(results);
  
  // Export detailed results
  fs.writeFileSync('relationship-analysis.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results exported to: relationship-analysis.json`);
}

export { findRelationshipUsage, generateRelationshipReport };
