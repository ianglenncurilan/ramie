<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Staff Activity</h2>
          <p class="sub">Track staff logins and activity</p>
        </div>
        <img class="panel-illustration" src="/staff.png" alt="icon" />
      </div>

        <div class="activity-filters">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            :class="['filter-btn', { active: currentFilter === filter.value }]"
            @click="currentFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="activity-list" v-if="!loading">
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
                >
                <div v-else class="default-avatar">
                  {{ getInitials(activity.profiles?.full_name || 'U') }}
                </div>
                <div 
                  class="status-indicator" 
                  :class="{ 'online': isUserOnline(activity.user_id) }"
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
        
        <div v-else-if="loading" class="loading-spinner">
          Loading activities...
        </div>
        <div v-else-if="error" class="error-message">
          {{ error }}
          <button @click="fetchActivities" class="retry-btn">Retry</button>
        </div>
    </section>
    <BottomBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStaffActivities } from '@/services/staffService'
import BottomBar from '@/components/BottomBar.vue'

const router = useRouter()
const activities = ref([])
const loading = ref(true)
const onlineUsers = ref(new Set())

// Activity filters
const currentFilter = ref('all')
const filters = [
  { label: 'All', value: 'all' },
  { label: 'Logins', value: 'login' },
  { label: 'Logouts', value: 'logout' }
]

const error = ref(null)

// Fetch staff activities
const fetchActivities = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await getStaffActivities()
    console.log('Fetched activities:', data) // Debug log
    activities.value = data || []
  } catch (err) {
    console.error('Error fetching activities:', err)
    error.value = 'Failed to load activities. Please try again later.'
    activities.value = []
  } finally {
    loading.value = false
  }
}

// Track online users (you'll need to implement real-time updates for this)
const isUserOnline = (userId) => {
  return onlineUsers.value.has(userId)
}

// Format time
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Get user initials
const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Get activity message
const getActivityMessage = (activity) => {
  switch (activity.activity_type) {
    case 'login':
      return 'Logged in to the system'
    case 'logout':
      return 'Logged out from the system'
    default:
      return 'Performed an action'
  }
}

// Get activity class
const getActivityClass = (type) => ({
  'activity-login': type === 'login',
  'activity-logout': type === 'logout',
  'activity-other': !['login', 'logout'].includes(type)
})

// Filter activities based on current filter
const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') return activities.value
  return activities.value.filter(act => act.activity_type === currentFilter.value)
})

// Set up real-time subscription (you'll need to implement this)
const setupRealtime = () => {
  // This is a placeholder - you'll need to implement real-time updates
  // using Supabase's realtime subscription
  // Example:
  /*
  const subscription = supabase
    .channel('staff_activities')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_activities' }, payload => {
      fetchActivities()
    })
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
  */
}

onMounted(async () => {
  await fetchActivities()
  setupRealtime()
})

// Log activity when component is unmounted (for demo purposes)
onUnmounted(() => {
  // In a real app, you'd want to log this when the user actually logs out
  // logStaffActivity(currentUserId, 'logout')
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.activity-filters {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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

.activity-avatar img, .default-avatar {
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
  color: #4caf50;
}

.activity-logout {
  color: #f44336;
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
