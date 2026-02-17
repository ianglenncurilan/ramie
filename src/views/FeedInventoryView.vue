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
          <div v-if="isSyncing" class="syncing-indicator" title="Syncing data...">
            <div class="sync-spinner"></div>
            <span class="sync-text">Syncing...</span>
          </div>

          <img class="panel-illustration" src="/inventory.png" alt="icon" />
        </div>
      </div>

      <!-- Feed Forecast Section -->
      <div class="forecast-section">
        <h3>Feed Forecast by Stage</h3>
        <div class="forecast-grid">
          <div
            v-for="(stock, category) in feedInventory.feedStock"
            :key="category"
            class="forecast-item"
            :class="getForecastClass(category)"
          >
            <div class="forecast-header">
              <div class="forecast-icon">{{ getFeedIcon(category) }}</div>
              <div class="forecast-title">{{ capitalizeFirst(category) }} Feed</div>
            </div>
            <div class="forecast-details">
              <div class="stock-amount">
                <span class="stock-value">{{ stock.toFixed(1) }}</span>
                <span class="stock-unit">kg remaining</span>
              </div>
              <div class="days-remaining">
                <span class="days-value">{{ getDaysRemainingForCategory(category) }}</span>
                <span class="days-unit">days</span>
              </div>
              <div class="consumption-rate">
                <span class="rate-value">{{ getCategoryConsumptionRate(category) }}</span>
                <span class="rate-unit">kg/day</span>
              </div>
              <div class="depletion-date">
                <span class="date-label">Depletion:</span>
                <span class="date-value">{{ getDepletionDateForCategory(category) }}</span>
              </div>
            </div>
            <div class="forecast-status" :class="getForecastClass(category)">
              {{ getForecastStatus(category) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Total Hogs Display & Notifications -->
      <div class="top-row-section">
        <div class="left-column">
          <div class="consumpdivn-card">
            <h3>Daily Consumption</h3>

            <div class="category-breakdown">
              <div
                v-for="(data, category) in feedInventory.categoryBreakdown"
                :key="category"
                class="breakdown-item"
              >
                <div class="category-label">{{ capitalizeFirst(category) }}</div>
                <div class="category-data">
                  <span class="count">{{ data.count }} active hogs</span>
                  <span class="consumption">{{ data.dailyKg.toFixed(2) }} kg/day</span>
                  <span class="daily-cost"
                    >{{
                      formatCurrency(dailyConsumptionCostByCategory[category]?.dailyCost || 0)
                    }}/day</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="right-column">
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
                  <button
                    @click="dismissNotification('system', index)"
                    class="action-btn secondary"
                  >
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
      </div>

      <!-- Daily Consumption & Category Breakdown -->

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
      <!-- Feed Cost Analysis Section -->
      <div class="feed-cost-section">
        <h3>💰 Feed Cost Analysis</h3>

        <div class="cost-breakdown">
          <div class="breakdown-title">Cost Breakdown by Feed Type</div>

          <!-- Daily Cost Analysis Cards -->

          <!-- Original Cost Breakdown Grid -->
          <div class="breakdown-grid">
            <div
              v-for="(cost, category) in feedCostAnalysis.costByCategory"
              :key="category"
              class="breakdown-item"
            >
              <div class="category-header">
                <div class="category-name">{{ capitalizeFirst(category) }}</div>
              </div>
              <div class="category-details">
                <div class="detail-row">
                  <span>Total kg:</span>
                  <span>{{ cost.totalKg.toFixed(1) }} kg</span>
                </div>
                <div class="detail-row">
                  <span>Total cost:</span>
                  <span>{{ formatCurrency(cost.totalCost) }}</span>
                </div>
                <div class="detail-row">
                  <span>Daily cost:</span>
                  <span class="daily-cost"
                    >{{
                      formatCurrency(dailyConsumptionCostByCategory[category]?.dailyCost || 0)
                    }}/day</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedInventoryStore } from '../stores/feedInventory'
import { useHogsStore } from '../stores/hogs'
import { useFeedsStore } from '../stores/feeds'
import { useAlertModal } from '../composables/useAlertModal'
import { useFarmData } from '../composables/useFarmData'
import {
  getConsumptionRate,
  getCategoryBreakdown,
  predictDepletionDate,
} from '../services/feedInventoryService'

const router = useRouter()
const feedInventory = useFeedInventoryStore()
const hogsStore = useHogsStore()
const feedsStore = useFeedsStore()
const { showSuccess, showWarning, showError } = useAlertModal()

// Use farm data composable for shared state and sync
const { isSyncing, lastSyncTime, syncError, refreshAllData, setupRealtimeSubscriptions } =
  useFarmData()

// Store cleanup function for realtime subscriptions
let cleanupRealtime = null

// Notification state
const stockAlerts = ref([])
const systemNotifications = ref([])

// Alert state
const showAlert = ref(false)
const alertMessage = ref('')
const alertCategory = ref('')

// Refresh inventory manually - uses shared refresh function
const refreshInventory = async () => {
  console.log('🔄 Manual refresh triggered')
  try {
    await refreshAllData()
    showSuccess('Inventory refreshed successfully')
  } catch (error) {
    console.error('Error refreshing inventory:', error)
    showError('Failed to refresh inventory')
  }
}

// Computed properties
const totalStock = computed(() => feedInventory.totalStock)
const totalHogs = computed(() => hogsStore.getStats().totalHogs)

// Reactive stock levels to ensure UI updates
const stockLevels = computed(() => feedInventory.feedStock)

// Calculate Daily Feed Cost using Vue 3 Composition API
const calculateDailyFeedCost = computed(() => {
  // Get category breakdown for consumption
  const categoryBreakdown = getCategoryBreakdown(
    hogsStore.hogs?.filter((hog) => hog.status === 'active') || [],
  )

  const dailyCostByCategory = {}

  Object.keys(categoryBreakdown).forEach((category) => {
    // Data Structure from feed_inventory
    const totalKgRemaining = feedInventory.feedStock[category] || 0

    // Fix division by zero - use safe calculation
    const totalCost = feedInventory.totalCost || 0
    const totalStock = feedInventory.totalStock || 1 // Prevent division by zero
    const costPerKg = totalStock > 0 ? totalCost / totalStock : 0

    const totalCostRemaining = totalKgRemaining * costPerKg
    const activeHogCount = categoryBreakdown[category]?.count || 0
    const totalDailyKg = categoryBreakdown[category]?.dailyKg || 0

    // Calculate daily consumption per hog
    const dailyConsumptionPerHog = activeHogCount > 0 ? totalDailyKg / activeHogCount : 0

    // Edge Case: Handle DivisionByZero if consumption is 0
    if (totalDailyKg === 0 || activeHogCount === 0) {
      dailyCostByCategory[category] = {
        daysRemaining: 0,
        dailyCost: 0,
        totalDailyKg: 0,
        isDepleted: totalKgRemaining === 0,
        totalKgRemaining,
        totalCostRemaining,
        dailyConsumptionPerHog,
        activeHogCount,
      }
      return
    }

    // Days Until Depletion: days_remaining = (total_kg_remaining / total_daily_kg)
    const daysRemaining = totalKgRemaining / totalDailyKg

    // Daily Burn Rate: daily_cost = (total_cost_remaining / days_remaining)
    // This ensures the cost hits 0 exactly on the depletion day
    let dailyCost = 0

    if (daysRemaining < 1 && daysRemaining > 0) {
      // Edge Case: If days_remaining is less than 1, daily_cost reflects the final remaining balance
      dailyCost = totalCostRemaining
    } else if (daysRemaining >= 1) {
      dailyCost = totalCostRemaining / daysRemaining
    }

    const isDepleted = daysRemaining <= 0

    dailyCostByCategory[category] = {
      daysRemaining: Math.max(0, daysRemaining),
      dailyCost: isDepleted ? 0 : dailyCost,
      totalDailyKg,
      isDepleted,
      totalKgRemaining,
      totalCostRemaining,
      dailyConsumptionPerHog,
      activeHogCount,
      // Additional calculated values for UI
      costPerHogPerDay: activeHogCount > 0 ? (isDepleted ? 0 : dailyCost) / activeHogCount : 0,
    }
  })

  return dailyCostByCategory
})

// Daily Consumption Cost - Reactive computed property for Daily Consumption section
// Uses feedInventory.categoryBreakdown directly (same data displayed in UI)
const dailyConsumptionCostByCategory = computed(() => {
  const categoryBreakdown = feedInventory.categoryBreakdown || {}
  const dailyCostByCategory = {}

  // Get cost per kg from feed inventory
  const totalFeedCost = feedInventory.totalCost || 0
  const totalStock = feedInventory.totalStock || 1 // Prevent division by zero
  const costPerKg = totalStock > 0 ? totalFeedCost / totalStock : 0

  // Calculate daily cost for each category
  Object.keys(categoryBreakdown).forEach((category) => {
    const data = categoryBreakdown[category]

    // Data Structure from feed_inventory
    const totalKgRemaining = feedInventory.feedStock[category] || 0
    const totalCostRemaining = totalKgRemaining * costPerKg
    const activeHogCount = data?.count || 0
    const totalDailyKg = data?.dailyKg || 0

    // Calculate daily consumption per hog
    const dailyConsumptionPerHog = activeHogCount > 0 ? totalDailyKg / activeHogCount : 0

    // Edge Case: Handle DivisionByZero if consumption is 0
    if (totalDailyKg === 0 || activeHogCount === 0) {
      dailyCostByCategory[category] = {
        dailyCost: 0,
        daysRemaining: 0,
        totalDailyKg: 0,
        isDepleted: totalKgRemaining === 0,
        totalKgRemaining,
        totalCostRemaining,
        dailyConsumptionPerHog,
        activeHogCount,
      }
      return
    }

    // Days Until Depletion: days_remaining = (total_kg_remaining / total_daily_kg)
    const daysRemaining = totalKgRemaining / totalDailyKg

    // Daily Burn Rate: daily_cost = (total_cost_remaining / days_remaining)
    // This ensures the cost hits 0 exactly on the depletion day
    let dailyCost = 0

    if (daysRemaining < 1 && daysRemaining > 0) {
      // Edge Case: If days_remaining is less than 1, daily_cost reflects the final remaining balance
      dailyCost = totalCostRemaining
    } else if (daysRemaining >= 1) {
      dailyCost = totalCostRemaining / daysRemaining
    }

    const isDepleted = daysRemaining <= 0

    dailyCostByCategory[category] = {
      dailyCost: isDepleted ? 0 : dailyCost,
      daysRemaining: Math.max(0, daysRemaining),
      totalDailyKg,
      isDepleted,
      totalKgRemaining,
      totalCostRemaining,
      dailyConsumptionPerHog,
      activeHogCount,
    }
  })

  return dailyCostByCategory
})

// Feed Cost Analysis - Enhanced with daily cost calculation
const feedCostAnalysis = computed(() => {
  // Use the store's simplified cost tracking data
  const totalFeedCost = feedInventory.totalCost || 0
  const totalBatches = feedsStore.records?.length || 0

  // Get active hogs for daily consumption calculation
  const activeHogs = hogsStore.hogs?.filter((hog) => hog.status === 'active') || []

  // Calculate cost per kg for each category based on total cost distributed
  const totalStock = feedInventory.totalStock || 1
  const costPerKg = totalStock > 0 ? totalFeedCost / totalStock : 0

  // Cost by category using distributed cost approach
  const costByCategory = {
    starter: {
      totalCost: feedInventory.feedStock.starter * costPerKg,
      totalKg: feedInventory.feedStock.starter || 0,
      costPerKg: costPerKg,
      dailyCost: 0,
    },
    grower: {
      totalCost: feedInventory.feedStock.grower * costPerKg,
      totalKg: feedInventory.feedStock.grower || 0,
      costPerKg: costPerKg,
      dailyCost: 0,
    },
    finisher: {
      totalCost: feedInventory.feedStock.finisher * costPerKg,
      totalKg: feedInventory.feedStock.finisher || 0,
      costPerKg: costPerKg,
      dailyCost: 0,
    },
  }

  // Calculate daily cost per category based on current consumption
  const categoryBreakdown = getCategoryBreakdown(activeHogs)
  Object.keys(costByCategory).forEach((category) => {
    const categoryData = costByCategory[category]
    const consumption = categoryBreakdown[category]?.dailyKg || 0
    categoryData.dailyCost = consumption * categoryData.costPerKg
  })

  // Calculate totals
  const averageCostPerKg = feedInventory.averageCostPerKg || costPerKg
  const dailyFeedCost = Object.values(costByCategory).reduce((sum, cat) => sum + cat.dailyCost, 0)

  return {
    totalFeedCost,
    averageCostPerKg,
    dailyFeedCost,
    totalBatches,
    costByCategory,
    // Add the new daily cost calculation
    dailyCostByCategory: calculateDailyFeedCost.value,
  }
})

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount || 0)
}

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
  const today = new Date()

  // Add success notification when inventory is updated
  if (feedInventory.lastUpdated) {
    notifications.push({
      title: 'Inventory Updated',
      message: `Feed inventory successfully refreshed with latest data.`,
      time: formatTime(feedInventory.lastUpdated),
      type: 'info',
    })
  }

  // Check for starter feed transitions and new hogs
  const allHogs = hogsStore.hogs || []
  const activeHogs = allHogs.filter((hog) => hog.status === 'active')

  // Starter feed transition alerts
  activeHogs.forEach((hog) => {
    const ageInDays = hog.days || 0
    const currentRate = getConsumptionRate(ageInDays)

    // Check if approaching next feed category transition
    if (currentRate.category === 'starter' && ageInDays >= 70) {
      const daysToTransition = 84 - ageInDays
      if (daysToTransition <= 7 && daysToTransition > 0) {
        notifications.push({
          title: '🌾 Starter Feed Transition Soon',
          message: `${hog.code} will transition to grower feed in ${daysToTransition} days. Prepare grower feed inventory.`,
          time: 'Just now',
          type: 'warning',
        })
      }
    }

    // Check for new hogs needing starter feed
    if (ageInDays <= 7) {
      notifications.push({
        title: '🐷 New Hog on Starter Feed',
        message: `${hog.code} (${ageInDays} days old) requires ${currentRate.dailyKg}kg of starter feed daily.`,
        time: 'Just now',
        type: 'info',
      })
    }

    // Check for high feed consumption alerts
    if (currentRate.dailyKg >= 2.0) {
      notifications.push({
        title: '⚠️ High Feed Consumption',
        message: `${hog.code} is consuming ${currentRate.dailyKg}kg/day. Monitor feed inventory closely.`,
        time: 'Just now',
        type: 'warning',
      })
    }
  })

  // Check overall feed inventory status
  if (activeHogs.length > 0) {
    const categoryBreakdown = getCategoryBreakdown(activeHogs)

    // Alert if many hogs on starter feed (high consumption phase)
    if (categoryBreakdown.starter.count >= 5) {
      notifications.push({
        title: '📊 High Starter Feed Demand',
        message: `${categoryBreakdown.starter.count} hogs on starter feed consuming ${categoryBreakdown.starter.dailyKg.toFixed(1)}kg daily. Ensure adequate starter feed inventory.`,
        time: 'Just now',
        type: 'info',
      })
    }
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

// Forecast calculation methods
const getDaysRemainingForCategory = (category) => {
  const stock = feedInventory.feedStock[category] || 0
  const dailyConsumption = feedInventory.categoryBreakdown[category]?.dailyKg || 0
  if (dailyConsumption <= 0) return '∞'
  return Math.floor(stock / dailyConsumption)
}

const getCategoryConsumptionRate = (category) => {
  return (feedInventory.categoryBreakdown[category]?.dailyKg || 0).toFixed(2)
}

const getDepletionDateForCategory = (category) => {
  const daysRemaining = getDaysRemainingForCategory(category)
  if (daysRemaining === '∞') return 'Never'

  const depletionDate = new Date()
  depletionDate.setDate(depletionDate.getDate() + parseInt(daysRemaining))
  return depletionDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getForecastStatus = (category) => {
  const daysRemaining = getDaysRemainingForCategory(category)
  if (daysRemaining === '∞') return 'No Consumption'
  if (daysRemaining <= 3) return 'Critical'
  if (daysRemaining <= 7) return 'Low'
  if (daysRemaining <= 14) return 'Moderate'
  return 'Good'
}

const getForecastClass = (category) => {
  const status = getForecastStatus(category)
  return `forecast-${status.toLowerCase()}`
}

const getFeedIcon = (category) => {
  const icons = {
    starter: '🌱',
    grower: '🌾',
    finisher: '🌾',
  }
  return icons[category] || '🌾'
}

// Update notifications
const updateNotifications = () => {
  stockAlerts.value = generateStockAlerts()
  systemNotifications.value = generateSystemNotifications()

  // Show critical alerts as modal
  const criticalNotifications = [...stockAlerts.value, ...systemNotifications.value].filter(
    (n) => n.type === 'critical' || n.type === 'error',
  )
  if (criticalNotifications.length > 0) {
    showError(criticalNotifications[0].message, criticalNotifications[0].title)
  }
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
  // Use shared refresh function to load all data
  await refreshAllData()

  // Fetch feeds records for cost analysis
  await feedsStore.fetchRecords()

  // Update notifications after loading
  updateNotifications()

  // Check notifications every 5 minutes
  setInterval(updateNotifications, 5 * 60 * 1000)

  // Setup real-time subscriptions for automatic updates
  cleanupRealtime = setupRealtimeSubscriptions()

  // Listen for farm data refresh events
  const handleFarmDataRefreshed = () => {
    console.log('📊 Farm data refreshed, updating notifications...')
    updateNotifications()
  }

  window.addEventListener('farmDataRefreshed', handleFarmDataRefreshed)

  // Listen for feed inventory changes (legacy support)
  const handleStorageChange = (e) => {
    if (e.key === 'feed-inventory-updated') {
      console.log('📦 Feed inventory updated, refreshing...')
      refreshAllData(false) // Refresh without showing loading
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // Custom event listener for same-tab updates
  window.addEventListener('feedInventoryUpdated', () => {
    console.log('📦 Feed inventory updated via custom event, refreshing...')
    refreshAllData(false)
  })

  // Listen for feed formulation saved events
  const handleFeedFormulationSaved = () => {
    console.log('📋 Feed formulation saved, refreshing...')
    feedsStore.fetchRecords()
    refreshAllData(false)
    // Ensure feed inventory analytics are recalculated after formulation
    setTimeout(() => {
      feedInventory.calculateAnalytics()
    }, 500)
  }

  window.addEventListener('feedFormulationSaved', handleFeedFormulationSaved)

  // Listen for feed formulation updates via storage (cross-tab)
  const handleFeedFormulationUpdate = (e) => {
    if (e.key === 'feed-formulation-updated') {
      console.log('📋 Feed formulation updated via storage, refreshing...')
      feedsStore.fetchRecords()
      refreshAllData(false)
      // Ensure feed inventory analytics are recalculated after formulation
      setTimeout(() => {
        feedInventory.calculateAnalytics()
      }, 500)
    }
  }

  window.addEventListener('storage', handleFeedFormulationUpdate)
})

// Cleanup on unmount
onUnmounted(() => {
  if (cleanupRealtime) {
    cleanupRealtime()
  }
  // Note: Event listeners are automatically cleaned up when component unmounts
  // but we can explicitly remove them if needed
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.screen {
  padding: 16px;
  background: #f4f4f4;
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

/* Top Row Section - Two Column Layout */
.top-row-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
}

.right-column {
  display: flex;
  flex-direction: column;
}

/* Daily Consumption Card in Left Column */
.left-column .consumption-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.left-column .consumption-card h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  border-bottom: 1px solid #f1f3f4;
  padding-bottom: 8px;
}

.left-column .consumption-total {
  font-size: 20px;
  font-weight: 700;
  color: #2f8b60;
  text-align: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.left-column .category-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.left-column .breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
}

.left-column .category-label {
  font-weight: 600;
  color: #2c3e50;
  text-transform: capitalize;
}

.left-column .category-data {
  display: flex;
  gap: 8px;
  align-items: center;
}

.left-column .category-data .count {
  color: #6c757d;
  font-size: 12px;
}

.left-column .category-data .consumption {
  font-weight: 600;
  color: #2f8b60;
  font-size: 12px;
}
.total-hogs-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transition: transform 0.2s ease;
}

.total-hogs-card:hover {
  transform: translateY(-2px);
}

/* Notifications Section in Right Column */
.right-column .notifications-section {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-height: 300px;
  overflow-y: auto;
}

.right-column .notifications-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  border-bottom: 1px solid #f1f3f4;
  padding-bottom: 8px;
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
  background: rgb(237, 237, 237);
  color: #2f8b60;
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
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}

.daily-cost {
  font-size: 14px;
  color: #2f8b60;
  font-weight: 600;
  background: #e6f7ff;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
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

/* Feed Forecast Section */
.forecast-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.forecast-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.forecast-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.forecast-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.forecast-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f3f4;
}

.forecast-icon {
  font-size: 24px;
  opacity: 0.8;
}

.forecast-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.forecast-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.stock-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stock-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stock-unit {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.days-remaining {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #fff3cd;
  border-radius: 6px;
}

.days-value {
  font-size: 20px;
  font-weight: 700;
  color: #856404;
  line-height: 1;
}

.days-unit {
  font-size: 12px;
  color: #856404;
  margin-top: 2px;
}

.consumption-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #d1ecf1;
  border-radius: 6px;
}

.rate-value {
  font-size: 16px;
  font-weight: 600;
  color: #0c5460;
  line-height: 1;
}

.rate-unit {
  font-size: 12px;
  color: #0c5460;
  margin-top: 2px;
}

.depletion-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f8d7da;
  border-radius: 6px;
}

.date-label {
  font-size: 11px;
  color: #721c24;
  margin-bottom: 2px;
}

.date-value {
  font-size: 14px;
  font-weight: 600;
  color: #721c24;
}

.forecast-status {
  text-align: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.forecast-critical {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.forecast-low {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.forecast-moderate {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.forecast-good {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.forecast-no-consumption {
  background: #e2e3f2;
  color: #6c757d;
  border: 1px solid #d6d9dc;
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

/* Feed Cost Analysis Section */
.feed-cost-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.feed-cost-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cost-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.cost-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.cost-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.cost-card.total-cost {
  border-left: 4px solid #667eea;
}

.cost-card.cost-per-kg {
  border-left: 4px solid #f093fb;
}

.cost-card.daily-cost {
  border-left: 4px solid #4facfe;
}

.cost-icon {
  font-size: 24px;
  opacity: 0.8;
}

.cost-info {
  flex: 1;
}

.cost-amount {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.cost-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 2px;
}

.cost-subtitle {
  font-size: 12px;
  color: #adb5bd;
  font-style: italic;
}

.cost-breakdown {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

.breakdown-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.breakdown-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-transform: capitalize;
}

.category-cost {
  font-size: 14px;
  font-weight: 700;
  color: #2f8b60;
}

.category-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.detail-row span:first-child {
  color: #6c757d;
}

.detail-row span:last-child {
  font-weight: 600;
  color: #2c3e50;
}

/* Responsive Design */
@media (max-width: 768px) {
  .feed-cost-section {
    padding: 16px;
  }

  .cost-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .cost-amount {
    font-size: 18px;
  }

  .breakdown-grid {
    grid-template-columns: 1fr;
  }

  .top-row-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .right-column .notifications-section {
    max-height: 250px;
  }

  .forecast-grid {
    grid-template-columns: 1fr;
  }

  .forecast-details {
    grid-template-columns: 1fr 1fr;
  }

  .stock-overview {
    grid-template-columns: 1fr;
  }

  .status-breakdown {
    grid-template-columns: 1fr;
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
/* Daily Cost Analysis Styles */
.daily-cost-summary {
  margin-bottom: 20px;
}

.cost-summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  text-align: center;
}

.cost-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.cost-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.cost-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.cost-card.depleted {
  background: #fff5f5;
  border-color: #feb2b2;
  opacity: 0.8;
}

.cost-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.cost-card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.depleted-badge {
  background: #e53e3e;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.cost-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.cost-row.highlight {
  background: #e6f7ff;
  padding: 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #0066cc;
}

.cost-row span:first-child {
  color: #6c757d;
}

.cost-row span:last-child {
  font-weight: 600;
  color: #2c3e50;
}

.cost-card.depleted .cost-row.highlight {
  background: #ffe6e6;
  color: #cc0000;
}

/* Syncing Indicator Styles */
.syncing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #e3f2fd;
  border-radius: 8px;
  font-size: 12px;
  color: #1976d2;
  font-weight: 500;
}

.sync-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e3f2fd;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sync-text {
  font-size: 12px;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
