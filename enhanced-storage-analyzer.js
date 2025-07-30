/**
 * Enhanced Storage Analyzer for Morning Sync
 * Exports runEnhancedStorageAnalysis function for daily-health-check.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').trim();
                        if (!process.env[key.trim()]) {
                            process.env[key.trim()] = value;
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.warn('⚠️ Could not load .env file:', error.message);
    }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wjpunccqxowctouvhwis.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function runEnhancedStorageAnalysis() {
    const envKeys = Object.keys(process.env).filter(key => 
        key.startsWith('SUPABASE_') || key.startsWith('DIAGNOSTICS_') || key === 'NODE_ENV'
    );
    
    console.log('📄 Loaded .env file with keys:', envKeys);
    console.log('🔍 Storage Analyzer Environment Check:');
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Missing'}`);
    console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing'}`);
    console.log('🔑 Using SERVICE ROLE key for storage access');
    
    console.log('\n🗄️ Starting Enhanced Storage Buckets Analysis...');

    try {
        // Test storage access
        console.log('\n  🔧 Testing storage access permissions...');
        console.log('  📦 Method 1: Attempting storage.listBuckets()...');
        
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            throw new Error(`Failed to list buckets: ${bucketsError.message}`);
        }

        console.log(`  ✅ listBuckets() successful: Found ${buckets?.length || 0} buckets`);

        if (!buckets || buckets.length === 0) {
            console.log('  📭 No storage buckets found');
            return {
                success: true,
                buckets: [],
                summary: { totalBuckets: 0, totalFiles: 0, totalSize: 0 },
                executedAt: new Date().toISOString()
            };
        }

        console.log(`\n  🔍 Analyzing ${buckets.length} buckets in detail...`);

        const detailedBuckets = [];
        let totalFiles = 0;
        let totalSize = 0;

        for (const bucket of buckets) {
            console.log(`\n    📦 Analyzing bucket: ${bucket.name}...`);
            
            const bucketData = {
                ...bucket,
                files: [],
                fileCount: 0,
                totalSize: 0,
                errors: [],
                averageFileSize: 0
            };

            try {
                // List files in bucket
                const { data: files, error: filesError } = await supabase.storage
                    .from(bucket.id)
                    .list('', { limit: 100 });

                if (filesError) {
                    bucketData.errors.push(`File listing error: ${filesError.message}`);
                } else if (files) {
                    bucketData.files = files.map(file => ({
                        name: file.name,
                        id: file.id,
                        updated_at: file.updated_at,
                        created_at: file.created_at,
                        last_accessed_at: file.last_accessed_at,
                        metadata: file.metadata
                    }));
                    
                    bucketData.fileCount = files.length;
                    bucketData.totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
                    bucketData.averageFileSize = bucketData.fileCount > 0 ? 
                        Math.round(bucketData.totalSize / bucketData.fileCount) : 0;
                    
                    totalFiles += bucketData.fileCount;
                    totalSize += bucketData.totalSize;
                }
            } catch (error) {
                bucketData.errors.push(`Bucket analysis error: ${error.message}`);
            }

            console.log(`    ✅ ${bucket.name}: ${bucketData.fileCount} files, ${bucketData.totalSize} Bytes`);
            detailedBuckets.push(bucketData);
        }

        const analysis = {
            executedAt: new Date().toISOString(),
            permissionsUsed: 'service_role',
            buckets: detailedBuckets,
            summary: {
                totalBuckets: buckets.length,
                totalFiles,
                totalSize,
                publicBuckets: buckets.filter(b => b.public).length,
                privateBuckets: buckets.filter(b => !b.public).length
            },
            errors: [],
            debug: {
                listBucketsSuccess: true
            }
        };

        console.log('\n📊 Exporting Enhanced Storage Analysis Results...');

        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(
            `./project-health/enhanced-storage-analysis-${timestamp}.json`,
            JSON.stringify(analysis, null, 2)
        );
        fs.writeFileSync(
            './project-health/latest-enhanced-storage-analysis.json',
            JSON.stringify(analysis, null, 2)
        );

        // Create markdown report
        const report = createStorageReport(analysis);
        fs.writeFileSync(
            `./project-health/enhanced-storage-report-${timestamp}.md`,
            report
        );
        fs.writeFileSync(
            './project-health/latest-enhanced-storage-report.md',
            report
        );

        console.log('\n📁 Enhanced Storage Analysis Files Generated:');
        console.log(`   • enhanced-storage-analysis-${timestamp}.json - Complete storage data with debug info`);
        console.log(`   • enhanced-storage-report-${timestamp}.md - Human-readable storage report with troubleshooting`);
        console.log(`   • latest-enhanced-storage-analysis.json - Always current storage data`);
        console.log(`   • latest-enhanced-storage-report.md - Always current storage report`);

        console.log('\n🎉 Enhanced Storage Analysis Complete!');
        console.log('🔑 Used SERVICE_ROLE permissions');
        console.log(`📦 ${analysis.summary.totalBuckets} buckets analyzed`);
        console.log(`📄 ${analysis.summary.totalFiles} files found`);
        console.log(`💾 ${analysis.summary.totalSize} Bytes total storage used`);

        return analysis;

    } catch (error) {
        console.error('❌ Storage analysis failed:', error.message);
        return { 
            success: false, 
            error: error.message,
            executedAt: new Date().toISOString()
        };
    }
}

function createStorageReport(analysis) {
    const { summary, buckets, executedAt } = analysis;
    
    let report = `# 🗄️ Enhanced Storage Analysis Report\n`;
    report += `*Generated: ${executedAt}*\n\n`;
    
    report += `## 📊 Storage Summary\n\n`;
    report += `- **Permissions Used**: ${analysis.permissionsUsed.toUpperCase()}\n`;
    report += `- **Total Buckets**: ${summary.totalBuckets}\n`;
    report += `- **Total Files**: ${summary.totalFiles}\n`;
    report += `- **Total Storage Used**: ${summary.totalSize} Bytes\n`;
    report += `- **Public Buckets**: ${summary.publicBuckets}\n`;
    report += `- **Private Buckets**: ${summary.privateBuckets}\n\n`;
    
    report += `## 📦 Bucket Details\n\n`;
    
    buckets.forEach(bucket => {
        const privacy = bucket.public ? '🔓 Public' : '🔒 Private';
        report += `\n### ${privacy} ${bucket.name}\n\n`;
        report += `- **Type**: ${bucket.public ? 'Public' : 'Private'}\n`;
        report += `- **Files**: ${bucket.fileCount}\n`;
        report += `- **Total Size**: ${bucket.totalSize} Bytes\n`;
        report += `- **Average File Size**: ${bucket.averageFileSize} Bytes\n`;
        report += `- **Created**: ${bucket.created_at?.split('T')[0]}\n`;
        
        if (bucket.file_size_limit) {
            report += `- **File Size Limit**: ${Math.round(bucket.file_size_limit / 1024 / 1024)} MB\n`;
        } else {
            report += `- **File Size Limit**: No limit\n`;
        }
        
        if (bucket.allowed_mime_types?.length > 0) {
            report += `- **Allowed Types**: ${bucket.allowed_mime_types.join(', ')}\n`;
        } else {
            report += `- **Allowed Types**: All types\n`;
        }
        
        report += `- **Data Source**: storage_api\n\n`;
        
        if (bucket.errors.length > 0) {
            report += `**Errors**:\n`;
            bucket.errors.forEach(error => {
                report += `- ${error}\n`;
            });
            report += `\n`;
        }
        
        if (bucket.files.length > 0) {
            report += `**Recent Files** (showing first 5):\n`;
            bucket.files.slice(0, 5).forEach(file => {
                const size = file.metadata?.size || 0;
                report += `- ${file.name} (${size} Bytes)\n`;
            });
            report += `\n`;
        }
    });
    
    report += `## ❌ Errors Encountered\n\n`;
    if (analysis.errors.length === 0) {
        report += `✅ No errors encountered\n\n`;
    } else {
        analysis.errors.forEach(error => {
            report += `- ${error}\n`;
        });
        report += `\n`;
    }
    
    report += `## 🔍 Troubleshooting\n\n`;
    report += `## 📈 Recommendations\n\n`;
    report += `---\n`;
    report += `*This enhanced storage analysis provides detailed troubleshooting information for Supabase Storage access*`;
    
    return report;
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runEnhancedStorageAnalysis()
        .then(result => {
            console.log('\n🎉 Storage analysis complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Analysis failed:', error);
            process.exit(1);
        });
}
