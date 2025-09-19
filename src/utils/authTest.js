// Google Authentication Test Utility
import { supabase } from '@/services/supabase.js'

export const testGoogleAuth = async () => {
  console.log('🔍 Testing Google Authentication Setup...')

  try {
    // Test 1: Check Supabase connection
    console.log('1. Testing Supabase connection...')
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Supabase connection failed:', sessionError)
      return false
    }
    console.log('✅ Supabase connection successful')

    // Test 2: Check if Google provider is configured
    console.log('2. Testing Google OAuth configuration...')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      console.error('❌ Google OAuth configuration error:', error)
      console.log('💡 Make sure you have:')
      console.log('   - Enabled Google provider in Supabase dashboard')
      console.log('   - Added correct redirect URLs')
      console.log('   - Configured Google Cloud Console OAuth credentials')
      return false
    }

    console.log('✅ Google OAuth configuration successful')
    console.log('🚀 Google authentication is ready to use!')
    return true
  } catch (err) {
    console.error('❌ Unexpected error during auth test:', err)
    return false
  }
}

export const checkAuthStatus = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    isAuthenticated: !!session,
    user: session?.user || null,
    provider: session?.user?.app_metadata?.provider || null,
  }
}

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error)
    return false
  }
  console.log('✅ User signed out successfully')
  return true
}

// Auto-run test when imported (for development)
if (import.meta.env.DEV) {
  console.log('🧪 Running Google Auth Test...')
  testGoogleAuth()
}
