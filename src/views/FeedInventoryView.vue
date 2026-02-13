<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Feed Inventory</h2>
          <p class="sub">Intelligent feed management & analytics</p>
        </div>
        <div class="header-actions">
          <button @click="refreshInventory" class="refresh-btn" title="Refresh inventory">
            🔄
          </button>
          <img class="panel-illustration" src="/inventory.png" alt="icon" />
        </div>
      </div>

      <!-- Stock Status Cards -->
      <div class="stock-overview">
        <div class="days-remaining-card" :class="feedInventory.stockStatus">
          <div class="days-number">{{ Math.floor(feedInventory.daysRemaining) }}</div>
          <div class="days-label">Days Remaining</div>
          <div class="depletion-date" v-if="feedInventory.depletionDate">
            Depletes: {{ formatDate(feedInventory.depletionDate) }}
          </div>
        </div>

        <div class="stock-cards">
          <div
            v-for="(stock, category) in stockLevels"
            :key="category"
            class="stock-card"
            :class="feedInventory.stockStatusByCategory[category]"
          >
            <div class="category-info">
              <div class="category-name">{{ capitalizeFirst(category) }}</div>
              <div class="stock-amount">{{ stock.toFixed(1) }} kg</div>
            </div>
            <div class="category-status">
              <div
                class="status-indicator"
                :class="feedInventory.stockStatusByCategory[category]"
              ></div>
              <div class="status-text">
                {{ getStatusText(feedInventory.stockStatusByCategory[category]) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Hogs Display -->
      <div class="total-hogs-section">
        <div class="total-hogs-card">
          <div class="hogs-icon">🐷</div>
          <div class="hogs-info">
            <div class="hogs-number">{{ totalHogs }}</div>
            <div class="hogs-label">Total Active Hogs</div>
          </div>
        </div>
      </div>

      <!-- Daily Consumption & Category Breakdown -->
      <div class="analytics-section">
        <div class="consumption-card">
          <h3>Daily Consumption</h3>
          <div class="consumption-total">
            {{ feedInventory.dailyConsumption.toFixed(2) }} kg/day
          </div>

          <div class="category-breakdown">
            <div
              v-for="(data, category) in feedInventory.categoryBreakdown"
              :key="category"
              class="breakdown-item"
            >
              <div class="category-label">{{ capitalizeFirst(category) }}</div>
              <div class="category-data">
                <span class="count">{{ data.count }} hogs</span>
                <span class="consumption">{{ data.dailyKg.toFixed(2) }} kg/day</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications/Alerts Section -->
        <div class="notifications-section">
          <h3>Notifications & Alerts</h3>
          <div class="notifications-list">
            <!-- Low Stock Alerts -->
            <div
              v-for="(alert, index) in stockAlerts"
              :key="'stock-' + index"
              class="notification-item stock-alert"
              :class="{ critical: alert.type === 'critical' }"
            >
              <div class="notification-icon">⚠️</div>
              <div class="notification-content">
                <div class="notification-title">{{ alert.title }}</div>
                <div class="notification-message">{{ alert.message }}</div>
                <div class="notification-time">{{ alert.time }}</div>
              </div>
              <div class="notification-actions">
                <button
                  v-if="alert.category"
                  @click="goToFeedCalculator(alert.category)"
                  class="action-btn primary"
                >
                  Make Feed
                </button>
                <button @click="dismissNotification('stock', index)" class="action-btn secondary">
                  Dismiss
                </button>
              </div>
            </div>

            <!-- System Notifications -->
            <div
              v-for="(notification, index) in systemNotifications"
              :key="'system-' + index"
              class="notification-item system-notification"
            >
              <div class="notification-icon">📢</div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
              <div class="notification-actions">
                <button @click="dismissNotification('system', index)" class="action-btn secondary">
                  Dismiss
                </button>
              </div>
            </div>

            <!-- No Notifications State -->
            <div
              v-if="stockAlerts.length === 0 && systemNotifications.length === 0"
              class="no-notifications"
            >
              <div class="no-notifications-icon">✅</div>
              <div class="no-notifications-text">All systems operational</div>
              <div class="no-notifications-subtext">No alerts or notifications at this time</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Stock Alert Prompt -->
      <div v-if="showAlert" class="low-stock-alert-prompt">
        <div class="alert-content">
          <div class="alert-icon">🚨</div>
          <div class="alert-message">
            <strong>Feed Stock Alert!</strong>
            <p>{{ alertMessage }}</p>
          </div>
          <div class="alert-actions">
            <button
              v-if="alertCategory !== 'overall'"
              @click="goToFeedCalculator(alertCategory)"
              class="make-feed-btn"
            >
              Make {{ alertCategory.charAt(0).toUpperCase() + alertCategory.slice(1) }} Feed
            </button>
            <button @click="dismissAlert" class="dismiss-btn">Dismiss</button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="feedInventory.loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Updating inventory...</p>
      </div>

      <!-- Error State -->
      <div v-if="feedInventory.error" class="error-alert">
        <div class="error-icon">❌</div>
        <div class="error-message">
          <strong>Error:</strong>
          <p>{{ feedInventory.error }}</p>
          <button @click="feedInventory.clearError" class="dismiss-btn">Dismiss</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedInventoryStore } from '../stores/feedInventory'
import { useHogsStore } from '../stores/hogs'

const router = useRouter()
const feedInventory = useFeedInventoryStore()
const hogsStore = useHogsStore()

// Notification state
const stockAlerts = ref([])
const systemNotifications = ref([])

// Alert state
const showAlert = ref(false)
const alertMessage = ref('')
const alertCategory = ref('')

// Refresh inventory manually
const refreshInventory = async () => {
  console.log('🔄 Manual refresh triggered')
  await feedInventory.fetchFeedInventory()
}

// Computed properties
const totalStock = computed(() => feedInventory.totalStock)
const totalHogs = computed(() => hogsStore.getStats().totalHogs)

// Reactive stock levels to ensure UI updates
const stockLevels = computed(() => feedInventory.feedStock)

// Check for low stock alerts
const checkLowStockAlerts = () => {
  const categories = ['starter', 'grower', 'finisher']

  for (const category of categories) {
    const stock = feedInventory.feedStock[category]
    const status = feedInventory.stockStatusByCategory[category]
    const daysRemaining = feedInventory.daysRemaining

    // Alert if stock is low or critical
    if (status === 'low' || status === 'critical') {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
      alertMessage.value = `⚠️ Low ${categoryName} feed stock! Current stock: ${stock.toFixed(1)}kg. You need to make more ${categoryName} feed to avoid running out.`
      alertCategory.value = category
      showAlert.value = true
      return // Show only one alert at a time
    }
  }

  // Also check overall days remaining
  if (feedInventory.daysRemaining < 7) {
    alertMessage.value = `⚠️ Feed stocks will run out in ${Math.floor(feedInventory.daysRemaining)} days! Consider making more feed soon.`
    alertCategory.value = 'overall'
    showAlert.value = true
  }
}

// Dismiss alert
const dismissAlert = () => {
  showAlert.value = false
  alertMessage.value = ''
  alertCategory.value = ''
}

// Navigate to feed calculator
const goToFeedCalculator = (category) => {
  const routeName = category + '-feed-calculator' // Maps to router names
  router.push({ name: routeName })
  dismissAlert()
}

// Methods
const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusText = (status) => {
  const statusMap = {
    critical: 'Critical',
    low: 'Low',
    moderate: 'Moderate',
    good: 'Good',
    unknown: 'Unknown',
  }
  return statusMap[status] || 'Unknown'
}

// Generate stock alerts
const generateStockAlerts = () => {
  const alerts = []
  const categories = ['starter', 'grower', 'finisher']

  // Add general low stock alert if hasLowStock is true
  if (feedInventory.hasLowStock) {
    alerts.push({
      title: 'Low Stock Alert',
      message:
        'One or more feed categories will run out within 7 days. Consider replenishing soon.',
      category: null,
      time: 'Just now',
      type: 'warning',
    })
  }

  for (const category of categories) {
    const stock = feedInventory.feedStock[category]
    const status = feedInventory.stockStatusByCategory[category]

    if (status === 'critical') {
      alerts.push({
        title: `Critical ${capitalizeFirst(category)} Feed`,
        message: `Stock critically low: ${stock.toFixed(1)}kg remaining. Immediate action required.`,
        category: category,
        time: 'Just now',
        type: 'critical',
      })
    } else if (status === 'low') {
      alerts.push({
        title: `Low ${capitalizeFirst(category)} Feed`,
        message: `Stock running low: ${stock.toFixed(1)}kg remaining. Consider replenishing soon.`,
        category: category,
        time: 'Just now',
        type: 'warning',
      })
    }
  }

  // Overall stock alert
  if (feedInventory.daysRemaining < 7) {
    alerts.push({
      title: 'Overall Feed Stock Alert',
      message: `All feed stocks will run out in ${Math.floor(feedInventory.daysRemaining)} days.`,
      category: null,
      time: 'Just now',
      type: 'warning',
    })
  }

  return alerts
}

// Generate system notifications
const generateSystemNotifications = () => {
  const notifications = []

  // Add success notification when inventory is updated
  if (feedInventory.lastUpdated) {
    notifications.push({
      title: 'Inventory Updated',
      message: `Feed inventory successfully refreshed with latest data.`,
      time: formatTime(feedInventory.lastUpdated),
      type: 'info',
    })
  }

  return notifications
}

// Format time for notifications
const formatTime = (date) => {
  if (!date) return 'Unknown'
  const now = new Date()
  const notificationTime = new Date(date)
  const diffMs = now - notificationTime
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
  return `${Math.floor(diffMins / 1440)} days ago`
}

// Update notifications
const updateNotifications = () => {
  stockAlerts.value = generateStockAlerts()
  systemNotifications.value = generateSystemNotifications()
}

// Dismiss notification
const dismissNotification = (type, index) => {
  if (type === 'stock') {
    stockAlerts.value.splice(index, 1)
  } else if (type === 'system') {
    systemNotifications.value.splice(index, 1)
  }
}

// Watch for changes in hogs data and recalculate analytics
watch(
  () => hogsStore.hogs,
  async () => {
    if (hogsStore.hogs.length > 0) {
      await feedInventory.calculateAnalytics()
    }
  },
  { deep: true },
)

// Watch for stock level changes to force UI update
watch(
  () => feedInventory.feedStock,
  (newStock, oldStock) => {
    console.log('🔄 Feed stock levels changed:', { old: oldStock, new: newStock })
    // Update notifications when stock changes
    updateNotifications()
  },
  { deep: true },
)

// Lifecycle
onMounted(async () => {
  // First fetch hogs, then calculate feed analytics
  await hogsStore.fetchHogs('all') // Fetch all hogs to include active and in-progress

  // Wait a moment to ensure hogs are fully loaded
  await new Promise((resolve) => setTimeout(resolve, 100))

  await feedInventory.fetchFeedInventory()

  // Update notifications after loading
  updateNotifications()

  // Listen for feed inventory changes
  const handleStorageChange = (e) => {
    if (e.key === 'feed-inventory-updated') {
      console.log(' Feed inventory updated, refreshing...')
      feedInventory.fetchFeedInventory()
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // Custom event listener for same-tab updates
  window.addEventListener('feedInventoryUpdated', () => {
    console.log(' Feed inventory updated via custom event, refreshing...')
    feedInventory.fetchFeedInventory()
  })
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.screen {
  padding: 16px;
  background: #f8f9fa;
  min-height: 100vh;
}

.panel {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 1200px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back:hover {
  background: #f0f0f0;
}

.title-wrap {
  flex: 1;
  text-align: center;
}

.title-lg {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.sub {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.panel-illustration {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

/* Stock Overview */
.stock-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
}

.days-remaining-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.days-number {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.days-label {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.depletion-date {
  font-size: 14px;
  opacity: 0.8;
}

.stock-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stock-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stock-card.critical {
  border-color: #dc3545;
  background: #f8d7da;
}

.stock-card.low {
  border-color: #ffc107;
  background: #fff3cd;
}

.stock-card.moderate {
  border-color: #17a2b8;
  background: #d1ecf1;
}

.stock-card.good {
  border-color: #28a745;
  background: #d4edda;
}

.category-info {
  margin-bottom: 12px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stock-amount {
  font-size: 24px;
  font-weight: 700;
  color: #2f8b60;
}

.category-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.critical {
  background: #dc3545;
}
.status-indicator.low {
  background: #ffc107;
}
.status-indicator.moderate {
  background: #17a2b8;
}
.status-indicator.good {
  background: #28a745;
}
.status-indicator.unknown {
  background: #6c757d;
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Total Hogs Section */
.total-hogs-section {
  margin-bottom: 24px;
}

.total-hogs-card {
  background: rgb(237, 237, 237) ;
  color:#2f8b60;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(238, 90, 36, 0.2);
}

.hogs-icon {
  font-size: 32px;
  opacity: 0.9;
}

.hogs-info {
  flex: 1;
}

.hogs-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 4px;
}

.hogs-label {
  font-size: 16px;
  opacity: 0.9;
}

/* Analytics Section */
.analytics-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.consumption-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
}

.consumption-card h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
}

.consumption-total {
  font-size: 32px;
  font-weight: 700;
  color: #2f8b60;
  margin-bottom: 20px;
  text-align: center;
}

.category-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.category-label {
  font-weight: 600;
  color: #2c3e50;
}

.category-data {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.count {
  font-size: 14px;
  color: #6c757d;
}

.consumption {
  font-weight: 600;
  color: #2f8b60;
}

/* Notifications Section */
.notifications-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
}

.notifications-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-item.stock-alert {
  border-left: 4px solid #ffc107;
}

.notification-item.stock-alert.critical {
  border-left: 4px solid #e70017;
  background: #fffefe;
}

.notification-item.system-notification {
  border-left: 4px solid #17a2b8;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.notification-message {
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  color: #adb5bd;
  font-size: 12px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn.primary {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.action-btn.primary:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.action-btn.secondary:hover {
  background: #e9ecef;
  color: #495057;
}

.no-notifications {
  text-align: center;
  padding: 32px 16px;
  color: #6c757d;
}

.no-notifications-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.no-notifications-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.no-notifications-subtext {
  font-size: 14px;
  opacity: 0.8;
}

/* Alerts */
.low-stock-alert,
.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.low-stock-alert {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.error-alert {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.low-stock-alert-prompt {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 1px solid #f5c6cb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.alert-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
}

.make-feed-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.make-feed-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.alert-message strong {
  color: #721c24;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.alert-message p {
  color: #721c24;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.alert-icon,
.error-icon {
  font-size: 24px;
}

.alert-message,
.error-message {
  flex: 1;
}

.alert-message p,
.error-message p {
  margin: 8px 0 0 0;
}

.dismiss-btn {
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2f8b60;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .stock-overview {
    grid-template-columns: 1fr;
  }

  .analytics-section {
    grid-template-columns: 1fr;
  }

  .stock-cards {
    grid-template-columns: 1fr;
  }
}
</style>
