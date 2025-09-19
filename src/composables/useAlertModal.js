import { ref } from 'vue'

// Global state for alert modal
const showAlert = ref(false)
const alertConfig = ref({
  type: 'info',
  title: '',
  message: '',
  showCloseButton: true,
  autoClose: false,
  autoCloseDelay: 3000,
})

export function useAlertModal() {
  const showSuccess = (message, title = 'Success!', options = {}) => {
    alertConfig.value = {
      type: 'success',
      title,
      message,
      showCloseButton: true,
      autoClose: true,
      autoCloseDelay: 3000,
      ...options,
    }
    showAlert.value = true
  }

  const showError = (message, title = 'Error!', options = {}) => {
    alertConfig.value = {
      type: 'error',
      title,
      message,
      showCloseButton: true,
      autoClose: false,
      autoCloseDelay: 0,
      ...options,
    }
    showAlert.value = true
  }

  const showWarning = (message, title = 'Warning!', options = {}) => {
    alertConfig.value = {
      type: 'warning',
      title,
      message,
      showCloseButton: true,
      autoClose: false,
      autoCloseDelay: 0,
      ...options,
    }
    showAlert.value = true
  }

  const showInfo = (message, title = 'Information', options = {}) => {
    alertConfig.value = {
      type: 'info',
      title,
      message,
      showCloseButton: true,
      autoClose: true,
      autoCloseDelay: 3000,
      ...options,
    }
    showAlert.value = true
  }

  const hideAlert = () => {
    showAlert.value = false
  }

  const showCustom = (config) => {
    alertConfig.value = {
      type: 'info',
      title: '',
      message: '',
      showCloseButton: true,
      autoClose: false,
      autoCloseDelay: 3000,
      ...config,
    }
    showAlert.value = true
  }

  return {
    showAlert,
    alertConfig,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    showCustom,
  }
}
