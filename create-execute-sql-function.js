#!/usr/bin/env node

/**
 * Create the missing execute_sql function in Supabase
 * This should be run once to fix the "execute_sql function not found" error
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
        console.warn('⚠️  Could not load .env file:', error.message);
    }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wjpunccqxowctouvhwis.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required to create functions');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQL to create the execute_sql function
const createExecuteSQLFunction = `
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS TABLE(result json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_result json;
    rec record;
    results json[] := '{}';
BEGIN
    -- Security check: only allow SELECT statements for safety
    IF NOT (trim(upper(sql_query)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed for security reasons';
    END IF;
    
    -- Execute the query and return results as JSON
    FOR rec IN EXECUTE sql_query LOOP
        results := array_append(results, row_to_json(rec));
    END LOOP;
    
    -- Return the results
    RETURN QUERY SELECT array_to_json(results)::json;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error as JSON
        RETURN QUERY SELECT json_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        )::json;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;

-- Create a simpler version that returns text (for compatibility)
CREATE OR REPLACE FUNCTION public.execute_sql_simple(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_count integer;
    query_result text;
BEGIN
    -- Security check: only allow SELECT statements
    IF NOT (trim(upper(sql_query)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed for security reasons';
    END IF;
    
    -- Execute the query and get row count
    EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') AS subq' INTO result_count;
    
    RETURN 'Query executed successfully. Rows returned: ' || result_count::text;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant permissions for the simple version too
GRANT EXECUTE ON FUNCTION public.execute_sql_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql_simple(text) TO service_role;
`;

async function createFunction() {
    console.log('🔧 Creating execute_sql function in Supabase...');
    
    try {
        // Execute the SQL to create the function
        const { data, error } = await supabase.rpc('exec', { 
            sql: createExecuteSQLFunction 
        });
        
        if (error) {
            // Try alternative approach using direct SQL execution
            console.log('⚠️ RPC approach failed, trying direct SQL execution...');
            
            // Split the SQL into individual statements
            const statements = createExecuteSQLFunction
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);
            
            for (const statement of statements) {
                if (statement.trim()) {
                    console.log(`Executing: ${statement.substring(0, 50)}...`);
                    
                    const { error: stmtError } = await supabase
                        .from('__dummy__') // This will fail but might execute the SQL
                        .select('*')
                        .eq('sql', statement);
                    
                    // Ignore errors from dummy table, we're just trying to execute SQL
                }
            }
        }
        
        console.log('✅ Function creation attempted');
        
        // Test the function
        console.log('🧪 Testing the execute_sql function...');
        
        const { data: testData, error: testError } = await supabase
            .rpc('execute_sql', { 
                sql_query: 'SELECT 1 as test_value, NOW() as test_time' 
            });
        
        if (testError) {
            console.log('❌ Function test failed:', testError.message);
            console.log('🔄 Trying alternative creation method...');
            
            // Alternative: Create function using database SQL editor
            console.log(`
📝 MANUAL CREATION REQUIRED:
    
Please run this SQL in your Supabase SQL Editor:

${createExecuteSQLFunction}

Then test with:
SELECT * FROM execute_sql('SELECT 1 as test_value, NOW() as test_time');
            `);
            
        } else {
            console.log('✅ Function created and tested successfully!');
            console.log('Test result:', testData);
        }
        
    } catch (error) {
        console.error('❌ Error creating function:', error.message);
        
        console.log(`
📝 MANUAL CREATION REQUIRED:
        
Please run this SQL manually in your Supabase SQL Editor:

${createExecuteSQLFunction}
        `);
    }
}

async function testExistingFunction() {
    console.log('🔍 Testing if execute_sql function already exists...');
    
    try {
        const { data, error } = await supabase
            .rpc('execute_sql', { 
                sql_query: 'SELECT 1 as test_value' 
            });
        
        if (error) {
            console.log('❌ Function does not exist or failed:', error.message);
            return false;
        } else {
            console.log('✅ Function already exists and works!');
            console.log('Test result:', data);
            return true;
        }
    } catch (error) {
        console.log('❌ Function test failed:', error.message);
        return false;
    }
}

// Main execution
async function main() {
    console.log('🚀 Execute SQL Function Setup');
    console.log('================================');
    
    // First test if function already exists
    const functionExists = await testExistingFunction();
    
    if (!functionExists) {
        await createFunction();
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test your daily-health-check.js: node daily-health-check.js');
    console.log('2. Check if the execute_sql error is resolved');
    console.log('3. If still failing, run the SQL manually in Supabase SQL Editor');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}