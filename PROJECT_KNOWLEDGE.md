
# 🔄 PROJECT KNOWLEDGE UPDATE
*Last updated: 2025-07-29T01:34:59.252Z*

## 📊 Current Project Health

### Frontend Status
- **Total Files Analyzed**: Unknown
- **Routes Mapped**: Unknown
- **Critical Issues**: 0
- **Dead Ends**: 0
- **Code Smells**: 0
- **Unreachable Code**: 0

### Backend Status
- **Database Analysis**: ✅ Available
- **RLS Policies**: Check database-analysis.json for details
- **Functions & Triggers**: Mapped in analysis output

## 🚨 Today's Priorities

No critical priorities identified

## 🔧 Recommended Actions


### Database: Execute database queries in Supabase SQL editor
*Get current RLS policies and function status*


### Testing: Run npm run build to verify no TypeScript errors
*Ensure code changes haven't broken build*


### Git: Check git status and pull latest changes
*Stay synchronized with remote repository*


## 📋 Critical Issues Requiring Attention

✅ No critical issues found

## 🗄️ Database Analysis Queries

To get current database status, run these queries in Supabase SQL editor:


### TABLES
```sql

      SELECT 
        t.table_name,
        t.table_type,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    
```


### POLICIES
```sql

      SELECT 
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies
      ORDER BY tablename, policyname;
    
```


### FUNCTIONS
```sql

      SELECT 
        routine_name,
        routine_type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    
```


### TRIGGERS
```sql

      SELECT 
        event_object_table as table_name,
        trigger_name,
        event_manipulation,
        action_timing
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    
```


### CONTRACTWORKFLOW
```sql

      SELECT 
        ja.status as application_status,
        ja.nda_status,
        COUNT(*) as count,
        COUNT(CASE WHEN ja.nda_document_id IS NOT NULL THEN 1 END) as has_nda_document
      FROM job_applications ja
      WHERE ja.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY ja.status, ja.nda_status
      ORDER BY count DESC;
    
```


### STORAGEBUCKETS
```sql

      SELECT 
        name,
        public,
        file_size_limit,
        allowed_mime_types
      FROM storage.buckets
      ORDER BY name;
    
```


## 🎯 Quick Start Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Test build process  
npm run lint                   # Check code style

# Analysis  
node daily-health-check.js     # Run this health check
node analyze-codebase.cjs      # Detailed code analysis

# Git
git status                     # Check current changes
git pull origin main           # Get latest updates
```

---
*This knowledge update was auto-generated. Files analyzed: Unknown*
