import { ref, computed } from 'vue'
import { isAdmin, isAuthenticated } from '@/services/supabase'

// Reactive state for admin status
const adminStatus = ref(false)
const authStatus = ref(false)
const isLoading = ref(true)
const isInitialized = ref(false)

// Function to check and update admin status
export const checkAdminStatus = async () => {
  try {
    isLoading.value = true
    console.log('Checking admin status...')

    authStatus.value = await isAuthenticated()
    console.log('Auth status:', authStatus.value)

    if (authStatus.value) {
      adminStatus.value = await isAdmin()
      console.log('Admin status:', adminStatus.value)
    } else {
      adminStatus.value = false
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    adminStatus.value = false
    authStatus.value = false
  } finally {
    isLoading.value = false
    isInitialized.value = true
  }
}

// Computed properties
export const isUserAdmin = computed(() => {
  if (!isInitialized.value) return false
  return adminStatus.value === true
})

export const isUserAuthenticated = computed(() => {
  if (!isInitialized.value) return false
  return authStatus.value === true
})

// Function to reset status (useful for logout)
export const resetAuthStatus = () => {
  adminStatus.value = false
  authStatus.value = false
  isLoading.value = true
  isInitialized.value = false
}

// Export the main composable function
export const useAuth = () => {
  return {
    isUserAdmin,
    isUserAuthenticated,
    isLoading,
    isInitialized,
    checkAdminStatus,
    resetAuthStatus,
  }
}

// Initialize after a short delay to ensure app is ready
setTimeout(() => {
  checkAdminStatus()
}, 500)
