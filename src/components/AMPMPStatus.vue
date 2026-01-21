<template>
  <div class="ampm-status">
    <div class="time-slot" :class="{ 'time-disabled': disabled }">
      <span class="time-label">AM:</span>
      <button
        class="status-btn"
        :class="{
          'status-active': modelValue?.am === true,
          'status-inactive': modelValue?.am === false,
          'status-vacant': modelValue?.am === undefined || modelValue?.am === null,
        }"
        @click="toggleStatus('am')"
        :disabled="disabled"
      >
        {{ getStatusIcon('am') }}
      </button>
    </div>
    <div class="time-slot" :class="{ 'time-disabled': disabled }">
      <span class="time-label">PM:</span>
      <button
        class="status-btn"
        :class="{
          'status-active': modelValue?.pm === true,
          'status-inactive': modelValue?.pm === false,
          'status-vacant': modelValue?.pm === undefined || modelValue?.pm === null,
        }"
        @click="toggleStatus('pm')"
        :disabled="disabled"
      >
        {{ getStatusIcon('pm') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ am: false, pm: false }),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const getStatusIcon = (timeOfDay) => {
  const status = props.modelValue?.[timeOfDay]
  if (status === undefined || status === null) return '-'
  return status ? '✓' : '✗'
}

const toggleStatus = (timeOfDay) => {
  if (props.disabled) return

  const currentStatus = props.modelValue?.[timeOfDay]
  let newStatus

  // Cycle through statuses: null -> true -> false -> null
  if (currentStatus === undefined || currentStatus === null) {
    newStatus = true
  } else if (currentStatus === true) {
    newStatus = false
  } else {
    newStatus = null
  }

  emit('update:modelValue', {
    ...props.modelValue,
    [timeOfDay]: newStatus,
  })
}
</script>

<style scoped>
.ampm-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-label {
  font-size: 0.8em;
  color: #666;
  min-width: 24px;
  text-align: center;
}

.status-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.status-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-active {
  background-color: #4caf50;
  color: white;
  border-color: #45a049;
}

.status-inactive {
  background-color: #f8f9fa;
  color: #dc3545;
}

.status-vacant {
  background-color: #f8f9fa;
  color: #6c757d;
  font-weight: bold;
}

.time-disabled .status-btn {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
