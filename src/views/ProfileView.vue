<template>
  <div class="screen">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
    </section>
    <div class="panel">
      <div class="avatar">👤</div>
      <div class="name">Olivier Terante</div>
      <div class="role">Hog Raiser</div>

      <div class="menu">
        <button class="row">
          <span>Edit Profile</span>
          <span>›</span>
        </button>
        <button class="row" @click="openPinModal">
          <span>{{ pinStore.isPinSet ? 'Change PIN' : 'Set PIN' }}</span>
          <span>›</span>
        </button>
        <button class="signout">Sign out</button>
      </div>
    </div>

    <!-- PIN Modal -->
    <div v-if="showPinModal" class="modal-overlay" @click="closePinModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ pinStore.isPinSet ? 'Change PIN' : 'Set PIN' }}</h3>
          <button class="close-btn" @click="closePinModal">×</button>
        </div>

        <div class="modal-content">
          <div class="pin-input-container">
            <div class="pin-display">
              <div
                v-for="i in 4"
                :key="i"
                class="pin-dot"
                :class="{ filled: pinInput.length >= i }"
              ></div>
            </div>
            <div class="pin-keypad">
              <button v-for="num in 9" :key="num" class="pin-key" @click="addDigit(num.toString())">
                {{ num }}
              </button>
              <button class="pin-key" @click="clearPin">Clear</button>
              <button
                v-for="num in [0]"
                :key="num"
                class="pin-key"
                @click="addDigit(num.toString())"
              >
                {{ num }}
              </button>
              <button class="pin-key" @click="removeDigit">⌫</button>
            </div>
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav class="bottombar">
      <button
        @click="$router.push({ name: 'dashboard' })"
        :class="{ active: $route.name === 'dashboard' }"
      >
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button
        @click="$router.push({ name: 'records' })"
        :class="{ active: $route.name === 'records' }"
      >
        <img src="/record.png" alt="Records" />
      </button>
      <button
        @click="$router.push({ name: 'expenses' })"
        :class="{ active: $route.name === 'expenses' }"
      >
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button
        @click="$router.push({ name: 'profile' })"
        :class="{ active: $route.name === 'profile' }"
      >
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePinStore } from '../stores/pin'

const pinStore = usePinStore()

// Modal state
const showPinModal = ref(false)
const pinInput = ref('')
const errorMessage = ref('')
const successMessage = ref('')

// PIN modal functions
function openPinModal() {
  showPinModal.value = true
  pinInput.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

function closePinModal() {
  showPinModal.value = false
  pinInput.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

function addDigit(digit) {
  if (pinInput.value.length < 4) {
    pinInput.value += digit
    errorMessage.value = ''

    // Auto-submit when 4 digits are entered
    if (pinInput.value.length === 4) {
      setTimeout(() => {
        setPin()
      }, 300)
    }
  }
}

function removeDigit() {
  if (pinInput.value.length > 0) {
    pinInput.value = pinInput.value.slice(0, -1)
    errorMessage.value = ''
  }
}

function clearPin() {
  pinInput.value = ''
  errorMessage.value = ''
}

function setPin() {
  if (pinInput.value.length === 4) {
    const success = pinStore.setPin(pinInput.value)
    if (success) {
      successMessage.value = 'PIN set successfully!'
      setTimeout(() => {
        closePinModal()
      }, 1500)
    } else {
      errorMessage.value = 'Please enter a valid 4-digit PIN'
    }
  } else {
    errorMessage.value = 'Please enter 4 digits'
  }
}
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.hero {
  margin: 16px;
}
.hero img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 14px;
}
.panel {
  margin: 0 16px 16px 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  overflow-y: auto;
}
.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fff;
  color: #2f8b60;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  margin-top: 20px;
  border: 6px solid #2f8b60;
}
.name {
  font-weight: 700;
  margin-top: 10px;
}
.role {
  opacity: 0.9;
  margin-bottom: 14px;
}
.menu {
  width: 100%;
}
.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  color: #333;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 8px 0;
}
.signout {
  width: 100%;
  background: #1f6b4a;
  color: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 10px;
}
button {
  cursor: pointer;
}
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottombar button {
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
}

.bottombar button:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.bottombar button.active {
  background: #2f8b60;
  color: #fff;
}

.bottombar button.active img {
  filter: brightness(0) invert(1);
}

.bottombar img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  transition: filter 0.2s ease-in-out;
}

/* PIN Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
}

.modal-content {
  padding: 0 20px 20px 20px;
}

.pin-input-container {
  text-align: center;
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
}

.pin-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: transparent;
  transition: all 0.2s ease;
}

.pin-dot.filled {
  background: #2f8b60;
  border-color: #2f8b60;
}

.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 240px;
  margin: 0 auto;
}

.pin-key {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-key:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

.pin-key:active {
  transform: scale(0.95);
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  margin-top: 16px;
  font-weight: 500;
}

.success-message {
  color: #2f8b60;
  font-size: 14px;
  margin-top: 16px;
  font-weight: 500;
}
</style>
