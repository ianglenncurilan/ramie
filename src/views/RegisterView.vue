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

// Form state
const errors = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  password_confirmation: '',
})
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

// Form data
const formDataDefault = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  password_confirmation: '',
}

const formData = ref({ ...formDataDefault })

const formAction = ref({
  ...formActionDefault,
})

const refVform = ref(null)

// Navigation to login page
const navigateToLogin = () => {
  router.replace({ name: 'login' })
}

// Toggle password visibility
function togglePasswordVisibility(field) {
  if (field === 'password') {
    showPassword.value = !showPassword.value
  } else if (field === 'passwordConfirmation') {
    showPasswordConfirmation.value = !showPasswordConfirmation.value
  }
}

// Clear specific error when user starts typing
const clearErrors = (field) => {
  if (field in errors.value) {
    errors.value[field] = ''
  }
}

const validate = () => {
  let valid = true
  errors.value = { firstname: '', lastname: '', email: '', password: '', password_confirmation: '' }

  // Validate first name
  if (!formData.value.firstname) {
    errors.value.firstname = 'First name is required'
    valid = false
  } else if (!/^[A-Za-z\s-]+$/.test(formData.value.firstname)) {
    errors.value.firstname = 'First name can only contain letters, spaces, and hyphens'
    valid = false
  } else if (formData.value.firstname.length < 2) {
    errors.value.firstname = 'First name is too short (minimum 2 characters)'
    valid = false
  } else if (formData.value.firstname.length > 50) {
    errors.value.firstname = 'First name is too long (maximum 50 characters)'
    valid = false
  }

  // Validate last name
  if (!formData.value.lastname) {
    errors.value.lastname = 'Last name is required'
    valid = false
  } else if (!/^[A-Za-z\s-]+$/.test(formData.value.lastname)) {
    errors.value.lastname = 'Last name can only contain letters, spaces, and hyphens'
    valid = false
  } else if (formData.value.lastname.length < 2) {
    errors.value.lastname = 'Last name is too short (minimum 2 characters)'
    valid = false
  } else if (formData.value.lastname.length > 50) {
    errors.value.lastname = 'Last name is too long (maximum 50 characters)'
    valid = false
  }

  // Validate email
  if (!formData.value.email) {
    errors.value.email = 'Email is required'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    valid = false
  } else if (formData.value.email.length > 100) {
    errors.value.email = 'Email is too long (maximum 100 characters)'
    valid = false
  }

  // Validate password
  if (!formData.value.password) {
    errors.value.password = 'Password is required'
    valid = false
  } else if (formData.value.password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters long'
    valid = false
  } else if (!/(?=.*[a-z])/.test(formData.value.password)) {
    errors.value.password = 'Password must contain at least one lowercase letter'
    valid = false
  } else if (!/(?=.*[A-Z])/.test(formData.value.password)) {
    errors.value.password = 'Password must contain at least one uppercase letter'
    valid = false
  } else if (!/(?=.*\d)/.test(formData.value.password)) {
    errors.value.password = 'Password must contain at least one number'
    valid = false
  } else if (formData.value.password.length > 100) {
    errors.value.password = 'Password is too long (maximum 100 characters)'
    valid = false
  }
  if (passwordError !== true) {
    errors.value.password = passwordError
    valid = false
  }

  // Validate confirm password
  const confirmError =
    requiredValidator(formData.value.password_confirmation) ||
    confirmedValidator(formData.value.password_confirmation, formData.value.password)
  if (confirmError !== true) {
    errors.value.password_confirmation = confirmError
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
    formProcess: true,
  }

  try {
    const fullName = `${formData.value.firstname} ${formData.value.lastname}`.trim()

    // First, sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.value.email,
      password: formData.value.password,
      options: {
        data: {
          first_name: formData.value.firstname,
          last_name: formData.value.lastname,
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) throw error

    // If user is created successfully
    if (data?.user) {
      try {
        // Insert user data into the users table
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: formData.value.email,
            first_name: formData.value.firstname,
            last_name: formData.value.lastname,
            full_name: fullName,
            is_admin: false, // Default to non-admin
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: '', // Default empty phone
            address: '', // Default empty address
            profile_picture: null, // Default no profile picture
            status: 'active', // Default status
          })
          .select()
          .single()

        if (userError) {
          console.error('Error saving user data:', userError)
          throw new Error('Failed to create user profile. Please contact support.')
        }
      } catch (profileSaveError) {
        console.error('Error saving user profile:', profileSaveError)
        // Don't fail the registration if profile save fails, but log it
      }

      showSuccess(
        'Account created successfully! Please check your email to verify your account.',
        'Registration Successful',
        {
          autoClose: true,
          autoCloseDelay: 5000,
        },
      )

      // Reset form
      formData.value = { ...formDataDefault }

      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace({ name: 'login' })
      }, 3000)
    }
  } catch (error) {
    console.error('Registration error:', error)

    // More user-friendly error messages
    let errorMessage = 'An error occurred during registration. Please try again.'

    if (error.message.includes('already registered')) {
      errorMessage = 'This email is already registered. Please try logging in instead.'
    } else if (error.message.includes('password')) {
      errorMessage = 'Password does not meet requirements. It must be at least 6 characters long.'
    } else if (error.message.includes('email')) {
      errorMessage = 'Please enter a valid email address.'
    } else if (error.message.includes('profile')) {
      errorMessage =
        'Your account was created, but we had trouble setting up your profile. Please contact support.'
    }

    showError(errorMessage, 'Registration Failed')
  } finally {
    formAction.value.formProcess = false
  }
}
</script>

<template>
  <div class="register-page">
    <!-- Register Card -->
    <div class="card">
      <!-- Logo -->
      <div class="logo">
        <img src="/leaf.png" alt="Logo" />
        <h1>RAMIE</h1>
      </div>

      <div class="back-to-login">
        <a href="#" @click.prevent="navigateToLogin">
          <i class="mdi mdi-arrow-left"></i> Back to Login
        </a>
      </div>

      <h2>Create an Account</h2>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="name-row">
          <div class="form-group">
            <label>First Name</label>
            <div class="input-group">
              <i class="mdi mdi-account-outline"></i>
              <input
                v-model="formData.firstname"
                type="text"
                placeholder="Enter your first name"
                @input="clearErrors('firstname')"
                :class="{ error: errors.firstname }"
              />
            </div>
            <span v-if="errors.firstname" class="error-message">{{ errors.firstname }}</span>
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <div class="input-group">
              <i class="mdi mdi-account-outline"></i>
              <input
                v-model="formData.lastname"
                type="text"
                placeholder="Enter your last name"
                @input="clearErrors('lastname')"
                :class="{ error: errors.lastname }"
              />
            </div>
            <span v-if="errors.lastname" class="error-message">{{ errors.lastname }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Email</label>
          <div class="input-group">
            <i class="mdi mdi-email-outline"></i>
            <input
              v-model="formData.email"
              type="email"
              placeholder="Enter your email"
              @input="clearErrors('email')"
              :class="{ error: errors.email }"
            />
          </div>
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-group">
            <i class="mdi mdi-lock-outline"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="formData.password"
              placeholder="Create a password"
              @input="clearErrors('password')"
              :class="{ error: errors.password }"
            />
            <i
              class="mdi"
              :class="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click="togglePasswordVisibility('password')"
            ></i>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <div class="input-group">
            <i class="mdi mdi-lock-outline"></i>
            <input
              :type="showPasswordConfirmation ? 'text' : 'password'"
              v-model="formData.password_confirmation"
              placeholder="Confirm your password"
              @input="clearErrors('password_confirmation')"
              :class="{ error: errors.password_confirmation }"
            />
            <i
              class="mdi"
              :class="showPasswordConfirmation ? 'mdi-eye-off' : 'mdi-eye'"
              @click="togglePasswordVisibility('passwordConfirmation')"
            ></i>
          </div>
          <span v-if="errors.password_confirmation" class="error-message">{{
            errors.password_confirmation
          }}</span>
        </div>

        <!-- Alert Notifications -->
        <div class="alert-container">
          <AlertNotification
            :formSuccessMessage="formAction.formSuccessMessage"
            :formErrorMessage="formAction.formErrorMessage"
          />
        </div>

        <button type="submit" class="btn" :disabled="formAction.formProcess">
          {{ formAction.formProcess ? 'Creating Account...' : 'Create Account' }}
        </button>

        <p class="login-link">
          Already have an account?
          <a href="#" @click.prevent="navigateToLogin">Sign in</a>
        </p>
      </form>
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
  </div>
</template>

<style scoped>
:root {
  --primary: #46e57e;
  --primary-hover: #3bc96d;
  --primary-light: #e8f9f0;
  --text: #2c7a4b; /* changed to dark green for all text */
  --text-light: rgba(44, 122, 75, 0.75); /* lighter green variant */
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --border: #cbd5e1;
  --border-strong: rgba(44, 122, 75, 0.95);
  --error: #ef4444;
  --shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  --pill-bg: rgba(44, 122, 75, 0.06);
}

/* Base/Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Quicksand', sans-serif;
  color: var(--text);
}

/* Page background same treatment as login */
.register-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #87ceeb 0%, #98fb98 50%, #90ee90 100%);
  background-image: url('/pig.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow-x: hidden;
}

.register-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(135, 206, 235, 0.18) 0%,
    rgba(152, 251, 152, 0.28) 50%,
    rgba(144, 238, 144, 0.16) 100%
  );
  z-index: 1;
}
.register-page::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.06) 100%);
  z-index: 1;
}

/* Card - mirror login style but with stronger border */
.card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  background: #ffffff; /* force solid white card background */
  padding: 2rem;
  border-radius: 20px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.2); /* soften border */
  animation: fadeIn 0.36s ease-out forwards;
}

/* Logo / heading */
.logo {
  text-align: center;
  margin-bottom: 2rem; /* Increased margin for better spacing */
}

.logo img {
  width: 88px; /* Increased from 64px */
  height: 88px; /* Increased from 64px */
  border-radius: 16px; /* Slightly larger radius */
  padding: 12px; /* Slightly more padding */
  background: var(--primary-light);
  margin: 0 auto 1rem; /* Increased bottom margin */
  display: block;
}

.logo h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2c7a4b;
  letter-spacing: -0.4px;
}

/* Back link */
.back-to-login {
  margin-bottom: 1rem;
}
.back-to-login a {
  color: #475569;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.back-to-login a:hover {
  color: var(--primary-hover);
}

/* Title */
h2 {
  text-align: center;
  color: #475569;
  margin-bottom: 1.25rem;
  font-size: 1.125rem;
}

/* Form layout */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 8px; /* smaller overall gaps between inputs */
}
.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-group {
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text); /* dark green */
  font-weight: 600;
  font-size: 0.875rem;
}

/* Update the input group styles */
.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 9999px;
  height: 48px;
  padding: 0 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Left icon (account, email, lock) */
.input-group i:not(.mdi-eye):not(.mdi-eye-off) {
  position: absolute;
  left: 12px;
  color: #64748b;
  font-size: 18px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Right icon (eye) */
.input-group .mdi-eye,
.input-group .mdi-eye-off {
  position: absolute;
  right: 12px; /* Position on the right */
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #64748b;
  font-size: 18px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Adjust input padding to accommodate both icons */
.input-group input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 40px; /* Add padding on both sides for icons */
  font-size: 13px;
  color: var(--text);
  outline: none;
  width: 100%;
}

/* Soft focus state */
.input-group:focus-within {
  border-color: #2c7a4b;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  background: #fff;
}

/* error messages */
.error-message,
.err {
  color: var(--error);
  font-size: 12px;
  margin-top: 6px;
  padding-left: 12px;
}

/* Update the default button styles */
.btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9999px;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: #2c7a4b; /* dark green background */
  color: #fff; /* white text */
  transition: all 0.2s ease;
}
.btn:hover:not(:disabled) {
  background: #235f3f; /* darker green on hover */
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(44, 122, 75, 0.2);
}

/* small helper link */
.login-link {
  text-align: center;
  margin-top: 0.5rem;
  color: var(--text-light);
}
.login-link a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}
.login-link a:hover {
  color: var(--primary-hover);
}

/* Alert area */
.alert-container {
  margin: 0.75rem 0;
}

/* subtle focus error styling */
.error {
  border-color: var(--error) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

/* animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Responsive tweaks */
@media (max-width: 480px) {
  .card {
    padding: 1.5rem;
    border-radius: 16px;
    max-width: 100%;
    margin: 0 8px;
  }
  .logo img {
    width: 56px;
    height: 56px;
  }
  h2 {
    font-size: 1.125rem;
    color: var(--text);
  }
  .input-group {
    height: 44px;
    padding: 0 10px;
  }
  .input-group input {
    padding: 10px 40px;
    font-size: 12px;
  }
  .btn-primary,
  .btn-google {
    height: 40px;
    font-size: 13px;
  }
  .register-form {
    gap: 6px;
  }
  .name-row {
    grid-template-columns: 1fr; /* stack on small screens */
    gap: 8px;
  }
  .register-form .form-group:last-of-type {
    margin-bottom: 0;
  }
}

/* Make border stand out on high DPI */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .card {
    border-color: var(--border-strong);
  }
}
</style>
