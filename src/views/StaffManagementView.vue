<template>
  <div class="staff-management">
    <div class="header">
      <h1>Staff List</h1>
    </div>

    <div class="filters">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name..."
          @input="handleSearch"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading staff members...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="staff-list">
      <div v-if="filteredStaff.length === 0" class="no-results">No staff members found.</div>

      <div v-else>
        <div class="staff-grid">
          <div v-for="staff in paginatedStaff" :key="staff.id" class="staff-card">
            <div class="staff-avatar">
              {{ getInitials(staff.first_name, staff.last_name) }}
            </div>
            <div class="staff-info">
              <h3>{{ staff.first_name }} {{ staff.last_name }}</h3>
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
import { ref, computed, onMounted } from 'vue'
import { useStaffStore } from '@/stores/staff'
import { useToast } from 'vue-toastification'

const toast = useToast()
const staffStore = useStaffStore()

// State
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed
const filteredStaff = computed(() => {
  if (!searchQuery.value) return staffStore.staffMembers

  const query = searchQuery.value.toLowerCase()
  return staffStore.staffMembers.filter(
    (staff) =>
      staff.first_name.toLowerCase().includes(query) ||
      staff.last_name.toLowerCase().includes(query),
  )
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
    error.value = 'Failed to load staff members.'
    toast.error('Failed to load staff members')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1 // Reset to first page when searching
}

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(dateString).toLocaleString(undefined, options)
}

// Lifecycle hooks
onMounted(() => {
  fetchStaff()
})

// Watch for changes to filters
// watch([statusFilter, roleFilter], () => {
//   currentPage.value = 1
//   fetchStaff()
// })
</script>

<style scoped>
.staff-management {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
  font-weight: 600;
}

.filters {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 0.7rem 2.5rem 0.7rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  pointer-events: none;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}

.staff-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 1.25rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #edf2f7;
}

.staff-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.staff-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4a5568;
  font-size: 1.1rem;
  border: 1px solid #e2e8f0;
}

.staff-info {
  flex: 1;
}

.staff-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 600;
}

.staff-info .last-login {
  margin: 0;
  font-size: 0.85rem;
  color: #718096;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2.5rem;
  padding: 1rem 0;
}

.pagination button {
  padding: 0.6rem 1.2rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: #4a5568;
}

.pagination button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f1f5f9;
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

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .staff-management {
    padding: 0.75rem;
  }

  .header {
    margin-bottom: 1rem;
  }

  .header h1 {
    font-size: 1.4rem;
  }

  .filters {
    margin-bottom: 1rem;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .search-box input {
    padding: 0.6rem 2rem 0.6rem 0.8rem;
    font-size: 0.9rem;
  }

  .search-icon {
    right: 10px;
    font-size: 0.9rem;
  }

  .staff-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .staff-card {
    padding: 0.75rem;
    gap: 0.75rem;
    border-radius: 8px;
  }

  .staff-avatar {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }

  .staff-info h3 {
    font-size: 0.95rem;
    margin-bottom: 0.15rem;
  }

  .staff-info .last-login {
    font-size: 0.75rem;
  }

  .pagination {
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 0.75rem 0;
    flex-wrap: wrap;
  }

  .pagination button {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
  }

  .loading,
  .error,
  .no-results {
    padding: 1.5rem;
    margin-top: 1rem;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .staff-management {
    padding: 1rem;
  }

  .header {
    margin-bottom: 1.2rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .filters {
    margin-bottom: 1.2rem;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .search-box input {
    padding: 0.65rem 2.2rem 0.65rem 0.9rem;
    font-size: 0.95rem;
  }

  .search-icon {
    right: 11px;
    font-size: 0.95rem;
  }

  .staff-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  .staff-card {
    padding: 1rem;
    gap: 0.8rem;
    border-radius: 9px;
  }

  .staff-avatar {
    width: 45px;
    height: 45px;
    font-size: 1rem;
  }

  .staff-info h3 {
    font-size: 1rem;
    margin-bottom: 0.2rem;
  }

  .staff-info .last-login {
    font-size: 0.8rem;
  }

  .pagination {
    gap: 0.75rem;
    margin-top: 2rem;
    padding: 0.8rem 0;
  }

  .pagination button {
    padding: 0.55rem 1rem;
    font-size: 0.85rem;
  }

  .loading,
  .error,
  .no-results {
    padding: 1.75rem;
    margin-top: 1.2rem;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .staff-management {
    padding: 1.25rem;
  }

  .header {
    margin-bottom: 1.3rem;
  }

  .header h1 {
    font-size: 1.6rem;
  }

  .filters {
    margin-bottom: 1.3rem;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .search-box input {
    padding: 0.7rem 2.3rem 0.7rem 0.95rem;
    font-size: 0.98rem;
  }

  .search-icon {
    right: 11px;
    font-size: 0.98rem;
  }

  .staff-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.1rem;
    margin-top: 1.1rem;
  }

  .staff-card {
    padding: 1.1rem;
    gap: 0.9rem;
    border-radius: 9px;
  }

  .staff-avatar {
    width: 48px;
    height: 48px;
    font-size: 1.05rem;
  }

  .staff-info h3 {
    font-size: 1.05rem;
    margin-bottom: 0.22rem;
  }

  .staff-info .last-login {
    font-size: 0.82rem;
  }

  .pagination {
    gap: 0.9rem;
    margin-top: 2.2rem;
    padding: 0.9rem 0;
  }

  .pagination button {
    padding: 0.58rem 1.1rem;
    font-size: 0.88rem;
  }

  .loading,
  .error,
  .no-results {
    padding: 1.85rem;
    margin-top: 1.3rem;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .staff-management {
    padding: 1.4rem;
  }

  .header {
    margin-bottom: 1.4rem;
  }

  .header h1 {
    font-size: 1.7rem;
  }

  .filters {
    margin-bottom: 1.4rem;
  }

  .search-box {
    max-width: 450px;
  }

  .search-box input {
    padding: 0.7rem 2.4rem 0.7rem 1rem;
    font-size: 1rem;
  }

  .search-icon {
    right: 12px;
    font-size: 1rem;
  }

  .staff-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.2rem;
    margin-top: 1.2rem;
  }

  .staff-card {
    padding: 1.2rem;
    gap: 1rem;
    border-radius: 10px;
  }

  .staff-avatar {
    width: 52px;
    height: 52px;
    font-size: 1.08rem;
  }

  .staff-info h3 {
    font-size: 1.08rem;
    margin-bottom: 0.24rem;
  }

  .staff-info .last-login {
    font-size: 0.84rem;
  }

  .pagination {
    gap: 1rem;
    margin-top: 2.3rem;
    padding: 1rem 0;
  }

  .pagination button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  .loading,
  .error,
  .no-results {
    padding: 1.9rem;
    margin-top: 1.4rem;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .staff-management {
    padding: 1.5rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .header h1 {
    font-size: 1.75rem;
  }

  .filters {
    margin-bottom: 1.5rem;
  }

  .search-box {
    max-width: 480px;
  }

  .search-box input {
    padding: 0.7rem 2.5rem 0.7rem 1rem;
    font-size: 1rem;
  }

  .search-icon {
    right: 12px;
    font-size: 1rem;
  }

  .staff-grid {
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }

  .staff-card {
    padding: 1.25rem;
    gap: 1rem;
    border-radius: 10px;
  }

  .staff-avatar {
    width: 50px;
    height: 50px;
    font-size: 1.1rem;
  }

  .staff-info h3 {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
  }

  .staff-info .last-login {
    font-size: 0.85rem;
  }

  .pagination {
    gap: 1rem;
    margin-top: 2.5rem;
    padding: 1rem 0;
  }

  .pagination button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  .loading,
  .error,
  .no-results {
    padding: 2rem;
    margin-top: 1.5rem;
  }
}
</style>
