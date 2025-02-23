
import { createClient } from '@supabase/supabase-js';

// Access environment variables using the correct names provided by Lovable
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please ensure Supabase is properly connected in your Lovable project settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
