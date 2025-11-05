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

// Expose config presence so UI can guard actions
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

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

// Simple role helpers (no local overrides, rely on Supabase metadata only)

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
    const user = await getCurrentUser()
    if (!user) {
      console.log('isAdmin: No user found')
      return false
    }

    console.log('isAdmin: Checking admin status for user:', user.email)
    console.log('isAdmin: app_metadata:', user.app_metadata)
    console.log('isAdmin: user_metadata:', user.user_metadata)

    // Check app_metadata first (most secure, set by Supabase admin)
    const appMeta = user.app_metadata || {}
    const userMeta = user.user_metadata || {}

    // Check multiple possible admin flag locations
    const adminFlags = [
      appMeta.is_admin,
      appMeta.isAdmin,
      appMeta.role === 'admin',
      appMeta.role === 'administrator',
      userMeta.is_admin,
      userMeta.isAdmin,
      userMeta.role === 'admin',
      userMeta.role === 'administrator',
    ]

    // Check if any flag indicates admin status
    for (const flag of adminFlags) {
      if (flag === true || flag === 1 || flag === '1' || String(flag).toLowerCase() === 'true') {
        console.log('isAdmin: User is admin (flag found:', flag, ')')
        return true
      }
    }

    // Check if user has admin role in raw metadata
    const rawRole = appMeta.role || userMeta.role
    if (rawRole && String(rawRole).toLowerCase().includes('admin')) {
      console.log('isAdmin: User is admin (role:', rawRole, ')')
      return true
    }

    console.log('isAdmin: User is NOT admin')
    return false
  } catch (error) {
    console.error('Error in isAdmin:', error)
    return false
  }
}
