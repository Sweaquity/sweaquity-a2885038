#!/usr/bin/env node

// ES Module Compatible Codebase Route Analysis & Issue Detection Script
// Save this as 'analyze-codebase.js' and run with: node analyze-codebase.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedCodebaseAnalyzer {
  constructor(rootDir = './src') {
    this.rootDir = rootDir;
    this.routes = new Set();
    this.files = [];
    this.routePatterns = [];
    this.issues = [];
    this.deadEnds = [];
    this.unreachableCode = [];
    this.brokenLinks = [];
    this.codeSmells = [];
  }

  // Scan all TypeScript/TSX files
  scanFiles(dir = this.rootDir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          this.scanFiles(fullPath);
        } else if (item.match(/\.(tsx?|jsx?)$/)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          const content = fs.readFileSync(fullPath, 'utf8');
          this.files.push({
            path: relativePath,
            name: item,
            dir: path.dirname(relativePath),
            content,
            lines: content.split('\n').length,
            size: stat.size
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error.message);
    }
  }

  // Extract routes and detect routing issues
  extractRoutes() {
    const routeRegexes = [
      // React Router patterns
      /(?:path|to)=["']([^"']+)["']/g,
      /route\s*\(\s*["']([^"']+)["']/g,
      /<Route[^>]+path=["']([^"']+)["']/g,
      /navigate\s*\(\s*["']([^"']+)["']/g,
      /useNavigate.*["']([^"']+)["']/g,
      
      // Next.js patterns
      /router\.push\s*\(\s*["']([^"']+)["']/g,
      /Link.*href=["']([^"']+)["']/g,
      
      // Generic navigation patterns
      /href=["']([^"']+)["']/g,
    ];

    const allFoundRoutes = new Map(); // Track where each route was found

    this.files.forEach(file => {
      const routesInFile = [];
      
      routeRegexes.forEach(regex => {
        let match;
        while ((match = regex.exec(file.content)) !== null) {
          let route = match[1] || match[0];
          route = route.replace(/['"]/g, '');
          
          if (route.startsWith('/') && route.length > 1 && !route.includes(' ')) {
            const cleanRoute = route.replace(/\/:[^\/]*/g, '').replace(/\/\[.*?\]/g, '');
            if (cleanRoute) {
              this.routes.add(cleanRoute);
              routesInFile.push(route);
              
              if (!allFoundRoutes.has(cleanRoute)) {
                allFoundRoutes.set(cleanRoute, []);
              }
              allFoundRoutes.get(cleanRoute).push({
                file: file.path,
                originalRoute: route,
                context: this.getContext(file.content, match.index)
              });
            }
          }
        }
      });

      // Store routes found in this file for cross-reference
      file.routes = routesInFile;
    });

    // Detect potential routing issues
    this.detectRoutingIssues(allFoundRoutes);
  }

  // Detect various routing and navigation issues
  detectRoutingIssues(allFoundRoutes) {
    for (const [route, occurrences] of allFoundRoutes) {
      // Check for routes that are referenced but may not have corresponding components
      const hasPageComponent = this.files.some(file => 
        file.path.includes('/pages/') && 
        this.isFileRelatedToRoute(file, route, route.split('/').filter(Boolean))
      );

      if (!hasPageComponent && occurrences.length > 0) {
        this.deadEnds.push({
          type: 'missing_page_component',
          route,
          severity: 'high',
          message: `Route "${route}" is referenced but no corresponding page component found`,
          occurrences: occurrences.length,
          foundIn: occurrences.map(o => o.file)
        });
      }

      // Check for duplicate route definitions
      if (occurrences.length > 3) {
        this.codeSmells.push({
          type: 'duplicate_routes',
          route,
          severity: 'medium',
          message: `Route "${route}" is defined/referenced ${occurrences.length} times`,
          occurrences: occurrences.length,
          locations: occurrences.map(o => o.file)
        });
      }
    }
  }

  // Detect dead code and unreachable components
  detectDeadCode() {
    const importedComponents = new Set();
    const exportedComponents = new Set();
    const usedComponents = new Set();

    this.files.forEach(file => {
      const content = file.content;

      // Find all imports
      const importMatches = content.matchAll(/import\s+.*?from\s+["']([^"']+)["']/g);
      for (const match of importMatches) {
        importedComponents.add(match[1]);
      }

      // Find all exports
      const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g);
      for (const match of exportMatches) {
        exportedComponents.add(`${file.path}:${match[1]}`);
      }

      // Find component usage in JSX
      const jsxMatches = content.matchAll(/<(\w+)/g);
      for (const match of jsxMatches) {
        usedComponents.add(match[1]);
      }
    });

    // Find potentially unused components
    this.files.forEach(file => {
      if (file.path.includes('/components/') && !file.path.includes('.test.')) {
        const componentName = path.basename(file.name, path.extname(file.name));
        
        // Check if this component is used anywhere
        const isUsed = this.files.some(otherFile => 
          otherFile.path !== file.path && 
          (otherFile.content.includes(componentName) || 
           otherFile.content.includes(file.name.replace('.tsx', '').replace('.jsx', '')))
        );

        if (!isUsed) {
          this.unreachableCode.push({
            type: 'unused_component',
            file: file.path,
            component: componentName,
            severity: 'medium',
            message: `Component "${componentName}" appears to be unused`,
            size: file.size,
            lines: file.lines
          });
        }
      }
    });
  }

  // Detect code smells and anti-patterns
  detectCodeSmells() {
    this.files.forEach(file => {
      const content = file.content;
      const lines = content.split('\n');

      // Large files (potential refactoring candidates)
      if (file.lines > 300) {
        this.codeSmells.push({
          type: 'large_file',
          file: file.path,
          severity: 'medium',
          message: `File is quite large (${file.lines} lines) - consider breaking it down`,
          lines: file.lines,
          size: file.size
        });
      }

      // TODO comments (potential dead ends or incomplete work)
      const todoMatches = content.matchAll(/\/\/\s*TODO:?\s*(.+)/gi);
      for (const match of todoMatches) {
        this.deadEnds.push({
          type: 'todo_comment',
          file: file.path,
          severity: 'low',
          message: `TODO found: ${match[1].trim()}`,
          context: match[0]
        });
      }

      // FIXME comments (known issues)
      const fixmeMatches = content.matchAll(/\/\/\s*FIXME:?\s*(.+)/gi);
      for (const match of fixmeMatches) {
        this.issues.push({
          type: 'fixme_comment',
          file: file.path,
          severity: 'high',
          message: `FIXME found: ${match[1].trim()}`,
          context: match[0]
        });
      }

      // Console.log statements (potential debugging leftovers)
      const consoleMatches = content.matchAll(/console\.(log|warn|error|debug)\s*\(/g);
      if (consoleMatches) {
        const count = Array.from(consoleMatches).length;
        if (count > 3) {
          this.codeSmells.push({
            type: 'excessive_logging',
            file: file.path,
            severity: 'low',
            message: `${count} console statements found - consider removing debug logs`,
            count
          });
        }
      }

      // Empty catch blocks
      const emptyCatchMatches = content.matchAll(/catch\s*\([^)]*\)\s*{\s*}/g);
      for (const match of emptyCatchMatches) {
        this.issues.push({
          type: 'empty_catch_block',
          file: file.path,
          severity: 'high',
          message: 'Empty catch block found - errors are being silently ignored',
          context: match[0]
        });
      }

      // Hardcoded URLs or API endpoints
      const urlMatches = content.matchAll(/(https?:\/\/[^\s"']+)/g);
      for (const match of urlMatches) {
        if (!match[1].includes('localhost') && !match[1].includes('example.com')) {
          this.codeSmells.push({
            type: 'hardcoded_url',
            file: file.path,
            severity: 'medium',
            message: `Hardcoded URL found: ${match[1]}`,
            url: match[1]
          });
        }
      }

      // Potential infinite loops or missing dependencies
      const useEffectMatches = content.matchAll(/useEffect\s*\(\s*[^,]+,\s*\[\s*\]\s*\)/g);
      for (const match of useEffectMatches) {
        // Check if the effect might need dependencies
        const effectContent = match[0];
        if (effectContent.includes('state') || effectContent.includes('props')) {
          this.codeSmells.push({
            type: 'missing_dependencies',
            file: file.path,
            severity: 'medium',
            message: 'useEffect with empty deps array but using state/props',
            context: match[0].slice(0, 100) + '...'
          });
        }
      }
    });
  }

  // Detect broken internal links and imports
  detectBrokenLinks() {
    this.files.forEach(file => {
      const content = file.content;
      
      // Check relative imports
      const importMatches = content.matchAll(/import\s+.*?from\s+["']([^"']+)["']/g);
      for (const match of importMatches) {
        const importPath = match[1];
        
        // Skip external packages (no ./ or ../)
        if (!importPath.startsWith('.')) continue;
        
        // Resolve the path
        const resolvedPath = path.resolve(path.dirname(file.path), importPath);
        const possibleFiles = [
          resolvedPath + '.ts',
          resolvedPath + '.tsx',
          resolvedPath + '.js',
          resolvedPath + '.jsx',
          resolvedPath + '/index.ts',
          resolvedPath + '/index.tsx'
        ];
        
        const exists = possibleFiles.some(p => {
          try {
            return fs.existsSync(p);
          } catch {
            return false;
          }
        });
        
        if (!exists) {
          this.brokenLinks.push({
            type: 'broken_import',
            file: file.path,
            severity: 'high',
            message: `Broken import: "${importPath}" cannot be resolved`,
            importPath,
            context: match[0]
          });
        }
      }
    });
  }

  // Get context around a match
  getContext(content, index) {
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + 50);
    return content.slice(start, end).replace(/\n/g, ' ');
  }

  // Check if a file is related to a route
  isFileRelatedToRoute(file, route, segments) {
    const fileName = file.name.toLowerCase();
    const filePath = file.path.toLowerCase();
    
    return segments.some(segment => {
      const segmentLower = segment.toLowerCase();
      return fileName.includes(segmentLower) || 
             filePath.includes(segmentLower) ||
             fileName.replace(/[^a-z]/g, '').includes(segmentLower.replace(/[^a-z]/g, ''));
    });
  }

  // Categorize files by type and purpose
  categorizeFiles() {
    const categories = {
      pages: [],
      components: [],
      hooks: [],
      utils: [],
      api: [],
      services: [],
      stores: [],
      types: [],
      tests: []
    };

    this.files.forEach(file => {
      const { path: filePath, name } = file;
      
      if (name.includes('.test.') || name.includes('.spec.')) {
        categories.tests.push(file);
      } else if (filePath.includes('/pages/') || filePath.includes('/views/')) {
        categories.pages.push(file);
      } else if (filePath.includes('/components/')) {
        categories.components.push(file);
      } else if (name.startsWith('use') && name.endsWith('.ts')) {
        categories.hooks.push(file);
      } else if (filePath.includes('/api/') || filePath.includes('/services/')) {
        categories.api.push(file);
      } else if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
        categories.utils.push(file);
      } else if (filePath.includes('/store/') || filePath.includes('/redux/')) {
        categories.stores.push(file);
      } else if (name.includes('type') || name.includes('interface')) {
        categories.types.push(file);
      } else {
        categories.components.push(file);
      }
    });

    return categories;
  }

  // Generate route mapping
  generateRouteMapping() {
    const categories = this.categorizeFiles();
    const mapping = {};

    const sortedRoutes = Array.from(this.routes).sort((a, b) => b.length - a.length);

    sortedRoutes.forEach(route => {
      const routeFiles = [];
      const routeSegments = route.split('/').filter(Boolean);
      
      // Find related files
      const pageFiles = categories.pages.filter(file => 
        this.isFileRelatedToRoute(file, route, routeSegments)
      );
      
      pageFiles.forEach(file => {
        routeFiles.push({
          path: file.path,
          type: 'page',
          confidence: 'high',
          reason: `Page component for ${route}`
        });
      });

      const componentFiles = categories.components.filter(file => 
        this.isFileRelatedToRoute(file, route, routeSegments)
      );
      
      componentFiles.slice(0, 5).forEach(file => {
        routeFiles.push({
          path: file.path,
          type: 'component',
          confidence: pageFiles.length > 0 ? 'medium' : 'high',
          reason: `Component related to ${route}`
        });
      });

      const hookFiles = categories.hooks.filter(file => 
        this.isFileRelatedToRoute(file, route, routeSegments)
      );
      
      hookFiles.slice(0, 3).forEach(file => {
        routeFiles.push({
          path: file.path,
          type: 'hook',
          confidence: 'medium',
          reason: `Hook for ${route} data/logic`
        });
      });

      if (routeFiles.length > 0) {
        mapping[route] = routeFiles;
      }
    });

    return mapping;
  }

  // Generate common files list
  generateCommonFiles() {
    const categories = this.categorizeFiles();
    const common = [];

    categories.utils.forEach(file => {
      if (file.name.includes('supabase') || file.name.includes('api') || file.name.includes('auth')) {
        common.push({
          path: file.path,
          type: 'util',
          confidence: 'medium',
          reason: `Utility file: ${file.name}`
        });
      }
    });

    this.files.forEach(file => {
      if (file.name.toLowerCase().includes('layout') || 
          file.name.toLowerCase().includes('app.tsx') ||
          file.name.toLowerCase().includes('index.tsx')) {
        common.push({
          path: file.path,
          type: 'component',
          confidence: 'low',
          reason: `Global component: ${file.name}`
        });
      }
    });

    categories.hooks.forEach(file => {
      if (file.name.toLowerCase().includes('auth') || file.name.toLowerCase().includes('user')) {
        common.push({
          path: file.path,
          type: 'hook',
          confidence: 'medium',
          reason: `Auth/user hook: ${file.name}`
        });
      }
    });

    return common.slice(0, 10);
  }

  // Main analysis function
  analyze() {
    console.log('🔍 Analyzing codebase for routes and issues...\n');
    
    this.scanFiles();
    console.log(`📁 Found ${this.files.length} TypeScript/React files`);
    
    this.extractRoutes();
    console.log(`🛣️  Detected ${this.routes.size} unique routes`);
    
    console.log('🐛 Detecting code issues...');
    this.detectDeadCode();
    this.detectCodeSmells();
    this.detectBrokenLinks();
    
    const mapping = this.generateRouteMapping();
    const commonFiles = this.generateCommonFiles();
    
    console.log(`\n📊 Issue Summary:`);
    console.log(`   🔴 Critical Issues: ${this.issues.length}`);
    console.log(`   🟡 Dead Ends: ${this.deadEnds.length}`);
    console.log(`   🔗 Broken Links: ${this.brokenLinks.length}`);
    console.log(`   👃 Code Smells: ${this.codeSmells.length}`);
    console.log(`   💀 Unreachable Code: ${this.unreachableCode.length}`);
    
    return {
      routes: Array.from(this.routes),
      mapping,
      commonFiles,
      issues: {
        critical: this.issues,
        deadEnds: this.deadEnds,
        brokenLinks: this.brokenLinks,
        codeSmells: this.codeSmells,
        unreachableCode: this.unreachableCode
      },
      stats: {
        totalFiles: this.files.length,
        totalRoutes: this.routes.size,
        mappedRoutes: Object.keys(mapping).length,
        totalIssues: this.issues.length + this.deadEnds.length + this.brokenLinks.length + this.codeSmells.length + this.unreachableCode.length
      }
    };
  }

  // Generate comprehensive report
  generateReport(analysis) {
    let report = `# Codebase Analysis Report\n`;
    report += `Generated on ${new Date().toISOString()}\n\n`;
    
    report += `## Summary\n`;
    report += `- **Total Files**: ${analysis.stats.totalFiles}\n`;
    report += `- **Total Routes**: ${analysis.stats.totalRoutes}\n`;
    report += `- **Mapped Routes**: ${analysis.stats.mappedRoutes}\n`;
    report += `- **Total Issues**: ${analysis.stats.totalIssues}\n\n`;
    
    // Critical Issues
    if (analysis.issues.critical.length > 0) {
      report += `## 🔴 Critical Issues (${analysis.issues.critical.length})\n\n`;
      analysis.issues.critical.forEach(issue => {
        report += `### ${issue.type}\n`;
        report += `- **File**: ${issue.file}\n`;
        report += `- **Severity**: ${issue.severity}\n`;
        report += `- **Message**: ${issue.message}\n`;
        if (issue.context) report += `- **Context**: \`${issue.context}\`\n`;
        report += `\n`;
      });
    }
    
    // Dead Ends
    if (analysis.issues.deadEnds.length > 0) {
      report += `## 🟡 Dead Ends & Incomplete Work (${analysis.issues.deadEnds.length})\n\n`;
      analysis.issues.deadEnds.forEach(issue => {
        report += `### ${issue.type}\n`;
        report += `- **Location**: ${issue.file || issue.route}\n`;
        report += `- **Severity**: ${issue.severity}\n`;
        report += `- **Message**: ${issue.message}\n`;
        if (issue.occurrences) report += `- **Occurrences**: ${issue.occurrences}\n`;
        report += `\n`;
      });
    }
    
    // Broken Links
    if (analysis.issues.brokenLinks.length > 0) {
      report += `## 🔗 Broken Links & Imports (${analysis.issues.brokenLinks.length})\n\n`;
      analysis.issues.brokenLinks.forEach(issue => {
        report += `### ${issue.type}\n`;
        report += `- **File**: ${issue.file}\n`;
        report += `- **Message**: ${issue.message}\n`;
        if (issue.importPath) report += `- **Import Path**: ${issue.importPath}\n`;
        report += `\n`;
      });
    }
    
    // Code Smells
    if (analysis.issues.codeSmells.length > 0) {
      report += `## 👃 Code Smells (${analysis.issues.codeSmells.length})\n\n`;
      analysis.issues.codeSmells.forEach(issue => {
        report += `### ${issue.type}\n`;
        report += `- **File**: ${issue.file}\n`;
        report += `- **Message**: ${issue.message}\n`;
        if (issue.lines) report += `- **Lines**: ${issue.lines}\n`;
        if (issue.count) report += `- **Count**: ${issue.count}\n`;
        report += `\n`;
      });
    }
    
    // Unreachable Code
    if (analysis.issues.unreachableCode.length > 0) {
      report += `## 💀 Unreachable Code (${analysis.issues.unreachableCode.length})\n\n`;
      analysis.issues.unreachableCode.forEach(issue => {
        report += `### ${issue.component || issue.file}\n`;
        report += `- **File**: ${issue.file}\n`;
        report += `- **Message**: ${issue.message}\n`;
        report += `- **Size**: ${issue.size} bytes (${issue.lines} lines)\n`;
        report += `\n`;
      });
    }
    
    return report;
  }

  // Generate TypeScript mapping code
  generateTypeScriptMapping(analysis) {
    let output = `// Auto-generated route mapping and issue detection\n`;
    output += `// Generated on ${new Date().toISOString()}\n\n`;
    
    output += `interface RelevantCodeFile {\n`;
    output += `  path: string;\n`;
    output += `  type: 'component' | 'page' | 'hook' | 'util' | 'api' | 'service' | 'store';\n`;
    output += `  confidence: 'high' | 'medium' | 'low';\n`;
    output += `  reason: string;\n`;
    output += `}\n\n`;
    
    output += `const ROUTE_TO_FILES_MAP: Record<string, RelevantCodeFile[]> = {\n`;
    Object.entries(analysis.mapping).forEach(([route, files]) => {
      output += `  '${route}': [\n`;
      files.forEach(file => {
        output += `    { path: '${file.path}', type: '${file.type}', confidence: '${file.confidence}', reason: '${file.reason}' },\n`;
      });
      output += `  ],\n\n`;
    });
    output += `};\n\n`;
    
    output += `const COMMON_FILES: RelevantCodeFile[] = [\n`;
    analysis.commonFiles.forEach(file => {
      output += `  { path: '${file.path}', type: '${file.type}', confidence: '${file.confidence}', reason: '${file.reason}' },\n`;
    });
    output += `];\n\n`;
    
    output += `export { ROUTE_TO_FILES_MAP, COMMON_FILES };\n`;
    
    return output;
  }
}

// Run the analysis
const analyzer = new EnhancedCodebaseAnalyzer();
const analysis = analyzer.analyze();

// Generate and save all outputs
const tsMapping = analyzer.generateTypeScriptMapping(analysis);
const report = analyzer.generateReport(analysis);

fs.writeFileSync('route-mapping.ts', tsMapping);
fs.writeFileSync('codebase-analysis-report.md', report);
fs.writeFileSync('full-analysis.json', JSON.stringify(analysis, null, 2));

console.log('\n🎉 Analysis complete!');
console.log('\n📁 Generated files:');
console.log('  - route-mapping.ts (for your beta testing component)');
console.log('  - codebase-analysis-report.md (detailed issue report)');
console.log('  - full-analysis.json (raw data)');

console.log('\n🚨 Priority Actions:');
if (analysis.issues.critical.length > 0) {
  console.log(`  1. Fix ${analysis.issues.critical.length} critical issues first`);
}
if (analysis.issues.brokenLinks.length > 0) {
  console.log(`  2. Resolve ${analysis.issues.brokenLinks.length} broken imports`);
}
if (analysis.issues.deadEnds.length > 0) {
  console.log(`  3. Address ${analysis.issues.deadEnds.length} dead ends and incomplete work`);
}
if (analysis.issues.unreachableCode.length > 0) {
  console.log(`  4. Clean up ${analysis.issues.unreachableCode.length} unreachable code files`);
}
