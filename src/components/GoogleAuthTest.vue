<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase.js'
import { useAlertModal } from '@/composables/useAlertModal.js'

const { showSuccess, showError, showInfo } = useAlertModal()
const user = ref(null)
const loading = ref(false)

onMounted(async () => {
  // Check if user is already logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      user.value = session.user
      showSuccess('Successfully signed in with Google!', 'Authentication Success')
    } else if (event === 'SIGNED_OUT') {
      user.value = null
      showInfo('You have been signed out.', 'Signed Out')
    }
  })
})

const signInWithGoogle = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      console.error('Google auth error:', error)
      showError('Google authentication failed. Please try again.', 'Authentication Error')
    } else {
      console.log('Google auth initiated:', data)
      showInfo('Redirecting to Google for authentication...', 'Google Sign-In')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    showError('An unexpected error occurred.', 'System Error')
  } finally {
    loading.value = false
  }
}

const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      showError('Failed to sign out. Please try again.', 'Sign Out Error')
    }
  } catch (err) {
    console.error('Sign out error:', err)
    showError('An unexpected error occurred during sign out.', 'System Error')
  }
}
</script>

<template>
  <div class="auth-test">
    <h2>Google Authentication Test</h2>

    <div v-if="!user" class="auth-section">
      <p>Click the button below to test Google authentication:</p>
      <button @click="signInWithGoogle" class="google-btn" :disabled="loading">
        <i class="mdi mdi-google"></i>
        <span>{{ loading ? 'Signing in...' : 'Sign in with Google' }}</span>
      </button>
    </div>

    <div v-else class="user-section">
      <h3>Welcome, {{ user.user_metadata?.full_name || user.email }}!</h3>
      <div class="user-info">
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Provider:</strong> {{ user.app_metadata?.provider || 'Unknown' }}</p>
        <p><strong>User ID:</strong> {{ user.id }}</p>
        <p><strong>Created:</strong> {{ new Date(user.created_at).toLocaleDateString() }}</p>
      </div>
      <button @click="signOut" class="sign-out-btn">Sign Out</button>
    </div>
  </div>
</template>

<style scoped>
.auth-test {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.auth-section {
  text-align: center;
}

.user-section {
  text-align: left;
}

.user-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.user-info p {
  margin: 8px 0;
  font-size: 14px;
}

.google-btn {
  width: 100%;
  max-width: 280px;
  height: 45px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
}

.google-btn:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.google-btn i {
  font-size: 18px;
  color: #4285f4;
}

.sign-out-btn {
  width: 100%;
  padding: 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sign-out-btn:hover {
  background: #c82333;
}
</style>
