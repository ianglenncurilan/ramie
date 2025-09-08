<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errors = ref({ name: '', email: '', password: '', confirmPassword: '' })
const activeTab = ref('register')

const validate = () => {
  let valid = true
  errors.value = { name: '', email: '', password: '', confirmPassword: '' }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!name.value) {
    errors.value.name = 'Name is required'
    valid = false
  }
  if (!email.value) {
    errors.value.email = 'Email is required'
    valid = false
  } else if (!emailPattern.test(email.value)) {
    errors.value.email = 'Enter a valid email'
    valid = false
  }
  if (!password.value) {
    errors.value.password = 'Password is required'
    valid = false
  } else if (password.value.length < 6) {
    errors.value.password = 'Minimum 6 characters'
    valid = false
  }
  if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = 'Passwords do not match'
    valid = false
  }
  return valid
}

const handleRegister = () => {
  if (!validate()) return
  router.push({ name: 'dashboard' })
}

const handleGoogleLogin = () => {}
const handleFacebookLogin = () => {}
const handleTwitterLogin = () => {}

const setActiveTab = (tab) => {
  activeTab.value = tab
  if (tab === 'login') router.push({ name: 'login' })
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
      <form @submit.prevent="handleRegister" class="form">
        <div class="input-group1">
          <i class="mdi mdi-account-outline"></i>
          <input v-model="name" type="text" placeholder="Full Name" />
          <p v-if="errors.name" class="err">{{ errors.name }}</p>
        </div>
        <div class="input-group1">
          <i class="mdi mdi-email-outline"></i>
          <input v-model="email" type="email" placeholder="Email Address" />
          <p v-if="errors.email" class="err">{{ errors.email }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input v-model="password" type="password" placeholder="Password" />
          <p v-if="errors.password" class="err">{{ errors.password }}</p>
        </div>
        <div class="input-group2">
          <i class="mdi mdi-lock-outline"></i>
          <input v-model="confirmPassword" type="password" placeholder="Confirm Password" />
          <p v-if="errors.confirmPassword" class="err">{{ errors.confirmPassword }}</p>
        </div>

        <button type="submit" class="login-btn mt-0">Create Account</button>
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
}

.card {
  width: 380px;
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
  gap: 12px;
  margin-bottom: 1.5rem;
}

.tabs button {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid #2c7a4b;
  background: transparent;
  color: #2c7a4b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.tabs button.active {
  background: #2c7a4b;
  color: #fff;
  transform: scale(1.1); /* Slightly enlarge the button */
  box-shadow: 0px 4px 10px rgba(44, 122, 75, 0.3); /* Add a shadow */
}

.tabs button:hover:not(.active) {
  background: #f0fdf4;
  transform: scale(1.05); /* Slightly enlarge on hover */
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
</style>
