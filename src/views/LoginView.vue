<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, formActionDefault, hasSupabaseConfig } from '@/services/supabase.js'
import AlertNotification from '@/components/layout/commons/AlertNotification.vue'
import AlertModal from '@/components/layout/commons/AlertModal.vue'
import { useAlertModal } from '@/composables/useAlertModal.js'
import { requiredValidator, emailValidator, passwordValidator } from '@/utils/validators'

const router = useRouter()

// Alert modal composable
const { showAlert, alertConfig, showSuccess, showError, showWarning, showInfo, hideAlert } =
  useAlertModal()

// Form data
const activeTab = ref('login')
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

// Form data for login
const formDataDefault = ref({
  email: '',
  password: '',
})

const formData = ref({
  ...formDataDefault.value,
})

// Form data for register
const registerData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = ref({ email: '', password: '', confirmPassword: '', name: '' })

const formAction = ref({
  ...formActionDefault,
})

const refVform = ref()

// Validation functions using validators
const validateLogin = () => {
  let valid = true
  errors.value = { email: '', password: '', confirmPassword: '', name: '' }

  // Validate email using validators
  const emailError = requiredValidator(formData.value.email) || emailValidator(formData.value.email)
  if (emailError !== true) {
    errors.value.email = emailError
    valid = false
  }

  // Validate password using validators
  const passwordError =
    requiredValidator(formData.value.password) || passwordValidator(formData.value.password)
  if (passwordError !== true) {
    errors.value.password = passwordError
    valid = false
  }

  return valid
}

const validateRegister = () => {
  let valid = true
  errors.value = { email: '', password: '', confirmPassword: '', name: '' }

  // Validate name using validators
  const nameError = requiredValidator(registerData.value.name)
  if (nameError !== true) {
    errors.value.name = nameError
    valid = false
  }

  // Validate email using validators
  const emailError =
    requiredValidator(registerData.value.email) || emailValidator(registerData.value.email)
  if (emailError !== true) {
    errors.value.email = emailError
    valid = false
  }

  // Validate password using validators
  const passwordError =
    requiredValidator(registerData.value.password) || passwordValidator(registerData.value.password)
  if (passwordError !== true) {
    errors.value.password = passwordError
    valid = false
  }

  // Validate confirm password
  const confirmError =
    requiredValidator(registerData.value.confirmPassword) ||
    (registerData.value.password !== registerData.value.confirmPassword
      ? 'Passwords do not match'
      : true)
  if (confirmError !== true) {
    errors.value.confirmPassword = confirmError
    valid = false
  }

  return valid
}

// Form handlers
const handleLogin = async () => {
  if (!hasSupabaseConfig) {
    showError(
      'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file and restart the app.',
      'Configuration Missing',
    )
    return
  }
  if (!validateLogin()) return

  // Clear previous messages
  formAction.value = {
    ...formActionDefault,
  }
  formAction.value.formProcess = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password,
    })

    if (error) {
      console.error('Login error:', error)

      // Handle specific error cases with modal alerts
      if (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('Invalid email or password') ||
        error.message.includes('Email not confirmed')
      ) {
        showError(
          'Invalid email or password. Please check your credentials and try again.',
          'Login Failed',
        )
      } else if (error.message.includes('User not found')) {
        showError(
          'No account found with this email address. Please register first.',
          'Account Not Found',
        )
      } else if (error.message.includes('Too many requests')) {
        showWarning('Too many login attempts. Please wait a moment and try again.', 'Rate Limited')
      } else {
        showError(error.message || 'Login failed. Please try again.', 'Login Error')
      }

      formAction.value.formStatus = error.status || 400
    } else if (data && data.user) {
      console.log('Login successful:', data)
      showSuccess('Welcome back! You have been logged in successfully.', 'Login Successful', {
        autoClose: true,
        autoCloseDelay: 2000,
      })

      // Small delay to show success message before redirect
      setTimeout(() => {
        handleLoginSuccess()
      }, 2000)
    } else {
      showError('Login failed. Please try again.', 'Login Error')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    showError('An unexpected error occurred. Please try again.', 'System Error')
  } finally {
    formAction.value.formProcess = false
  }
}

const handleLoginSuccess = () => {
  // Navigate to dashboard after successful login
  router.replace({ name: 'dashboard' })
}

// Form validation function from provided code
const onFormSubmit = () => {
  // First validate using our custom validation
  if (!validateLogin()) {
    console.error('Form validation failed.')
    return
  }

  // Then call the login function
  handleLogin()
}

const handleRegister = async () => {
  if (!hasSupabaseConfig) {
    showError(
      'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file and restart the app.',
      'Configuration Missing',
    )
    return
  }
  if (!validateRegister()) return

  // Enhanced registration with Supabase
  formAction.value = {
    ...formActionDefault,
  }
  formAction.value.formProcess = true

  try {
    const { data, error } = await supabase.auth.signUp({
      email: registerData.value.email,
      password: registerData.value.password,
      options: {
        data: {
          name: registerData.value.name,
        },
      },
    })

    if (error) {
      console.error(error)
      showError(error.message || 'Registration failed. Please try again.', 'Registration Error')
      formAction.value.formStatus = error.status
    } else if (data) {
      console.log(data)
      showSuccess('Account created successfully! You can now log in.', 'Registration Successful', {
        autoClose: true,
        autoCloseDelay: 3000,
      })
      // Reset form data
      registerData.value = { name: '', email: '', password: '', confirmPassword: '' }
      // Switch to login tab after successful registration
      setTimeout(() => {
        setActiveTab('login')
      }, 3000)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    showError('An unexpected error occurred. Please try again.', 'System Error')
  } finally {
    formAction.value.formProcess = false
  }
}

const handleGoogleLogin = async () => {
  if (!hasSupabaseConfig) {
    showError(
      'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file and restart the app.',
      'Configuration Missing',
    )
    return
  }
  try {
    // Clear previous messages
    formAction.value = {
      ...formActionDefault,
    }
    formAction.value.formProcess = true

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      console.error('Google login error:', error)
      showError('Google authentication failed. Please try again.', 'Authentication Error')
    } else {
      console.log('Google login initiated:', data)
      showInfo('Redirecting to Google for authentication...', 'Google Sign-In')
    }
  } catch (err) {
    console.error('Unexpected error during Google login:', err)
    showError('An unexpected error occurred during Google authentication.', 'System Error')
  } finally {
    formAction.value.formProcess = false
  }
}

const setActiveTab = (tab) => {
  activeTab.value = tab
  // Clear form data when switching tabs
  formData.value = { ...formDataDefault.value }
  registerData.value = { name: '', email: '', password: '', confirmPassword: '' }
  errors.value = { email: '', password: '', confirmPassword: '', name: '' }
  formAction.value = { ...formActionDefault }
}

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

const toggleConfirmPasswordVisibility = () => {
  confirmPasswordVisible.value = !confirmPasswordVisible.value
}

// Clear error messages when user starts typing
const clearErrors = () => {
  if (formAction.value.formErrorMessage) {
    formAction.value.formErrorMessage = ''
  }
  if (formAction.value.formSuccessMessage) {
    formAction.value.formSuccessMessage = ''
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Login Card -->
    <div class="card">
      <!-- Logo -->
      <div class="logo">
        <img src="/leaf.png" alt="Logo" />
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

      <!-- Login Form -->
      <form v-if="activeTab === 'login'" @submit.prevent="onFormSubmit" class="form">
        <div class="input-group1">
          <i class="mdi mdi-email-outline"></i>
          <input
            v-model="formData.email"
            type="email"
            placeholder="Email Address"
            @input="clearErrors"
          />
          <p v-if="errors.email" class="err">{{ errors.email }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input
            :type="passwordVisible ? 'text' : 'password'"
            v-model="formData.password"
            placeholder="Password"
            @input="clearErrors"
          />
          <i
            class="mdi"
            :class="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
            @click="togglePasswordVisibility"
          ></i>
          <div class="forgot">Forgot Password?</div>
          <p v-if="errors.password" class="err">{{ errors.password }}</p>
        </div>

        <!-- Alert Notifications -->
        <div class="alert-container">
          <AlertNotification
            :formSuccessMessage="formAction.formSuccessMessage"
            :formErrorMessage="formAction.formErrorMessage"
          />
        </div>

        <button
          type="submit"
          class="login-btn mt-0"
          :disabled="
            formAction.formProcess || !formData.email || !formData.password || !hasSupabaseConfig
          "
        >
          {{ formAction.formProcess ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Register Form -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="form">
        <div class="input-group1">
          <i class="mdi mdi-account-outline"></i>
          <input v-model="registerData.name" type="text" placeholder="Full Name" />
          <p v-if="errors.name" class="err">{{ errors.name }}</p>
        </div>
        <div class="input-group1">
          <i class="mdi mdi-email-outline"></i>
          <input v-model="registerData.email" type="email" placeholder="Email Address" />
          <p v-if="errors.email" class="err">{{ errors.email }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input
            :type="passwordVisible ? 'text' : 'password'"
            v-model="registerData.password"
            placeholder="Password"
          />
          <i
            class="mdi"
            :class="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
            @click="togglePasswordVisibility"
          ></i>
          <p v-if="errors.password" class="err">{{ errors.password }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input
            :type="confirmPasswordVisible ? 'text' : 'password'"
            v-model="registerData.confirmPassword"
            placeholder="Confirm Password"
          />
          <i
            class="mdi"
            :class="confirmPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
            @click="toggleConfirmPasswordVisibility"
          ></i>
          <p v-if="errors.confirmPassword" class="err">{{ errors.confirmPassword }}</p>
        </div>

        <!-- Alert Notifications -->
        <div class="alert-container">
          <AlertNotification
            :formSuccessMessage="formAction.formSuccessMessage"
            :formErrorMessage="formAction.formErrorMessage"
          />
        </div>

        <button
          type="submit"
          class="login-btn mt-0"
          :disabled="formAction.formProcess || !hasSupabaseConfig"
        >
          {{ formAction.formProcess ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>or login with</span>
      </div>

      <!-- Google Sign In Button -->
      <div class="google-signin">
        <button
          @click="handleGoogleLogin"
          class="google-btn"
          :disabled="formAction.formProcess || !hasSupabaseConfig"
        >
          <img src="/google.png" alt="Google" class="google-icon" />
          <span>{{ formAction.formProcess ? 'Signing in...' : 'Sign in with Google' }}</span>
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
  min-height: 100dvh; /* Dynamic viewport height for mobile browsers */
  background: linear-gradient(135deg, #87ceeb 0%, #98fb98 50%, #90ee90 100%);
  background-image: url('/pig.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 16px;
  overflow-x: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.login-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(135, 206, 235, 0.2) 0%,
    rgba(152, 251, 152, 0.3) 50%,
    rgba(144, 238, 144, 0.2) 100%
  );
  z-index: 1;
}

.login-page::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
  z-index: 1;
}

.card {
  width: 100%;
  max-width: 380px;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo img {
  width: 80px;
  height: 80px;
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
  margin-bottom: 5px;
}

.input-group1 i {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: #777;
  z-index: 1;
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-group2 {
  position: relative;
  margin-bottom: 20px;
}

.input-group2 i {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
  cursor: pointer;
  z-index: 1;
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-group2 i.mdi-lock-outline {
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.input-group2 i.mdi-eye,
.input-group2 i.mdi-eye-off {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.form input {
  width: 100%;
  padding: 12px 15px;
  padding-left: 40px;
  padding-right: 15px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  -webkit-appearance: none; /* Remove iOS styling */
  -moz-appearance: none;
  appearance: none;
  touch-action: manipulation; /* Improve touch responsiveness */
}

.form input:focus {
  border-color: #2c7a4b;
}

.forgot {
  text-align: right;
  font-size: 12px;
  color: #777;
  margin-top: 6px;
  margin-bottom: 0;
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
  height: 40px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-family: 'Google Sans', 'Roboto', sans-serif;
}

.google-btn:hover:not(:disabled) {
  background: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-color: #c1c1c1;
}

.google-btn:active:not(:disabled) {
  background: #f1f3f4;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: none;
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.google-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.err {
  color: #cc0000;
  font-size: 12px;
  margin-top: 8px;
  margin-left: 12px;
  position: relative;
  z-index: 0;
}

.alert-container {
  margin: 15px 0;
}

.login-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .login-page {
    padding: 12px;
    background-attachment: scroll;
    background-size: cover;
    background-position: center center;
    min-height: 100vh;
    min-height: 100dvh; /* Dynamic viewport height for mobile browsers */
  }

  .card {
    max-width: 100%;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.98);
    margin: 0;
    border-radius: 16px;
  }

  .logo h1 {
    font-size: 20px;
  }

  .tabs button {
    padding: 8px 16px;
    font-size: 14px;
    min-width: 70px;
  }

  .form input {
    padding: 10px 12px;
    padding-left: 35px;
    padding-right: 12px;
    font-size: 13px;
  }

  .err {
    margin-left: 10px;
    margin-top: 6px;
  }

  .input-group2 {
    margin-bottom: 15px;
  }

  .input-group1 i,
  .input-group2 i {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }

  .input-group1 i {
    left: 10px;
  }

  .input-group2 i.mdi-lock-outline {
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
  }

  .input-group2 i.mdi-eye,
  .input-group2 i.mdi-eye-off {
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }

  .login-btn {
    padding: 10px;
    font-size: 14px;
  }

  .google-btn {
    height: 38px;
    font-size: 13px;
    gap: 6px;
  }

  .google-icon {
    width: 16px;
    height: 16px;
  }

  .social button {
    width: 35px;
    height: 35px;
  }

  .social i {
    font-size: 16px;
  }
}

@media (max-width: 360px) {
  .login-page {
    padding: 8px;
    background-attachment: scroll;
    background-size: cover;
    background-position: center center;
    min-height: 100vh;
    min-height: 100dvh;
  }

  .card {
    padding: 1.2rem;
    background: rgba(255, 255, 255, 0.98);
    margin: 0;
    border-radius: 14px;
  }

  .logo img {
    width: 40px;
    height: 40px;
  }

  .logo h1 {
    font-size: 18px;
  }

  .tabs {
    gap: 6px;
    padding: 3px;
  }

  .tabs button {
    padding: 6px 12px;
    font-size: 13px;
    min-width: 60px;
  }

  .form {
    gap: 12px;
  }

  .form input {
    padding: 8px 10px;
    padding-left: 30px;
    padding-right: 10px;
    font-size: 12px;
  }

  .err {
    margin-left: 8px;
    margin-top: 5px;
  }

  .input-group2 {
    margin-bottom: 12px;
  }

  .input-group1 i,
  .input-group2 i {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }

  .input-group1 i {
    left: 8px;
  }

  .input-group2 i.mdi-lock-outline {
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
  }

  .input-group2 i.mdi-eye,
  .input-group2 i.mdi-eye-off {
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
  }

  .login-btn {
    padding: 8px;
    font-size: 13px;
  }

  .google-btn {
    height: 36px;
    font-size: 12px;
    gap: 5px;
  }

  .google-icon {
    width: 14px;
    height: 14px;
  }

  .divider {
    margin: 15px 0;
    font-size: 12px;
  }

  .social {
    gap: 15px;
  }

  .social button {
    width: 32px;
    height: 32px;
  }

  .social i {
    font-size: 14px;
  }
}

/* Landscape orientation for mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .login-page {
    padding: 8px;
    background-size: cover;
    background-position: center center;
  }

  .card {
    max-width: 90%;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.98);
  }

  .logo img {
    width: 50px;
    height: 50px;
  }

  .logo h1 {
    font-size: 18px;
  }

  .form {
    gap: 12px;
  }

  .form input {
    padding: 10px 12px;
    padding-left: 35px;
    font-size: 14px;
  }
}

/* Extra small devices */
@media (max-width: 320px) {
  .login-page {
    padding: 6px;
  }

  .card {
    padding: 1rem;
    border-radius: 12px;
  }

  .logo img {
    width: 35px;
    height: 35px;
  }

  .logo h1 {
    font-size: 16px;
  }

  .tabs button {
    padding: 6px 10px;
    font-size: 12px;
    min-width: 50px;
  }

  .form input {
    padding: 8px 10px;
    padding-left: 30px;
    font-size: 12px;
  }

  .login-btn {
    padding: 10px;
    font-size: 12px;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .login-page {
    background-image: url('/pig.jpg');
    background-size: cover;
  }
}
</style>
