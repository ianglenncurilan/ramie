<template>
  <div class="staff-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="first_name">First Name *</label>
        <input
          id="first_name"
          v-model="formData.first_name"
          type="text"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label for="last_name">Last Name *</label>
        <input
          id="last_name"
          v-model="formData.last_name"
          type="text"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label for="email">Email *</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          :disabled="loading || isEdit"
        />
      </div>

      <div class="form-group">
        <label for="role">Role *</label>
        <select
          id="role"
          v-model="formData.role"
          required
          :disabled="loading"
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <div class="form-group">
        <label for="phone">Phone</label>
        <input
          id="phone"
          v-model="formData.phone"
          type="tel"
          :disabled="loading"
        />
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading">Saving...</span>
          <span v-else>{{ isEdit ? 'Update' : 'Add' }} Staff</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStaffStore } from '@/stores/staff'

const props = defineProps({
  staffId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['saved', 'cancel'])

const staffStore = useStaffStore()
const loading = ref(false)
const error = ref(null)

const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  role: 'staff',
  phone: '',
  is_active: true
})

const isEdit = computed(() => !!props.staffId)
const isFormValid = computed(() => {
  return (
    formData.value.first_name.trim() &&
    formData.value.last_name.trim() &&
    formData.value.email.trim() &&
    formData.value.role
  )
})

// Load staff data if in edit mode
onMounted(async () => {
  if (props.staffId) {
    try {
      loading.value = true
      const staff = await staffStore.getStaffById(props.staffId)
      if (staff) {
        formData.value = {
          first_name: staff.first_name || '',
          last_name: staff.last_name || '',
          email: staff.email || '',
          role: staff.role || 'staff',
          phone: staff.phone || '',
          is_active: staff.is_active !== false // Default to true if not set
        }
      }
    } catch (err) {
      console.error('Error loading staff data:', err)
      error.value = 'Failed to load staff data. Please try again.'
    } finally {
      loading.value = false
    }
  }
})

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  try {
    loading.value = true
    error.value = null
    
    if (isEdit.value) {
      await staffStore.updateStaff(props.staffId, formData.value)
    } else {
      await staffStore.addStaff(formData.value)
    }
    
    emit('saved')
  } catch (err) {
    console.error('Error saving staff:', err)
    error.value = err.message || 'Failed to save staff. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.staff-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="email"],
input[type="tel"],
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="tel"]:focus,
select:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3a7bc8;
}

.btn-primary:disabled {
  background-color: #a0c4ff;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.error-message {
  color: #e74c3c;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #fde8e8;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
