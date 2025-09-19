<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, formActionDefault } from '@/services/supabase.js'
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

const handleGoogleLogin = () => {
  console.log('Google login clicked')
}

const handleFacebookLogin = () => {
  console.log('Facebook login clicked')
}

const handleTwitterLogin = () => {
  console.log('Twitter login clicked')
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
          :disabled="formAction.formProcess || !formData.email || !formData.password"
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

        <button type="submit" class="login-btn mt-0" :disabled="formAction.formProcess">
          {{ formAction.formProcess ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>or login with</span>
      </div>

      <!-- Social Buttons -->
      <div class="social">
        <button @click="handleGoogleLogin">
          <i class="mdi mdi-google"></i>
        </button>
        <button @click="handleFacebookLogin">
          <i class="mdi mdi-facebook"></i>
        </button>
        <button @click="handleTwitterLogin">
          <i class="mdi mdi-twitter"></i>
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
  background: #f5f5f5;
  padding: 16px;
  overflow-x: hidden;
}

.card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.15);
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
}

.input-group2 {
  position: relative;
  margin-bottom: 5px;
}

.input-group2 i {
  position: absolute;
  top: 32%;
  transform: translateY(-50%);
  color: #777;
  cursor: pointer;
  z-index: 1;
}

.input-group2 i.mdi-lock-outline {
  left: 12px;
}

.input-group2 i.mdi-eye,
.input-group2 i.mdi-eye-off {
  right: 12px;
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
  margin-top: 10px;
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

.social {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.social button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
  transition: 0.3s;
}

.social button:hover {
  background: #f5f5f5;
}

.social i {
  font-size: 18px;
}

.social .mdi-google {
  color: #db4437;
}

.social .mdi-facebook {
  color: #1877f2;
}

.social .mdi-twitter {
  color: #1da1f2;
}
.err {
  color: #cc0000;
  font-size: 12px;
  margin-top: 6px;
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
  }

  .card {
    max-width: 100%;
    padding: 1.5rem;
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

  .input-group1 i,
  .input-group2 i {
    font-size: 16px;
  }

  .input-group1 i {
    left: 10px;
  }

  .input-group2 i.mdi-lock-outline {
    left: 10px;
  }

  .input-group2 i.mdi-eye,
  .input-group2 i.mdi-eye-off {
    right: 10px;
  }

  .login-btn {
    padding: 10px;
    font-size: 14px;
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
  }

  .card {
    padding: 1.2rem;
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

  .input-group1 i,
  .input-group2 i {
    font-size: 14px;
  }

  .input-group1 i {
    left: 8px;
  }

  .input-group2 i.mdi-lock-outline {
    left: 8px;
  }

  .input-group2 i.mdi-eye,
  .input-group2 i.mdi-eye-off {
    right: 8px;
  }

  .login-btn {
    padding: 8px;
    font-size: 13px;
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
</style>
