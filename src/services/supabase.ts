import { createClient } from '@supabase/supabase-js'
import { supabaseConfiguration, supabasePublicConfig } from './supabaseConfig'

export const supabase = supabaseConfiguration.configured
  ? createClient(supabasePublicConfig.url, supabasePublicConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null
