import { createClient } from '@supabase/supabase-js'

// Check if environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set!')
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)

// Define and export formActionDefault
export const formActionDefault = {
  formProcess: false,
  formStatus: 200,
  formErrorMessage: '',
  formSuccessMessage: '',
}

export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error.message)
      return false
    }

    return !!data.session
  } catch (error) {
    console.error('Error in isAuthenticated:', error)
    return false
  }
}

// Simple role helpers
let localIsAdminOverride = null

export const setLocalAdminOverride = (value) => {
  localIsAdminOverride = typeof value === 'boolean' ? value : null
}

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return data?.user || null
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export const isAdmin = async () => {
  try {
    if (localIsAdminOverride !== null) return localIsAdminOverride
    const user = await getCurrentUser()
    if (!user) return false
    // Prefer a custom claim in app_metadata or user_metadata
    const meta = user.app_metadata || user.user_metadata || {}
    return !!(meta.is_admin || meta.isAdmin)
  } catch (error) {
    console.error('Error in isAdmin:', error)
    return false
  }
}
