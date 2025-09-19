<script setup>
import { useAlertModal } from '@/composables/useAlertModal.js'

const { showSuccess, showError, showWarning, showInfo, showCustom } = useAlertModal()

const showSuccessAlert = () => {
  showSuccess('Operation completed successfully!', 'Success!')
}

const showErrorAlert = () => {
  showError('Something went wrong. Please try again.', 'Error!')
}

const showWarningAlert = () => {
  showWarning('Please be careful with this action.', 'Warning!')
}

const showInfoAlert = () => {
  showInfo('Here is some useful information for you.', 'Information')
}

const showCustomAlert = () => {
  showCustom({
    type: 'success',
    title: 'Custom Alert',
    message: 'This is a custom alert with auto-close disabled.',
    autoClose: false,
    showCloseButton: true,
  })
}
</script>

<template>
  <div class="demo-container">
    <h2>Alert Modal Demo</h2>
    <p>Click the buttons below to see different types of alert modals:</p>

    <div class="button-group">
      <button @click="showSuccessAlert" class="demo-button success">Show Success Alert</button>

      <button @click="showErrorAlert" class="demo-button error">Show Error Alert</button>

      <button @click="showWarningAlert" class="demo-button warning">Show Warning Alert</button>

      <button @click="showInfoAlert" class="demo-button info">Show Info Alert</button>

      <button @click="showCustomAlert" class="demo-button custom">Show Custom Alert</button>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.demo-button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.demo-button:hover {
  opacity: 0.9;
}

.demo-button.success {
  background-color: #4caf50;
}

.demo-button.error {
  background-color: #f44336;
}

.demo-button.warning {
  background-color: #ff9800;
}

.demo-button.info {
  background-color: #2196f3;
}

.demo-button.custom {
  background-color: #9c27b0;
}

@media (min-width: 768px) {
  .button-group {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .demo-button {
    flex: 1;
    min-width: 150px;
  }
}
</style>
