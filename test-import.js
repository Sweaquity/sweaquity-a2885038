#!/usr/bin/env node

console.log('🔧 Testing analyzer imports...');

const testDatabaseAnalysis = async () => {
  try {
    console.log('📊 Attempting to import database analyzer...');
    const module = await import('./project-health/morning-sync/supabase-analyzer.js');
    console.log('✅ Database analyzer imported successfully');
    console.log('   Exported functions:', Object.keys(module));
    
    if (module.runDatabaseAnalysis) {
      console.log('✅ runDatabaseAnalysis function found');
      return await module.runDatabaseAnalysis();
    } else {
      console.log('❌ runDatabaseAnalysis function NOT exported');
      return { success: false, error: 'Function not exported' };
    }
  } catch (error) {
    console.log('❌ Database analyzer import failed:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
};

const testStorageAnalysis = async () => {
  try {
    console.log('💾 Attempting to import storage analyzer...');
    const module = await import('./project-health/morning-sync/storage-analyzer.js');
    console.log('✅ Storage analyzer imported successfully');
    console.log('   Exported functions:', Object.keys(module));
    
    if (module.runEnhancedStorageAnalysis) {
      console.log('✅ runEnhancedStorageAnalysis function found');
      return await module.runEnhancedStorageAnalysis();
    } else {
      console.log('❌ runEnhancedStorageAnalysis function NOT exported');
      return { success: false, error: 'Function not exported' };
    }
  } catch (error) {
    console.log('❌ Storage analyzer import failed:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
};

// Run tests
(async () => {
  const dbResult = await testDatabaseAnalysis();
  console.log('\n📊 Database test result:', dbResult.success ? 'SUCCESS' : 'FAILED');
  
  const storageResult = await testStorageAnalysis();
  console.log('💾 Storage test result:', storageResult.success ? 'SUCCESS' : 'FAILED');
})();
