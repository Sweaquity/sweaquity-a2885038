
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjpunccqxowctouvhwis.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcHVuY2NxeG93Y3RvdXZod2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTE4OTUsImV4cCI6MjA1NTkyNzg5NX0.S45KnNTr4RKI8UyeLTUTws4zkqUin-DUYFI2u7Ook04';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
