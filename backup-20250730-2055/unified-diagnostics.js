#!/usr/bin/env node
/**
 * 🔬 Standalone Unified Diagnostics System
 * 
 * Can be run independently or as part of morning-sync
 * Features:
 * - Sydney timezone
 * - All SQL tests as .js files
 * - Comprehensive automation testing
 * - Upload-ready outputs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

// Environment configuration
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
        console.warn('⚠️  Could not load .env file:', error.message);
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

class UnifiedDiagnosticsSystem {
    constructor() {
        this.startTime = Date.now();
        this.sydneyTime = getSydneyTime();
        this.timestamp = getSydneyISOString();
        
        this.results = {
            metadata: {
                timestamp: this.timestamp,
                sydneyTime: this.sydneyTime,
                timezone: SYDNEY_TZ,
                testId: `unified-${Date.now()}`,
                environment: process.env.NODE_ENV || 'development',
                version: '3.0.0-sydney'
            },
            summary: {
                healthy: 0,
                warnings: 0,
                critical: 0,
                total: 0,
                overallStatus: 'UNKNOWN',
                executionTime: 0
            },
            automationTests: {},
            sqlQueries: {},
            externalDiagnostics: {},
            recommendations: []
        };
        
        // Ensure output directories exist
        this.outputDir = './project-health/diagnostics/outputs';
        this.uploadDir = './project-health/upload-to-claude';
        
        [this.outputDir, this.uploadDir].forEach(dir => {
            fs.mkdirSync(dir, { recursive: true });
        });
    }

    log(message, type = 'info') {
        const time = this.sydneyTime.substring(11, 19);
        const icons = { error: '❌', warning: '⚠️', success: '✅', info: 'ℹ️' };
        console.log(`${icons[type] || 'ℹ️'} [${time}] ${message}`);
    }

    addTest(name, status, data, recommendations = []) {
        this.results.automationTests[name] = {
            status,
            data,
            recommendations,
            timestamp: this.timestamp
        };

        this.results.summary[status]++;
        this.results.summary.total++;

        if (recommendations.length > 0) {
            this.results.recommendations.push(...recommendations.map(r => ({ test: name, action: r })));
        }

        this.log(`${name}: ${status.toUpperCase()}`, 
                 status === 'healthy' ? 'success' : status === 'warnings' ? 'warning' : 'error');
    }

    async executeDirectQuery(name, tableName, query, description) {
        try {
            const start = Date.now();
            const { data, error, count } = await supabase
                .from(tableName)
                .select(query.select, query.options || {});

            const responseTime = Date.now() - start;

            if (error) throw error;

            const result = {
                description,
                tableName,
                query: query.select,
                responseTime: `${responseTime}ms`,
                rowCount: data?.length || 0,
                totalCount: count,
                success: true,
                data: data || [],
                sydneyTime: getSydneyTime()
            };

            this.results.sqlQueries[name] = result;
            this.log(`  ✅ ${name}: ${result.rowCount} rows (${responseTime}ms)`, 'success');
            return result;

        } catch (error) {
            const result = {
                description,
                tableName,
                query: query.select,
                success: false,
                error: error.message,
                responseTime: 0,
                rowCount: 0,
                sydneyTime: getSydneyTime()
            };

            this.results.sqlQueries[name] = result;
            this.log(`  ❌ ${name}: ${error.message}`, 'error');
            return result;
        }
    }

    async testDatabaseConnection() {
        try {
            const start = Date.now();
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .limit(1);

            const responseTime = Date.now() - start;

            if (error) throw error;

            const status = responseTime > 2000 ? 'warnings' : 'healthy';
            const recommendations = responseTime > 2000 ? ['Optimize database performance'] : [];

            this.addTest('Database Connection', status, {
                connected: true,
                responseTime: `${responseTime}ms`,
                recordCount: data?.length || 0,
                sydneyTime: getSydneyTime()
            }, recommendations);

        } catch (error) {
            this.addTest('Database Connection', 'critical', {
                connected: false,
                error: error.message,
                sydneyTime: getSydneyTime()
            }, ['Fix database connection', 'Check environment variables']);
        }
    }

    async testJobApplicationWorkflow() {
        this.log('🔍 Testing Job Application Workflow...', 'info');

        // Test stuck applications
        const stuckResult = await this.executeDirectQuery(
            'Stuck Applications',
            'job_applications',
            {
                select: 'job_app_id, status, nda_document_id, updated_at',
                options: {}
            },
            'Job applications that may need attention'
        );

        // Test recent applications
        const recentResult = await this.executeDirectQuery(
            'Recent Applications',
            'job_applications',
            {
                select: 'job_app_id, status, created_at, updated_at',
                options: {
                    order: { created_at: { ascending: false } },
                    limit: 10
                }
            },
            'Recent job application activity'
        );

        // Test status distribution
        const statusResult = await this.executeDirectQuery(
            'Application Status Distribution',
            'job_applications',
            {
                select: 'status',
                options: {}
            },
            'Distribution of application statuses'
        );

        const stuckCount = stuckResult.data?.filter(app => 
            app.status === 'accepted' && !app.nda_document_id &&
            new Date(app.updated_at) < new Date(Date.now() - 5 * 60 * 1000)
        ).length || 0;

        const statusData = statusResult.data || [];
        const statusCounts = statusData.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {});

        const status = stuckCount === 0 ? 'healthy' : stuckCount < 3 ? 'warnings' : 'critical';
        const recommendations = [];
        if (stuckCount > 0) recommendations.push('Investigate stuck NDA generation process');

        this.addTest('Job Application Workflow', status, {
            stuckApplications: stuckCount,
            recentApplications: recentResult.rowCount || 0,
            statusDistribution: statusCounts,
            totalApplications: statusResult.rowCount || 0
        }, recommendations);
    }

    async testDocumentManagement() {
        this.log('📄 Testing Document Management...', 'info');

        const docsResult = await this.executeDirectQuery(
            'Legal Documents',
            'legal_documents',
            {
                select: 'id, document_type, status, created_at',
                options: {
                    order: { created_at: { ascending: false } },
                    limit: 20
                }
            },
            'Recent legal documents and status'
        );

        const templatesResult = await this.executeDirectQuery(
            'Document Templates',
            'document_templates',
            {
                select: 'template_type, is_active, template_version',
                options: {}
            },
            'Available document templates'
        );

        const hasNDADocs = docsResult.data?.some(doc => doc.document_type === 'nda') || false;
        const activeTemplates = templatesResult.data?.filter(t => t.is_active) || [];
        const ndaTemplates = activeTemplates.filter(t => t.template_type === 'nda') || [];

        const status = activeTemplates.length > 0 && ndaTemplates.length > 0 ? 'healthy' : 'warnings';
        const recommendations = [];
        if (activeTemplates.length === 0) recommendations.push('Activate document templates');
        if (ndaTemplates.length === 0) recommendations.push('Create active NDA templates');

        this.addTest('Document Management', status, {
            totalDocuments: docsResult.rowCount || 0,
            hasNDADocuments: hasNDADocs,
            totalTemplates: templatesResult.rowCount || 0,
            activeTemplates: activeTemplates.length,
            activeNDATemplates: ndaTemplates.length
        }, recommendations);
    }

    async testAuditLogging() {
        this.log('📊 Testing Audit Logging...', 'info');

        const auditResult = await this.executeDirectQuery(
            'Audit Log Activity',
            'audit_log',
            {
                select: 'event_type, created_at, user_id',
                options: {
                    order: { created_at: { ascending: false } },
                    limit: 50
                }
            },
            'Recent audit log entries'
        );

        const recentEntries = auditResult.rowCount || 0;
        const eventTypes = [...new Set(auditResult.data?.map(entry => entry.event_type) || [])];

        const status = recentEntries > 0 ? 'healthy' : 'warnings';
        const recommendations = recentEntries === 0 ? 
            ['Setup audit logging for workflow events'] : [];

        this.addTest('Audit Logging', status, {
            recentEntries,
            uniqueEventTypes: eventTypes.length,
            eventTypes: eventTypes.slice(0, 10),
            auditingActive: recentEntries > 0
        }, recommendations);
    }

    async testBusinessProjects() {
        this.log('🏢 Testing Business Projects...', 'info');

        const businessResult = await this.executeDirectQuery(
            'Business Data',
            'businesses',
            {
                select: 'businesses_id, company_name, created_at',
                options: {
                    order: { created_at: { ascending: false } },
                    limit: 10
                }
            },
            'Active businesses on platform'
        );

        const projectsResult = await this.executeDirectQuery(
            'Business Projects',
            'business_projects',
            {
                select: 'project_id, title, status, equity_allocation',
                options: {
                    order: { created_at: { ascending: false } },
                    limit: 10
                }
            },
            'Active business projects'
        );

        const hasBusinesses = businessResult.rowCount > 0;
        const hasProjects = projectsResult.rowCount > 0;

        const status = hasBusinesses && hasProjects ? 'healthy' : 'warnings';
        const recommendations = [];
        if (!hasBusinesses) recommendations.push('Platform needs business registrations');
        if (!hasProjects) recommendations.push('Platform needs active projects');

        this.addTest('Business Projects', status, {
            totalBusinesses: businessResult.rowCount || 0,
            totalProjects: projectsResult.rowCount || 0,
            hasActiveBusinesses: hasBusinesses,
            hasActiveProjects: hasProjects
        }, recommendations);
    }

    async runExternalDiagnostics() {
        this.log('🧪 Running External SQL Diagnostics...', 'info');

        try {
            // Check if run-diagnostics exists and run it
            if (fs.existsSync('run-diagnostics.js')) {
                const output = execSync('node run-diagnostics.js', { 
                    encoding: 'utf8',
                    timeout: 30000
                });
                
                let externalResults;
                try {
                    externalResults = JSON.parse(output);
                } catch {
                    externalResults = { type: 'text', content: output };
                }
                
                this.results.externalDiagnostics = {
                    runDiagnostics: {
                        success: true,
                        results: externalResults,
                        executedAt: getSydneyTime()
                    }
                };
                
                this.log('✅ External SQL diagnostics completed', 'success');
            } else {
                this.log('⚠️ run-diagnostics.js not found, skipping', 'warning');
                this.results.externalDiagnostics = {
                    runDiagnostics: {
                        success: false,
                        error: 'run-diagnostics.js not found'
                    }
                };
            }
        } catch (error) {
            this.log(`❌ External diagnostics failed: ${error.message}`, 'error');
            this.results.externalDiagnostics = {
                runDiagnostics: {
                    success: false,
                    error: error.message
                }
            };
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Unified Diagnostics System...', 'info');
        this.log(`🕐 Sydney Time: ${this.sydneyTime}`, 'info');
        this.log(`Test ID: ${this.results.metadata.testId}`, 'info');

        // Run all core tests
        await this.testDatabaseConnection();
        await this.testJobApplicationWorkflow();
        await this.testDocumentManagement();
        await this.testAuditLogging();
        await this.testBusinessProjects();
        
        // Run external diagnostics
        await this.runExternalDiagnostics();

        // Calculate final results
        this.results.summary.executionTime = Date.now() - this.startTime;
        
        if (this.results.summary.critical > 0) {
            this.results.summary.overallStatus = 'CRITICAL';
        } else if (this.results.summary.warnings > 0) {
            this.results.summary.overallStatus = 'WARNING';
        } else {
            this.results.summary.overallStatus = 'HEALTHY';
        }

        return this.generateReport();
    }

    generateReport() {
        const { healthy, warnings, critical, total, overallStatus, executionTime } = this.results.summary;
        
        this.log('\n' + '='.repeat(60), 'info');
        this.log('UNIFIED DIAGNOSTICS SUMMARY', 'info');
        this.log('='.repeat(60), 'info');
        this.log(`🕐 Sydney Time: ${this.sydneyTime}`, 'info');
        this.log(`Overall Status: ${overallStatus}`, overallStatus === 'HEALTHY' ? 'success' : 'error');
        this.log(`Tests: ${total} total (${healthy} healthy, ${warnings} warnings, ${critical} critical)`, 'info');
        this.log(`SQL Queries: ${Object.keys(this.results.sqlQueries).length} executed`, 'info');
        this.log(`Execution Time: ${executionTime}ms`, 'info');

        if (this.results.recommendations.length > 0) {
            this.log('\n📋 RECOMMENDATIONS:', 'info');
            this.results.recommendations.forEach((rec, i) => {
                this.log(`${i + 1}. [${rec.test}] ${rec.action}`, 'info');
            });
        }

        this.saveResults();
        return this.results;
    }

    saveResults() {
        try {
            // Save main results
            const latestPath = path.join(this.outputDir, 'latest-unified-diagnostics.json');
            fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));

            // Create markdown report
            const reportPath = path.join(this.outputDir, 'latest-unified-diagnostics-report.md');
            const report = this.createMarkdownReport();
            fs.writeFileSync(reportPath, report);

            // Save SQL queries separately
            const sqlPath = path.join(this.outputDir, 'latest-unified-sql-tests.json');
            fs.writeFileSync(sqlPath, JSON.stringify(this.results.sqlQueries, null, 2));

            // Copy to upload folder
            if (fs.existsSync(this.uploadDir)) {
                fs.copyFileSync(latestPath, path.join(this.uploadDir, 'unified-diagnostics.json'));
                fs.copyFileSync(reportPath, path.join(this.uploadDir, 'unified-diagnostics-report.md'));
                fs.copyFileSync(sqlPath, path.join(this.uploadDir, 'unified-sql-tests.json'));
            }

            this.log(`Results saved to: ${latestPath}`, 'success');
            this.log(`Report saved to: ${reportPath}`, 'success');
            this.log(`SQL tests saved to: ${sqlPath}`, 'success');

        } catch (error) {
            this.log(`Failed to save results: ${error.message}`, 'error');
        }
    }

    createMarkdownReport() {
        const { overallStatus, total, healthy, warnings, critical, executionTime } = this.results.summary;
        
        let report = `# Unified Diagnostics Report\n\n`;
        report += `**Generated:** ${this.sydneyTime} (Sydney Time)\n`;
        report += `**Test ID:** ${this.results.metadata.testId}\n`;
        report += `**Overall Status:** ${overallStatus}\n`;
        report += `**Tests:** ${total} (${healthy} healthy, ${warnings} warnings, ${critical} critical)\n`;
        report += `**SQL Queries:** ${Object.keys(this.results.sqlQueries).length} executed\n`;
        report += `**Execution Time:** ${executionTime}ms\n\n`;

        // Test Results
        report += `## 🔧 Automation Test Results\n\n`;
        Object.entries(this.results.automationTests).forEach(([name, test]) => {
            const icon = test.status === 'healthy' ? '✅' : test.status === 'warnings' ? '⚠️' : '❌';
            report += `${icon} **${name}:** ${test.status.toUpperCase()}\n`;
            
            if (test.recommendations.length > 0) {
                report += `   **Recommendations:**\n`;
                test.recommendations.forEach(rec => {
                    report += `   - ${rec}\n`;
                });
            }
        });

        if (this.results.recommendations.length > 0) {
            report += `\n## 📋 Priority Actions\n\n`;
            this.results.recommendations.forEach((rec, i) => {
                report += `${i + 1}. **[${rec.test}]** ${rec.action}\n`;
            });
        }

        report += `\n## 🔍 SQL Query Details\n\n`;
        Object.entries(this.results.sqlQueries).forEach(([name, result]) => {
            report += `### ${name}\n`;
            report += `**Table:** ${result.tableName}\n`;
            report += `**Query:** ${result.query}\n`;
            report += `**Result:** ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.rowCount} rows in ${result.responseTime || 'N/A'}\n\n`;
        });

        return report;
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const diagnostics = new UnifiedDiagnosticsSystem();
    
    diagnostics.runAllTests()
        .then(results => {
            // Output JSON for integration with other systems
            console.log('\n📤 JSON OUTPUT FOR INTEGRATION:');
            console.log(JSON.stringify(results, null, 2));
            
            const exitCode = results.summary.critical === 0 ? 0 : 1;
            console.log(`\n🏁 Unified diagnostics completed with exit code ${exitCode}`);
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('❌ Unified diagnostics failed:', error);
            process.exit(1);
        });
}

export default UnifiedDiagnosticsSystem;