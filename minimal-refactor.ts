// minimal-refactor.ts
// Run with: npx ts-morph-runner minimal-refactor.ts
// Or: npx ts-node minimal-refactor.ts (if ts-morph is installed)

import { Project } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

interface FileInfo {
  path: string;
  lines: number;
  imports: string[];
  exports: string[];
  hasJSX: boolean;
  isComponent: boolean;
  isHook: boolean;
  relativeImportCount: number;
}

class MinimalConsolidator {
  private project: Project;
  private files: FileInfo[] = [];

  constructor() {
    try {
      this.project = new Project({
        tsConfigFilePath: "tsconfig.json",
      });
    } catch (error) {
      console.log("⚠️  No tsconfig.json found, using default TypeScript settings");
      this.project = new Project();
      this.project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");
    }
  }

  async analyze() {
    console.log("🔍 Analyzing TypeScript files...");
    
    const sourceFiles = this.project.getSourceFiles();
    console.log(`Found ${sourceFiles.length} TypeScript files`);

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      
      // Skip node_modules and dist
      if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('.next')) {
        continue;
      }

      const content = sourceFile.getFullText();
      const lines = content.split('\n').length;
      
      // Extract imports
      const importDeclarations = sourceFile.getImportDeclarations();
      const imports = importDeclarations.map(imp => imp.getModuleSpecifierValue());
      const relativeImports = imports.filter(imp => imp.startsWith('.'));
      
      // Extract exports
      const exports = Array.from(sourceFile.getExportedDeclarations().keys());
      
      // Check for JSX
      const hasJSX = /jsx|<[A-Z]/.test(content);
      
      // Check if it's a React component
      const isComponent = hasJSX && (
        /export default function [A-Z]/.test(content) ||
        /export default [A-Z]/.test(content) ||
        /const [A-Z][a-zA-Z]+ = .*=>/.test(content)
      );
      
      // Check if it's a hook
      const isHook = /export.*function use[A-Z]/.test(content) ||
                     /export.*use[A-Z][a-zA-Z]+ = /.test(content);

      this.files.push({
        path: filePath,
        lines,
        imports,
        exports,
        hasJSX,
        isComponent,
        isHook,
        relativeImportCount: relativeImports.length
      });
    }

    console.log(`✅ Analyzed ${this.files.length} files`);
    this.generateReport();
    this.identifyConsolidationOpportunities();
  }

  private generateReport() {
    const report = {
      totalFiles: this.files.length,
      totalLines: this.files.reduce((sum, f) => sum + f.lines, 0),
      smallFiles: this.files.filter(f => f.lines < 50).length,
      components: this.files.filter(f => f.isComponent).length,
      hooks: this.files.filter(f => f.isHook).length,
      utilities: this.files.filter(f => !f.hasJSX && f.exports.length > 0).length,
      fragmentedFiles: this.files.filter(f => f.relativeImportCount > 3).length
    };

    console.log("\n📊 Codebase Overview:");
    console.log(`  Total files: ${report.totalFiles}`);
    console.log(`  Total lines: ${report.totalLines}`);
    console.log(`  Average file size: ${Math.round(report.totalLines / report.totalFiles)} lines`);
    console.log(`  Small files (<50 lines): ${report.smallFiles} (${Math.round(report.smallFiles/report.totalFiles*100)}%)`);
    console.log(`  React components: ${report.components}`);
    console.log(`  Custom hooks: ${report.hooks}`);
    console.log(`  Utility files: ${report.utilities}`);
    console.log(`  Fragmented files (>3 relative imports): ${report.fragmentedFiles}`);

    // Save detailed report
    if (!fs.existsSync('refactor-analysis')) {
      fs.mkdirSync('refactor-analysis');
    }

    fs.writeFileSync(
      'refactor-analysis/typescript-analysis.json',
      JSON.stringify({ report, files: this.files }, null, 2)
    );
  }

  private identifyConsolidationOpportunities() {
    console.log("\n🎯 Consolidation Opportunities:");

    // 1. Small files in the same directory
    const dirGroups = new Map<string, FileInfo[]>();
    
    for (const file of this.files.filter(f => f.lines < 80)) {
      const dir = path.dirname(file.path);
      if (!dirGroups.has(dir)) {
        dirGroups.set(dir, []);
      }
      dirGroups.get(dir)!.push(file);
    }

    const consolidationGroups: any[] = [];

    console.log("\n📁 Small files that could be consolidated by directory:");
    for (const [dir, files] of dirGroups) {
      if (files.length > 1) {
        const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
        if (totalLines < 300) { // Safe to consolidate
          console.log(`  ${dir}:`);
          files.forEach(f => {
            const name = path.basename(f.path);
            console.log(`    - ${name} (${f.lines} lines)`);
          });
          console.log(`    → Could merge into single file (~${totalLines} lines)\n`);
          
          consolidationGroups.push({
            type: 'directory-consolidation',
            directory: dir,
            files: files.map(f => f.path),
            totalLines,
            reason: 'Small files in same directory'
          });
        }
      }
    }

    // 2. Related components (similar names)
    console.log("🔗 Related components that might belong together:");
    const componentsByPattern = new Map<string, FileInfo[]>();
    
    for (const file of this.files.filter(f => f.isComponent)) {
      const basename = path.basename(file.path, path.extname(file.path));
      const pattern = basename.replace(/\d+$|Modal$|Form$|Card$|Item$/, '');
      
      if (pattern.length > 3) {
        if (!componentsByPattern.has(pattern)) {
          componentsByPattern.set(pattern, []);
        }
        componentsByPattern.get(pattern)!.push(file);
      }
    }

    for (const [pattern, files] of componentsByPattern) {
      if (files.length > 1) {
        const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
        console.log(`  ${pattern}* components:`);
        files.forEach(f => {
          const name = path.basename(f.path);
          console.log(`    - ${name} (${f.lines} lines)`);
        });
        console.log(`    → Could create ${pattern}/index.tsx module (~${totalLines} lines)\n`);
        
        consolidationGroups.push({
          type: 'component-family',
          pattern,
          files: files.map(f => f.path),
          totalLines,
          reason: 'Related components with similar names'
        });
      }
    }

    // 3. Fragmented files (lots of relative imports)
    const fragmented = this.files
      .filter(f => f.relativeImportCount > 4)
      .sort((a, b) => b.relativeImportCount - a.relativeImportCount);

    if (fragmented.length > 0) {
      console.log("⚠️  Heavily fragmented files (many relative imports):");
      fragmented.slice(0, 10).forEach(f => {
        const name = path.basename(f.path);
        console.log(`  - ${name} (${f.lines} lines, ${f.relativeImportCount} relative imports)`);
      });
      console.log("    → Consider consolidating with their dependencies\n");
    }

    // 4. Utility consolidation
    const utilities = this.files.filter(f => !f.hasJSX && f.exports.length > 0 && f.lines < 100);
    if (utilities.length > 3) {
      console.log("🔧 Utility functions that could be consolidated:");
      utilities.forEach(f => {
        const name = path.basename(f.path);
        console.log(`  - ${name} (${f.lines} lines, ${f.exports.length} exports)`);
      });
      console.log("    → Consider creating utils/index.ts\n");
      
      consolidationGroups.push({
        type: 'utility-consolidation',
        files: utilities.map(f => f.path),
        totalLines: utilities.reduce((sum, f) => sum + f.lines, 0),
        reason: 'Small utility files that could be combined'
      });
    }

    // Save consolidation plan
    fs.writeFileSync(
      'refactor-analysis/consolidation-opportunities.json',
      JSON.stringify(consolidationGroups, null, 2)
    );

    console.log("💡 Next steps:");
    console.log("  1. Review refactor-analysis/typescript-analysis.json for detailed file info");
    console.log("  2. Check refactor-analysis/consolidation-opportunities.json for merge suggestions");
    console.log("  3. Start with the smallest, safest consolidations first");
    console.log("  4. Test after each consolidation to ensure nothing breaks");
  }

  // Simple consolidation method (optional - uncomment to use)
  /*
  async consolidateGroup(group: any) {
    console.log(`🔧 Consolidating ${group.type}...`);
    
    if (group.files.length < 2) return;
    
    // Create consolidated content
    let consolidatedContent = '';
    const allImports = new Set<string>();
    
    for (const filePath of group.files) {
      const sourceFile = this.project.getSourceFile(filePath);
      if (!sourceFile) continue;
      
      // Collect imports
      sourceFile.getImportDeclarations().forEach(imp => {
        allImports.add(imp.getFullText().trim());
      });
      
      // Get content without imports
      const content = sourceFile.getFullText()
        .replace(/import.*?;[\r\n]*/g, '')
        .trim();
      
      if (content) {
        consolidatedContent += `\n// From ${path.basename(filePath)}\n${content}\n`;
      }
    }
    
    // Create new consolidated file
    const consolidatedPath = group.type === 'directory-consolidation' 
      ? `${group.directory}/consolidated.tsx`
      : `src/consolidated/${group.pattern || 'utilities'}.tsx`;
    
    const finalContent = Array.from(allImports).join('\n') + '\n' + consolidatedContent;
    
    // Ensure directory exists
    const dir = path.dirname(consolidatedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write consolidated file
    fs.writeFileSync(consolidatedPath, finalContent);
    console.log(`  ✅ Created ${consolidatedPath}`);
  }
  */
}

// Main execution
async function main() {
  console.log("🚀 Starting minimal TypeScript refactoring analysis...\n");
  
  const consolidator = new MinimalConsolidator();
  
  try {
    await consolidator.analyze();
    console.log("\n✅ Analysis complete!");
    console.log("\n📂 Check the refactor-analysis/ directory for detailed reports");
    
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    console.log("\n💡 Try installing ts-morph first:");
    console.log("   npm install --legacy-peer-deps ts-morph");
    console.log("   or: npx ts-morph-runner minimal-refactor.ts");
  }
}

if (require.main === module) {
  main();
}
