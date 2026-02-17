<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Activity Log</h2>
          <p class="sub">Track system activities and events</p>
        </div>
        <img class="panel-illustration" src="/staff.png" alt="icon" />
      </div>

      <!-- Activity Log View -->
      <div class="activity-log">
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
                  v-if="activity.users?.avatar_url"
                  :src="activity.users.avatar_url"
                  :alt="activity.users.full_name || 'User'"
                  class="avatar-img"
                />
                <div v-else class="default-avatar">
                  {{ getInitials(activity.users?.full_name || 'S') }}
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
                    {{ activity.users?.full_name || 'System' }}
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '@/stores/activityStore'
import { supabase } from '@/supabase'

const router = useRouter()

// Activity Log State
const activityStore = useActivityStore()
const activityLoading = computed(() => activityStore.loading)
const currentFilter = ref('all')
const activityFilters = [
  { label: 'All', value: 'all' },
  { label: 'Hog Added', value: 'hog_added' },
  { label: 'Hog Deleted', value: 'hog_deleted' },
  { label: 'Feeding Completed', value: 'feeding_completed' },
  { label: 'Feeding Incomplete', value: 'feeding_incomplete' },
  { label: 'Weight Updated', value: 'hog_weight_updated' },
]

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') {
    return activityStore.activities
  }
  return activityStore.activities.filter(
    (activity) => activity.activity_type === currentFilter.value,
  )
})

// Activity Log Methods
const fetchActivities = async () => {
  try {
    console.log('Fetching activities...')
    await activityStore.fetchActivities()
    // Debug log the activities from the store
    console.log('Activities from store:', activityStore.activities)
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

const formatRole = (user) => {
  if (!user) return 'Staff'

  // Check if role is directly on the user object
  if (user.role) {
    return user.role === 'manager' ? 'Admin' : 'Staff'
  }

  // Check in raw_app_meta_data
  if (user.raw_app_meta_data?.role) {
    return user.raw_app_meta_data.role === 'admin' ? 'Admin' : 'Staff'
  }

  // Default to Staff if no role is found
  return 'Staff'
}

const getActivityMessage = (activity) => {
  const details = activity.details || {}

  switch (activity.activity_type) {
    case 'hog_added':
      return `Added a new hog (${details.code || 'Unknown'})`
    case 'hog_updated':
      return `Updated hog ${details.code || ''}`
    case 'hog_edited': {
      const field = details.field || 'information'
      const oldValue = details.old_value !== undefined ? details.old_value : 'previous value'
      const newValue = details.new_value !== undefined ? details.new_value : 'new value'
      return `Edited ${details.hog_code || ''} ${field}: ${oldValue} → ${newValue}`
    }
    case 'hog_deleted':
      return `Deleted hog ${details.code || ''}`
    case 'hog_weight_updated': {
      const hasDiff = typeof details.difference === 'number' && details.difference !== 0
      const diffText = hasDiff
        ? ` (${details.difference > 0 ? '+' : ''}${details.difference}kg)`
        : ''
      return `Updated weight for hog ${details.code || ''} from ${details.oldWeight}kg to ${details.newWeight}kg${diffText}`
    }
    case 'feeding_completed':
      return `Marked feeding as complete for hog ${details.code || ''}`
    case 'feeding_incomplete':
      return `Marked feeding as incomplete for hog ${details.code || ''}`
    case 'feed_formulated': {
      // Show: Made Starter Feed / Made Grower Feed / Made Finisher Feed
      const stageRaw = details.stage || ''
      const stage = stageRaw ? stageRaw.charAt(0).toUpperCase() + stageRaw.slice(1) : 'Feed'
      return `Made ${stage} Feed`
    }
    case 'inventory_added': {
      const qty =
        typeof details.quantity === 'number' ? details.quantity : Number(details.quantity) || 0
      const name = details.name || 'Ingredient'
      const cost = typeof details.cost === 'number' ? details.cost : Number(details.cost) || 0
      return `Added ${qty} of ${name} with a cost of ₱${cost.toFixed(2)}`
    }
    case 'inventory_updated': {
      const name = details.name || 'Ingredient'
      const oq =
        typeof details.oldQuantity === 'number'
          ? details.oldQuantity
          : Number(details.oldQuantity) || 0
      const nq =
        typeof details.newQuantity === 'number'
          ? details.newQuantity
          : Number(details.newQuantity) || 0
      const oc =
        typeof details.oldCost === 'number' ? details.oldCost : Number(details.oldCost) || 0
      const nc =
        typeof details.newCost === 'number' ? details.newCost : Number(details.newCost) || 0
      return `Edited ${name}: quantity ${oq} → ${nq}, cost ₱${oc.toFixed(2)} → ₱${nc.toFixed(2)}`
    }
    case 'inventory_deleted': {
      const qty =
        typeof details.quantity === 'number' ? details.quantity : Number(details.quantity) || 0
      const name = details.name || 'Ingredient'
      const cost = typeof details.cost === 'number' ? details.cost : Number(details.cost) || 0
      return `Deleted ${qty} of ${name} with a cost of ₱${cost.toFixed(2)}`
    }
    case 'staff_deactivated':
      return `Deactivated staff: ${details.staff_name || 'User'}`
    case 'staff_added':
      return `Added new staff: ${details.staff_name || 'New User'}`
    case 'staff_updated':
      return `Updated staff: ${details.staff_name || 'User'}`
    case 'hog_unsold':
      return `Reinstated hog ${details.hog_code || ''} (previously sold)`
    case 'hog_sold': {
      const price =
        typeof details.sale_price === 'number'
          ? details.sale_price
          : Number(details.sale_price) || 0
      const weight =
        typeof details.weight === 'number' ? details.weight : Number(details.weight) || 0
      const buyer = details.buyer || 'Unknown buyer'
      return `Sold hog ${details.hog_code || ''} for ₱${price.toFixed(2)} (${weight}kg) to ${buyer}`
    }
    case 'hog_died': {
      const cause = details.cause || 'Unknown cause'
      const notes = details.notes ? ` (${details.notes})` : ''
      return `Marked hog ${details.hog_code || ''} as deceased - ${cause}${notes}`
    }
    default: {
      const base = String(activity.activity_type || 'action')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
      return base
    }
  }
}

const getActivityClass = (type) => ({
  'activity-login': type === 'login',
  'activity-logout': type === 'logout',
  'activity-hog-feed': type === 'hog_fed',
  'activity-hog-undo': type === 'hog_feeding_undone',
  'activity-hog-sold': type === 'hog_sold',
  'activity-hog-died': type === 'hog_died',
  'activity-hog-edited': type === 'hog_edited',
  'activity-update':
    type === 'staff_updated' ||
    type === 'staff_added' ||
    type === 'staff_deactivated' ||
    type === 'hog_edited',
  'activity-other': ![
    'login',
    'logout',
    'hog_fed',
    'hog_feeding_undone',
    'hog_sold',
    'hog_died',
    'hog_edited',
    'staff_updated',
    'staff_added',
    'staff_deactivated',
  ].includes(type),
})

onMounted(async () => {
  // Initial fetch
  await fetchActivities()

  // Set up realtime subscription
  const unsubscribe = activityStore.subscribeToActivities()

  // Clean up on unmount
  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
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
  background: #f4f4f4;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px; /* Space for bottom bar */
}

.panel {
  background: #fff;
  margin: 12px;
  border-radius: 18px;
  padding: 20px 16px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 1200px;
  width: 85%;
  margin-left: auto;
  margin-right: auto;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
