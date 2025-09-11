import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePinStore = defineStore('pin', () => {
  // PIN state
  const pin = ref('')
  const isPinSet = ref(false)
  const isAuthenticated = ref(false)

  // Set PIN (4 digits)
  function setPin(newPin) {
    if (newPin && newPin.length === 4 && /^\d{4}$/.test(newPin)) {
      pin.value = newPin
      isPinSet.value = true
      return true
    }
    return false
  }

  // Verify PIN
  function verifyPin(inputPin) {
    if (pin.value && inputPin === pin.value) {
      isAuthenticated.value = true
      return true
    }
    return false
  }

  // Clear authentication (logout)
  function clearAuth() {
    isAuthenticated.value = false
  }

  // Reset PIN (for changing password)
  function resetPin() {
    pin.value = ''
    isPinSet.value = false
    isAuthenticated.value = false
  }

  return {
    pin,
    isPinSet,
    isAuthenticated,
    setPin,
    verifyPin,
    clearAuth,
    resetPin,
  }
})
