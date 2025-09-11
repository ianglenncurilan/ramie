<template>
  <div class="screen">
    <!-- PIN Verification Screen -->
    <div v-if="!pinStore.isAuthenticated" class="pin-screen">
      <div class="pin-container">
        <div class="pin-header">
          <button class="back-btn" @click="$router.back()">←</button>
          <h2>Enter PIN</h2>
          <p>Access to expenses requires PIN verification</p>
        </div>

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
            <button v-for="num in [0]" :key="num" class="pin-key" @click="addDigit(num.toString())">
              {{ num }}
            </button>
            <button class="pin-key" @click="removeDigit">⌫</button>
          </div>
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content (only shown when authenticated) -->
    <div v-else>
      <section class="hero">
        <img src="/pig.jpg" alt="hero" />
        <div class="overlay">
          <div class="title">Track Expense</div>
        </div>
      </section>
      <div class="panel">
        <div class="cards">
          <div class="card success">
            <div class="label">Income</div>
            <div class="value">+0.00</div>
          </div>
          <div class="card danger">
            <div class="label">Expense</div>
            <div class="value">-{{ feeds.totalExpense.toFixed(2) }}</div>
          </div>
        </div>
        <div class="table">
          <div class="row" v-for="e in feeds.expenses" :key="e.id">
            <span>{{ e.label }}</span>
            <span class="amt">-{{ Number(e.amount).toFixed(2) }}</span>
          </div>
          <div v-if="!feeds.expenses.length" class="row">
            <span>No expenses yet</span><span class="amt">0.00</span>
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
import { ref, onMounted } from 'vue'
import { useFeedsStore } from '../stores/feeds'
import { usePinStore } from '../stores/pin'

const feeds = useFeedsStore()
const pinStore = usePinStore()

// PIN verification state
const pinInput = ref('')
const errorMessage = ref('')

// Check if PIN is set on mount
onMounted(() => {
  if (!pinStore.isPinSet) {
    // If no PIN is set, redirect to profile to set one
    // For now, we'll just show the PIN screen
  }
})

// PIN functions
function addDigit(digit) {
  if (pinInput.value.length < 4) {
    pinInput.value += digit
    errorMessage.value = ''

    // Auto-verify when 4 digits are entered
    if (pinInput.value.length === 4) {
      setTimeout(() => {
        verifyPin()
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

function verifyPin() {
  if (pinInput.value.length === 4) {
    const isValid = pinStore.verifyPin(pinInput.value)
    if (isValid) {
      errorMessage.value = ''
    } else {
      errorMessage.value = 'Invalid PIN. Please try again.'
      pinInput.value = ''
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
  position: relative;
  margin: 16px;
}
.hero img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 14px;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
  border-radius: 14px;
}
.panel {
  margin: 0 16px 16px 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  flex: 1;
  overflow-y: auto;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  background: #fff;
  color: #333;
  border-radius: 12px;
  padding: 16px;
}
.card.success .value {
  color: #2f8b60;
}
.card.danger .value {
  color: #c94d4d;
}
.label {
  font-size: 12px;
  color: #789;
}
.value {
  font-weight: 700;
  font-size: 18px;
}
.table {
  background: #fff;
  border-radius: 12px;
  margin-top: 12px;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}
.row:last-child {
  border-bottom: 0;
}
.amt {
  color: #2f8b60;
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

/* PIN Verification Styles */
.pin-screen {
  height: 100vh;
  background: #2f8b60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.pin-container {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.pin-header {
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  color: #333;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

.pin-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.pin-header p {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
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
</style>
