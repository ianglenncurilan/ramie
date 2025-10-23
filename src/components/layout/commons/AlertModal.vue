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
          <div class="icon-badge" :style="{ backgroundColor: getBgColor(), color: getColor() }">
            <i :class="['mdi', getIcon()]" />
          </div>
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
        <button v-if="showCloseButton" class="icon-close" @click="closeModal">
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
        <button v-else class="modal-button" :style="{ backgroundColor: getColor() }" @click="closeModal">
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
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: scaleIn 0.2s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 18px 18px 12px 18px;
}

.modal-icon {
  margin-right: 12px;
}

.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
}

.icon-badge i {
  font-size: 22px;
}

.modal-title {
  flex: 1;
}

.modal-title h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.icon-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.icon-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 12px 18px 18px 18px;
}

.modal-message {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #2a2a2a;
}

.modal-footer {
  padding: 12px 18px 18px 18px;
  display: flex;
  justify-content: flex-end;
}

.modal-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.05s ease-in-out;
}

.modal-button:hover {
  opacity: 0.9;
}

.modal-button:active {
  transform: translateY(1px);
}

.confirm-button {
  background-color: #4caf50;
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

@keyframes scaleIn {
  from {
    transform: scale(0.98);
    opacity: 0;
  }
  to {
    transform: scale(1);
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
    padding: 14px 14px 10px 14px;
  }

  .modal-body {
    padding: 10px 14px 14px 14px;
  }

  .modal-footer {
    padding: 10px 14px 14px 14px;
  }

  .modal-title h3 {
    font-size: 15px;
  }

  .modal-message {
    font-size: 14px;
  }
}
</style>
