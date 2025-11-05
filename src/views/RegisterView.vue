<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
  alphaValidator,
} from '../utils/validators'
import AlertNotification from '@/components/layout/commons/AlertNotification.vue'
import AlertModal from '@/components/layout/commons/AlertModal.vue'
import { useAlertModal } from '@/composables/useAlertModal.js'
import { supabase, formActionDefault, isAdmin, hasSupabaseConfig } from '@/services/supabase.js'

const router = useRouter()

// Alert modal composable
const { showAlert, alertConfig, showSuccess, showError, showWarning, showInfo, hideAlert } =
  useAlertModal()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errors = ref({ name: '', email: '', password: '', confirmPassword: '' })
const activeTab = ref('register')

// New functionality for enhanced registration
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

function togglePasswordVisibility(field) {
  if (field === 'password') {
    showPassword.value = !showPassword.value
  } else if (field === 'passwordConfirmation') {
    showPasswordConfirmation.value = !showPasswordConfirmation.value
  }
}

const formDataDefault = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const formData = ref({
  ...formDataDefault.value,
})

const formAction = ref({
  ...formActionDefault,
})

const refVform = ref(null) // Define the form reference

const validate = () => {
  let valid = true
  errors.value = { name: '', email: '', password: '', confirmPassword: '' }

  // Validate first name
  const firstNameError =
    requiredValidator(formData.value.firstname) || alphaValidator(formData.value.firstname)
  if (firstNameError !== true) {
    errors.value.name = firstNameError
    valid = false
  }

  // Validate last name
  const lastNameError =
    requiredValidator(formData.value.lastname) || alphaValidator(formData.value.lastname)
  if (lastNameError !== true) {
    errors.value.name = lastNameError
    valid = false
  }

  // Validate email
  const emailError = requiredValidator(formData.value.email) || emailValidator(formData.value.email)
  if (emailError !== true) {
    errors.value.email = emailError
    valid = false
  }

  // Validate password
  const passwordError =
    requiredValidator(formData.value.password) || passwordValidator(formData.value.password)
  if (passwordError !== true) {
    errors.value.password = passwordError
    valid = false
  }

  // Validate confirm password
  const confirmError =
    requiredValidator(formData.value.password_confirmation) ||
    confirmedValidator(formData.value.password_confirmation, formData.value.password)
  if (confirmError !== true) {
    errors.value.confirmPassword = confirmError
    valid = false
  }

  return valid
}

const handleRegister = async () => {
  if (!hasSupabaseConfig) {
    showError(
      'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file and restart the app.',
      'Configuration Missing',
    )
    return
  }
  if (!validate()) return

  formAction.value = {
    ...formActionDefault,
  }
  formAction.value.formProcess = true

  try {
    // Combine first and last name for full name
    const fullName = `${formData.value.firstname} ${formData.value.lastname}`.trim()

    // 1. First create the user in the public.users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: formData.value.email,
          first_name: formData.value.firstname,
          last_name: formData.value.lastname,
          full_name: fullName,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (userError) {
      console.error('Error creating user profile:', userError)
      throw new Error(userError.message || 'Failed to create user profile')
    }

    // 2. Then create the auth user
    const { data, error } = await supabase.auth.signUp({
      email: formData.value.email,
      password: formData.value.password,
      options: {
        data: {
          first_name: formData.value.firstname,
          last_name: formData.value.lastname,
          full_name: fullName,
          role: 'admin',
          user_metadata: {
            // Add user_metadata explicitly
            first_name: formData.value.firstname,
            last_name: formData.value.lastname,
            full_name: fullName,
            role: 'admin',
          },
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) {
      console.error('Auth error:', error)
      // Try to clean up the user record if auth fails
      await supabase.from('users').delete().eq('email', formData.value.email)

      throw new Error(error.message || 'Failed to create authentication account')
    }

    if (data?.user) {
      // Update the user record with the auth ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: data.user.id })
        .eq('email', formData.value.email)

      if (updateError) {
        console.error('Error updating user with auth ID:', updateError)
        throw new Error('Failed to complete user registration')
      }

      console.log('User registration successful:', data)
      showSuccess(
        'Account created successfully! Please check your email to verify your account.',
        'Registration Successful',
        {
          autoClose: true,
          autoCloseDelay: 5000,
        },
      )

      // Reset form data
      Object.assign(formData.value, formDataDefault.value)

      // Redirect to login after showing success message
      setTimeout(() => {
        router.replace({ name: 'login' })
      }, 5000)
    }
  } catch (err) {
    console.error('Registration error:', err)
    showError(
      err.message || 'An unexpected error occurred. Please try again.',
      'Registration Error',
    )
  } finally {
    formAction.value.formProcess = false
  }
}

// Admin-specific logic
const isAdminUser = ref(false)

const checkAdminStatus = async () => {
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes?.user
  if (user) {
    const { data, error } = await supabase
      .from('users')
      .select('isAdmin')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      isAdminUser.value = false
    } else {
      isAdminUser.value = data?.isAdmin || false
    }
  } else {
    isAdminUser.value = false
  }
}

checkAdminStatus()

const handleAdminAction = () => {
  // Placeholder for admin-specific action
  showSuccess('Admin action performed successfully!', 'Success')
}
</script>

<template>
  <div class="login-page">
    <!-- Login Card -->
    <div class="card">
      <!-- Logo -->
      <div class="logo">
        <img src="/favicon.ico" alt="Logo" />
        <h1>RAMIE</h1>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'login' }" @click="setActiveTab('login')">
          Login
        </button>
        <button :class="{ active: activeTab === 'register' }" @click="setActiveTab('register')">
          Register
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="form register-form">
        <div class="input-group1">
          <i class="mdi mdi-account-outline"></i>
          <input v-model="formData.firstname" type="text" placeholder="First Name" />
          <p v-if="errors.name" class="err">{{ errors.name }}</p>
        </div>
        <div class="input-group1">
          <i class="mdi mdi-account-outline"></i>
          <input v-model="formData.lastname" type="text" placeholder="Last Name" />
          <p v-if="errors.name" class="err">{{ errors.name }}</p>
        </div>
        <div class="input-group1">
          <i class="mdi mdi-email-outline"></i>
          <input v-model="formData.email" type="email" placeholder="Email Address" />
          <p v-if="errors.email" class="err">{{ errors.email }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
          />
          <i
            :class="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            class="password-toggle"
            @click="togglePasswordVisibility('password')"
          ></i>
          <p v-if="errors.password" class="err">{{ errors.password }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input
            v-model="formData.password_confirmation"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            placeholder="Confirm Password"
          />
          <i
            :class="showPasswordConfirmation ? 'mdi-eye' : 'mdi-eye-off'"
            class="password-toggle"
            @click="togglePasswordVisibility('passwordConfirmation')"
          ></i>
          <p v-if="errors.confirmPassword" class="err">{{ errors.confirmPassword }}</p>
        </div>

        <button
          type="submit"
          class="login-btn mt-0"
          :disabled="formAction.formProcess || !hasSupabaseConfig"
        >
          Register
        </button>
      </form>

      <!-- Alert Notifications -->
      <div class="alert-container">
        <AlertNotification
          :formSuccessMessage="formAction.formSuccessMessage"
          :formErrorMessage="formAction.formErrorMessage"
        />
      </div>

      <!-- Divider -->
      <div class="divider">
        <span>or register with</span>
      </div>

      <!-- Google Sign Up Button -->
      <div class="google-signin">
        <button @click="handleGoogleLogin" class="google-btn" :disabled="formAction.formProcess">
          <i class="mdi mdi-google"></i>
          <span>{{ formAction.formProcess ? 'Signing up...' : 'Sign up with Google' }}</span>
        </button>
      </div>
    </div>

    <!-- Alert Modal -->
    <AlertModal
      :show="showAlert"
      :type="alertConfig.type"
      :title="alertConfig.title"
      :message="alertConfig.message"
      :showCloseButton="alertConfig.showCloseButton"
      :autoClose="alertConfig.autoClose"
      :autoCloseDelay="alertConfig.autoCloseDelay"
      @close="hideAlert"
    />

    <!-- Admin Dashboard (conditionally rendered) -->
    <div v-if="isAdminUser">
      <!-- Admin-specific content -->
      <h1>Admin Dashboard</h1>
      <button @click="handleAdminAction">Perform Admin Action</button>
    </div>
    <div v-else>
      <p>You do not have access to this feature.</p>
    </div>
  </div>
</template>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
}

.card {
  width: 100%;
  max-width: 340px;
  background: #fff;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.15);
}

.logo {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo img {
  width: 50px;
  height: 50px;
  margin-bottom: 0.5rem;
}

.logo h1 {
  font-size: 22px;
  font-weight: bold;
  color: #2c7a4b;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1.5rem;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 24px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.tabs button {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  background: transparent;
  color: #2c7a4b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  white-space: nowrap;
  min-width: 80px;
}

.tabs button.active {
  background: #2c7a4b;
  color: #fff;
  box-shadow: 0px 3px 8px rgba(44, 122, 75, 0.4);
}

.tabs button:hover:not(.active) {
  background: #e8f5e8;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group1 {
  position: relative;
}

.input-group1 i {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #777;
}

.input-group2 {
  position: relative;
}

.input-group2 i {
  position: absolute;
  top: 35%;
  left: 10px;
  transform: translateY(-50%);
  color: #777;
}

.form input {
  width: 100%;
  padding: 12px 15px;
  padding-left: 40px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
}

.form input:focus {
  border-color: #2c7a4b;
}

.forgot {
  text-align: right;
  font-size: 12px;
  color: #777;
  margin-top: 12px;
  cursor: pointer;
}

.forgot:hover {
  text-decoration: underline;
}

.login-btn {
  margin-top: 6px;
  width: 100%;
  padding: 12px;
  background: #2c7a4b;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}

.login-btn:hover {
  background: #256c3c;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #666;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ccc;
}

.divider span {
  margin: 0 10px;
}

.google-signin {
  display: flex;
  justify-content: center;
  margin-top: 10px;
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
.err {
  color: #cc0000;
  font-size: 12px;
  margin-top: 6px;
}

.alert-container {
  margin: 15px 0;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  color: #777;
  cursor: pointer;
  font-size: 18px;
  z-index: 1;
}

.password-toggle:hover {
  color: #2c7a4b;
}

/* tighten vertical spacing only for register form */
.form.register-form {
  gap: 8px; /* reduce spacing between form rows */
}

/* remove any extra bottom margin on the last input group */
.form.register-form .input-group2:last-of-type,
.form.register-form .input-group1:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
}

/* nudge the button closer but avoid overlap */
.form.register-form .login-btn {
  margin-top: 4px; /* small gap between confirm input and button */
}

/* reduce space for inline error messages so they don't push the button down */
.form.register-form .err {
  margin-top: 4px;
  margin-bottom: 0;
  font-size: 12px;
}

/* Optional alternative: use transform rather than margin for subtle lift */
/* .form.register-form .login-btn { transform: translateY(-3px); } */
</style>
