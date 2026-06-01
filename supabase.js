import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Tek bir instance oluşturup tüm projeye bunu dağıtacağız
export const supabase = createClient(supabaseUrl, supabaseAnonKey);