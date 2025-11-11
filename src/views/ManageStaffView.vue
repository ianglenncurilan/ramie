<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Staff Management</h2>
          <p class="sub">Manage your team and track activities</p>
        </div>
        <img class="panel-illustration" src="/staff.png" alt="icon" />
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'staff' }" @click="activeTab = 'staff'">
          Staff Members
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'activity' }"
          @click="activeTab = 'activity'"
        >
          Activity Log
        </button>
      </div>

      <!-- Staff Management View -->
      <div v-if="activeTab === 'staff'" class="staff-management">
        <div class="header-actions">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search staff..."
              @input="handleSearch"
            />
            <span class="search-icon">🔍</span>
          </div>
          <button class="btn btn-primary" @click="showAddStaffForm = true">
            <span>+</span> Add Staff
          </button>
        </div>

        <div class="filters">
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
              <option value="user">User</option>
              <option value="manager">Admin</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading">Loading staff members...</div>
        <div v-else-if="staffError" class="error">{{ staffError }}</div>

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
                <div class="staff-actions">
                  <button class="btn-icon" @click="editStaff(staff.id)" title="Edit">✏️</button>
                  <button
                    v-if="staff.is_active"
                    class="btn-icon danger"
                    @click="confirmDeactivate(staff)"
                    title="Deactivate"
                  >
                    🚫
                  </button>
                  <button
                    v-else
                    class="btn-icon success"
                    @click="activateStaff(staff.id)"
                    title="Activate"
                  >
                    ✅
                  </button>
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

      <!-- Activity Log View -->
      <div v-else class="activity-log">
        <div class="activity-filters">
          <button
            v-for="filter in activityFilters"
            :key="filter.value"
            :class="['filter-btn', { active: currentFilter === filter.value }]"
            @click="currentFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="activity-list" v-if="!activityLoading">
          <div v-if="filteredActivities.length === 0" class="no-activities">
            No activities found
          </div>

          <div v-else>
            <div v-for="activity in filteredActivities" :key="activity.id" class="activity-item">
              <div class="activity-avatar">
                <img
                  v-if="activity.profiles?.avatar_url"
                  :src="activity.profiles.avatar_url"
                  :alt="activity.profiles.full_name"
                />
                <div v-else class="default-avatar">
                  {{ getInitials(activity.profiles?.full_name || 'U') }}
                </div>
                <div
                  class="status-indicator"
                  :class="{ online: isUserOnline(activity.user_id) }"
                  :title="isUserOnline(activity.user_id) ? 'Online' : 'Offline'"
                ></div>
              </div>

              <div class="activity-details">
                <div class="activity-header">
                  <span class="staff-name">
                    {{ activity.profiles?.full_name || 'Unknown User' }}
                  </span>
                  <span class="activity-time">
                    {{ formatTime(activity.created_at) }}
                  </span>
                </div>
                <div class="activity-message">
                  <span :class="getActivityClass(activity.activity_type)">
                    {{ getActivityMessage(activity) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activityLoading" class="loading-spinner">Loading activities...</div>
        <div v-else-if="activityError" class="error-message">
          {{ activityError }}
          <button @click="fetchActivities" class="retry-btn">Retry</button>
        </div>
      </div>
    </section>

    <!-- Add/Edit Staff Modal -->
    <div v-if="showStaffForm" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingStaff ? 'Edit Staff' : 'Add New Staff' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <StaffForm
            v-if="showStaffForm"
            :staff-id="editingStaff"
            @saved="handleStaffSaved"
            @cancel="closeModal"
          />
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="modal">
      <div class="modal-content confirm-dialog">
        <h3>Confirm Action</h3>
        <p>
          Are you sure you want to {{ staffToDeactivate.is_active ? 'deactivate' : 'activate' }}
          {{ staffToDeactivate.first_name }} {{ staffToDeactivate.last_name }}?
        </p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showConfirmDialog = false">Cancel</button>
          <button
            class="btn btn-danger"
            @click="staffToDeactivate.is_active ? deactivateStaff() : activateStaff()"
          >
            {{ staffToDeactivate.is_active ? 'Deactivate' : 'Activate' }}
          </button>
        </div>
      </div>
    </div>

    <BottomBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '@/stores/activityStore'
import { supabase } from '@/supabase'
import { useStaffStore } from '@/stores/staff'
import { getStaffActivities } from '@/services/staffService'
import StaffForm from '@/components/StaffForm.vue'
import BottomBar from '@/components/BottomBar.vue'

const router = useRouter()
const staffStore = useStaffStore()

// Tabs
const activeTab = ref('staff')

// Staff Management State
const loading = ref(false)
const staffError = ref(null)
const searchQuery = ref('')
const statusFilter = ref('active')
const roleFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showStaffForm = ref(false)
const editingStaff = ref(null)
const showConfirmDialog = ref(false)
const staffToDeactivate = ref(null)

// Activity Log State
const activityStore = useActivityStore()
const currentFilter = ref('all')
const activityFilters = [
  { label: 'All', value: 'all' },
  { label: 'Hog Added', value: 'hog_added' },
  { label: 'Hog Updated', value: 'hog_updated' },
  { label: 'Hog Deleted', value: 'hog_deleted' },
  { label: 'Feeding Completed', value: 'feeding_completed' },
  { label: 'Feeding Incomplete', value: 'feeding_incomplete' },
  { label: 'Weight Updated', value: 'hog_weight_updated' }
]

// Computed Properties
const filteredStaff = computed(() => {
  return staffStore.staffMembers.filter((staff) => {
    const matchesSearch =
      !searchQuery.value ||
      staff.first_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      staff.last_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.value.toLowerCase())

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

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') {
    return activityStore.activities
  }
  return activityStore.activities.filter(activity => activity.activity_type === currentFilter.value)
})

// Methods
// Staff Management Methods
async function fetchStaff() {
  loading.value = true
  try {
    // Query the 'users' table from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_name', { ascending: true })

    if (error) throw error

    // Map the data to match our expected format
    staffStore.staffMembers = data.map((user) => ({
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || 'staff',
      is_active: user.is_active !== false, // Default to true if not set
      is_online: user.last_seen_at ? new Date() - new Date(user.last_seen_at) < 300000 : false, // 5 minutes threshold
      last_seen: user.last_seen_at || null,
      last_login: user.last_sign_in_at || null,
    }))

    staffError.value = null
  } catch (err) {
    console.error('Error fetching staff:', err)
    staffError.value = 'Failed to load staff members. ' + (err.message || 'Please try again.')
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
    showConfirmDialog.value = false
    staffToDeactivate.value = null
  } catch (err) {
    console.error('Error deactivating staff:', err)
  }
}

const activateStaff = async (id) => {
  const staffId = id || staffToDeactivate.value?.id
  if (!staffId) return

  try {
    await staffStore.updateStaff(staffId, { is_active: true })
    if (staffToDeactivate.value) {
      showConfirmDialog.value = false
      staffToDeactivate.value = null
    }
  } catch (err) {
    console.error('Error activating staff:', err)
  }
}

const handleStaffSaved = () => {
  showStaffForm.value = false
  editingStaff.value = null
  fetchStaff()
}

const closeModal = () => {
  showStaffForm.value = false
  editingStaff.value = null
  showConfirmDialog.value = false
  staffToDeactivate.value = null
}

// Activity Log Methods
const fetchActivities = async () => {
  try {
    await activityStore.fetchActivities()
  } catch (err) {
    console.error('Error fetching activities:', err)
  }
}

const isUserOnline = (userId) => {
  return activityStore.onlineUsers.has(userId)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

const formatLastSeen = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

const formatRole = (role) => {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff'
}

const getActivityMessage = (activity) => {
  const user = activity.user || { first_name: 'System', last_name: '' }
  const userName = user.first_name ? `${user.first_name} ${user.last_name}`.trim() : 'System'
  const details = activity.details || {}

  switch (activity.activity_type) {
    case 'hog_added':
      return `${userName} added a new hog (${details.code || 'Unknown'})`
    case 'hog_updated':
      return `${userName} updated hog ${details.code || ''}`
    case 'hog_deleted':
      return `${userName} deleted hog ${details.code || ''}`
    case 'hog_weight_updated':
      return `${userName} updated weight for hog ${details.code || ''} from ${details.oldWeight}kg to ${details.newWeight}kg (${details.difference > 0 ? '+' : ''}${details.difference}kg)`
    case 'feeding_completed':
      return `${userName} marked feeding as complete for hog ${details.code || ''}`
    case 'feeding_incomplete':
      return `${userName} marked feeding as incomplete for hog ${details.code || ''}`
      return `Added new staff: ${details.staff_name || 'New User'}`
    case 'staff_deactivated':
      return `Deactivated staff: ${details.staff_name || 'User'}`
    default:
      return 'Performed an action'
  }
}

const getActivityClass = (type) => ({
  'activity-login': type === 'login',
  'activity-logout': type === 'logout',
  'activity-hog-feed': type === 'hog_fed',
  'activity-hog-undo': type === 'hog_feeding_undone',
  'activity-update':
    type === 'staff_updated' || type === 'staff_added' || type === 'staff_deactivated',
  'activity-other': ![
    'login',
    'logout',
    'hog_fed',
    'hog_feeding_undone',
    'staff_updated',
    'staff_added',
    'staff_deactivated',
  ].includes(type),
})

// Lifecycle Hooks
onMounted(async () => {
  await Promise.all([fetchStaff(), fetchActivities()])
  // Set up realtime subscription
  const unsubscribe = activityStore.subscribeToActivities()
  
  // Clean up subscription on unmount
  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })

  // Set up realtime subscription to user changes
  const userSubscription = supabase
    .channel('users-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
      },
      (payload) => {
        console.log('User change detected:', payload)
        fetchStaff() // Refresh staff list on any user change
      },
    )
    .subscribe()

  // Clean up subscription on component unmount
  onUnmounted(() => {
    supabase.removeChannel(userSubscription)
  })
})

// Watch for filter changes
watch([statusFilter, roleFilter], () => {
  currentPage.value = 1
  fetchStaff()
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1.5rem;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #2f8b60;
}

.tab.active {
  color: #2f8b60;
  border-bottom-color: #2f8b60;
}

/* Staff Management */
.staff-management {
  padding: 1rem 0;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
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
  pointer-events: none;
}

.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: #555;
  white-space: nowrap;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
  min-width: 120px;
}

/* Staff Grid */
.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
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
  position: relative;
  border: 1px solid #eee;
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
  flex-shrink: 0;
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
  min-width: 0;
}

.staff-info h3 {
  margin: 0 0 0.25rem;
  color: #2c3e50;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.staff-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: auto;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Pagination */
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

/* Activity Log */
.activity-log {
  padding: 1rem 0;
}

.activity-filters {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1rem;
}

.filter-btn {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: #f5f5f5;
}

.filter-btn.active {
  background: #2f8b60;
  color: white;
  border-color: #2f8b60;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 1rem 1rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.activity-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
  position: relative;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background-color: #2ecc71;
}

.status-indicator.offline {
  background-color: #95a5a6;
}

.activity-details {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.staff-name {
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 0.5rem;
}

.activity-time {
  font-size: 0.8rem;
  color: #7f8c8d;
  white-space: nowrap;
}

.activity-message {
  font-size: 0.9rem;
  color: #555;
  word-break: break-word;
}

/* Activity Type Classes */
.activity-login {
  color: #2ecc71;
}

.activity-logout {
  color: #e74c3c;
}

.activity-hog-feed {
  color: #3498db;
}

.activity-hog-undo {
  color: #e67e22;
}

.activity-update {
  color: #9b59b6;
}

.activity-other {
  color: #7f8c8d;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

/* Confirm Dialog */
.confirm-dialog {
  padding: 1.5rem;
  text-align: center;
}

.confirm-dialog h3 {
  margin: 0 0 1rem;
  color: #2c3e50;
  font-size: 1.25rem;
}

.confirm-dialog p {
  margin: 0 0 1.5rem;
  color: #555;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #2f8b60;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #26734d;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
}

/* Loading and Error States */
.loading,
.loading-spinner,
.error,
.error-message,
.no-results,
.no-activities {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
  background: white;
  border-radius: 8px;
  margin: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error,
.error-message {
  color: #e74c3c;
  background-color: #fde8e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #e0e0e0;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .staff-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .filters {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-content {
    max-width: 100%;
    margin: 0 1rem;
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.filter-btn {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #2f8b60;
  color: white;
  border-color: #2f8b60;
}

.activity-list {
  padding: 0 4px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-avatar {
  position: relative;
  margin-right: 12px;
}

.activity-avatar img,
.default-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  border: 2px solid white;
}

.status-indicator.online {
  background: #4caf50;
}

.activity-details {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.staff-name {
  font-weight: 600;
  font-size: 14px;
}

.activity-time {
  font-size: 12px;
  color: #888;
}

.activity-message {
  font-size: 13px;
  color: #555;
}

.activity-login {
  color: #10b981;
}

.activity-logout {
  color: #ef4444;
}

.activity-hog-feed {
  color: #3b82f6;
}

.activity-hog-undo {
  color: #f59e0b;
}

.activity-other {
  color: #6b7280;
}

.activity-item {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.activity-login .activity-item {
  border-left-color: #10b981;
}

.activity-logout .activity-item {
  border-left-color: #ef4444;
}

.activity-hog-feed .activity-item {
  border-left-color: #3b82f6;
}

.activity-hog-undo .activity-item {
  border-left-color: #f59e0b;
}

.loading-spinner,
.no-activities,
.error-message {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 14px;
}

.error-message {
  color: #e74c3c;
}

.retry-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: #2f8b60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #26734d;
}

.screen {
  min-height: 100vh;
  background: #2f8b60;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px; /* Space for bottom bar */
}

.panel {
  background: #fff;
  margin: 16px;
  border-radius: 18px;
  padding: 20px 16px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.panel-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}
.panel-illustration {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.title-wrap {
  display: flex;
  flex-direction: column;
}
.title-lg {
  font-weight: 700;
  font-size: 24px;
  line-height: 1.05;
  margin: 0;
}
.sub {
  color: #7a8b99;
  margin-top: 6px;
}
.list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  width: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}
.avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #2f8b6015;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title {
  font-weight: 600;
}
.muted {
  color: #7a8b99;
}
.chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: #2f8b6015;
  color: #2f8b60;
  border-radius: 999px;
  font-size: 20px;
}
button {
  cursor: pointer;
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

/* Bottom Bar */
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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
</style>
