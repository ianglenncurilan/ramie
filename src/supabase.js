import { createClient } from '@supabase/supabase-js'

// These should be set in your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Export any additional Supabase utilities or custom functions here
export default {
  install: (app) => {
    app.config.globalProperties.$supabase = supabase
  }
}
