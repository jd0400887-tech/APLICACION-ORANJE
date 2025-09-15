import { createClient } from '@supabase/supabase-js';

// Obtén tu URL y clave anónima de Supabase desde la configuración de tu proyecto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
