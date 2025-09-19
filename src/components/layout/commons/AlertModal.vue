<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'warning', 'info'
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  autoClose: {
    type: Boolean,
    default: false,
  },
  autoCloseDelay: {
    type: Number,
    default: 3000,
  },
})

const emit = defineEmits(['close', 'confirm'])

const isVisible = ref(props.show)

// Watch for show prop changes
watch(
  () => props.show,
  (newValue) => {
    isVisible.value = newValue
    if (newValue && props.autoClose) {
      setTimeout(() => {
        closeModal()
      }, props.autoCloseDelay)
    }
  },
)

const closeModal = () => {
  isVisible.value = false
  emit('close')
}

const confirmAction = () => {
  emit('confirm')
  closeModal()
}

// Get icon based on type
const getIcon = () => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  }
  return icons[props.type] || icons.info
}

// Get color based on type
const getColor = () => {
  const colors = {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  }
  return colors[props.type] || colors.info
}

// Get background color based on type
const getBgColor = () => {
  const bgColors = {
    success: '#E8F5E8',
    error: '#FFEBEE',
    warning: '#FFF3E0',
    info: '#E3F2FD',
  }
  return bgColors[props.type] || bgColors.info
}
</script>

<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header" :style="{ backgroundColor: getBgColor() }">
        <div class="modal-icon">
          <i :class="getIcon()" :style="{ color: getColor() }"></i>
        </div>
        <div class="modal-title">
          <h3 v-if="title" :style="{ color: getColor() }">{{ title }}</h3>
          <h3 v-else :style="{ color: getColor() }">
            {{
              type === 'success'
                ? 'Success!'
                : type === 'error'
                  ? 'Error!'
                  : type === 'warning'
                    ? 'Warning!'
                    : 'Information'
            }}
          </h3>
        </div>
        <button v-if="showCloseButton" class="close-button" @click="closeModal">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <p class="modal-message">{{ message }}</p>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button
          v-if="type === 'error' || type === 'warning'"
          class="modal-button confirm-button"
          :style="{ backgroundColor: getColor() }"
          @click="confirmAction"
        >
          OK
        </button>
        <button
          v-else
          class="modal-button close-button"
          :style="{ backgroundColor: getColor() }"
          @click="closeModal"
        >
          {{ type === 'success' ? 'Great!' : 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-icon {
  margin-right: 15px;
  font-size: 24px;
}

.modal-title {
  flex: 1;
}

.modal-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 20px;
}

.modal-message {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
}

.modal-footer {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
}

.modal-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.modal-button:hover {
  opacity: 0.9;
}

.confirm-button {
  background-color: #4caf50;
}

.close-button {
  background-color: #2196f3;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .modal-container {
    width: 95%;
    margin: 10px;
  }

  .modal-header {
    padding: 15px;
  }

  .modal-body {
    padding: 15px;
  }

  .modal-footer {
    padding: 15px;
  }

  .modal-title h3 {
    font-size: 16px;
  }

  .modal-message {
    font-size: 14px;
  }
}
</style>
