<template>
  <div class="staff-management">
    <div class="header">
      <h1>Staff Management</h1>
      <button class="btn btn-primary" @click="showAddStaffForm = true">
        <span>+</span> Add Staff
      </button>
    </div>

    <div class="filters">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search staff..."
          @input="handleSearch"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="filter-group">
        <label>Status:</label>
        <select v-model="statusFilter" @change="fetchStaff">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Role:</label>
        <select v-model="roleFilter" @change="fetchStaff">
          <option value="all">All Roles</option>
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading staff members...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="staff-list">
      <div v-if="filteredStaff.length === 0" class="no-results">
        No staff members found matching your criteria.
      </div>

      <div v-else>
        <div class="staff-grid">
          <div v-for="staff in paginatedStaff" :key="staff.id" class="staff-card">
            <div class="staff-avatar">
              {{ getInitials(staff.first_name, staff.last_name) }}
              <span
                class="status-badge"
                :class="{ online: staff.is_online, offline: !staff.is_online }"
                :title="
                  staff.is_online ? 'Online' : 'Last seen: ' + formatLastSeen(staff.last_seen)
                "
              ></span>
            </div>
            <div class="staff-info">
              <h3>{{ staff.first_name }} {{ staff.last_name }}</h3>
              <p class="role">{{ formatRole(staff.role) }}</p>
              <p class="email">{{ staff.email }}</p>
              <p class="last-login" v-if="staff.last_login">
                Last active: {{ formatDate(staff.last_login) }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button :disabled="currentPage >= totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStaffStore } from '@/stores/staff'
import StaffForm from '@/components/StaffForm.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const staffStore = useStaffStore()

// State
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const statusFilter = ref('active')
const roleFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showStaffForm = ref(false)
const editingStaff = ref(null)
const showConfirmDialog = ref(false)
const staffToDeactivate = ref(null)

// Computed
const filteredStaff = computed(() => {
  return staffStore.staffMembers.filter((staff) => {
    const matchesSearch =
      !searchQuery.value ||
      staff.first_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && staff.is_active) ||
      (statusFilter.value === 'inactive' && !staff.is_active)

    const matchesRole = roleFilter.value === 'all' || staff.role === roleFilter.value

    return matchesSearch && matchesStatus && matchesRole
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredStaff.value.length / itemsPerPage.value)
})

const paginatedStaff = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStaff.value.slice(start, end)
})

// Methods
const fetchStaff = async () => {
  try {
    loading.value = true
    error.value = null
    await staffStore.fetchStaff()
  } catch (err) {
    console.error('Error fetching staff:', err)
    error.value = 'Failed to load staff members. Please try again.'
    toast.error('Failed to load staff members')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1 // Reset to first page when searching
}

const editStaff = (id) => {
  editingStaff.value = id
  showStaffForm.value = true
}

const confirmDeactivate = (staff) => {
  staffToDeactivate.value = { ...staff }
  showConfirmDialog.value = true
}

const deactivateStaff = async () => {
  if (!staffToDeactivate.value) return

  try {
    await staffStore.deactivateStaff(staffToDeactivate.value.id)
    toast.success(`Successfully deactivated ${staffToDeactivate.value.first_name}`)
  } catch (err) {
    console.error('Error deactivating staff:', err)
    toast.error(`Failed to deactivate staff: ${err.message}`)
  } finally {
    showConfirmDialog.value = false
    staffToDeactivate.value = null
  }
}

const activateStaff = async (id) => {
  const staffId = id || staffToDeactivate.value?.id
  if (!staffId) return

  try {
    await staffStore.updateStaff(staffId, { is_active: true })
    toast.success('Staff member activated successfully')
  } catch (err) {
    console.error('Error activating staff:', err)
    toast.error(`Failed to activate staff: ${err.message}`)
  } finally {
    if (staffToDeactivate.value) {
      showConfirmDialog.value = false
      staffToDeactivate.value = null
    }
  }
}

const handleStaffSaved = () => {
  showStaffForm.value = false
  editingStaff.value = null
  fetchStaff()
  toast.success(`Staff member ${editingStaff.value ? 'updated' : 'added'} successfully`)
}

const closeModal = () => {
  showStaffForm.value = false
  editingStaff.value = null
  showConfirmDialog.value = false
  staffToDeactivate.value = null
}

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

const formatRole = (role) => {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

const formatLastSeen = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

// Lifecycle hooks
onMounted(() => {
  fetchStaff()
  // Set up real-time updates
  staffStore.setupRealtimeUpdates()
})

// Watch for changes to filters
watch([statusFilter, roleFilter], () => {
  currentPage.value = 1
  fetchStaff()
})
</script>

<style scoped>
.staff-management {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
  color: #2c3e50;
}

.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: #555;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.staff-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.staff-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.staff-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  position: relative;
}

.status-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-badge.online {
  background-color: #2ecc71;
}

.status-badge.offline {
  background-color: #95a5a6;
}

.staff-info {
  flex: 1;
}

.staff-info h3 {
  margin: 0 0 0.25rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.role {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 500;
}

.email,
.last-login {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.staff-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #f5f5f5;
}

.btn-icon.danger {
  color: #e74c3c;
}

.btn-icon.success {
  color: #2ecc71;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background: #f5f5f5;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.25rem 0.5rem;
  line-height: 1;
}

.modal-body {
  padding: 1.5rem;
}

/* Confirm Dialog */
.confirm-dialog {
  padding: 1.5rem;
  max-width: 400px;
  text-align: center;
}

.confirm-dialog h3 {
  margin-top: 0;
  color: #2c3e50;
}

.confirm-dialog p {
  margin: 1rem 0 1.5rem;
  color: #555;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Loading and Error States */
.loading,
.error,
.no-results {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 1.5rem;
}

.error {
  color: #e74c3c;
  background-color: #fde8e8;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .staff-grid {
    grid-template-columns: 1fr;
  }
}
</style>
