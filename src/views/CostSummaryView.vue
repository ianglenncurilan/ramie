<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Cost Summary</h2>
          <p class="sub">Track your hog investment and profitability</p>
        </div>
        <div class="header-actions">
          <button @click="testDailyDeduction" class="test-btn" title="Test Daily Deduction">
            🧪 Test
          </button>
          <button @click="refreshData" class="refresh-btn" title="Refresh data">🔄</button>
        </div>
        <img class="panel-illustration" src="/budget.png" alt="icon" />
      </div>

      <!-- Cost Overview Cards -->
      <div class="cost-overview">
        <div class="cost-card total-investment">
          <div class="cost-icon">💰</div>
          <div class="cost-info">
            <div class="cost-amount">{{ formatCurrency(costMetrics.totalInvestment) }}</div>
            <div class="cost-label">Total Investment</div>
          </div>
        </div>

        <div class="cost-card feed-cost">
          <div class="cost-icon">🌾</div>
          <div class="cost-info">
            <div class="cost-amount">{{ formatCurrency(costMetrics.totalFeedCost) }}</div>
            <div class="cost-label">Total Feed Cost</div>
          </div>
        </div>

        <div class="cost-card purchase-cost">
          <div class="cost-icon">🐷</div>
          <div class="cost-info">
            <div class="cost-amount">{{ formatCurrency(costMetrics.totalPurchaseCost) }}</div>
            <div class="cost-label">Purchase Cost</div>
          </div>
        </div>

        <div class="cost-card cost-per-head">
          <div class="cost-icon">📊</div>
          <div class="cost-info">
            <div class="cost-amount">{{ formatCurrency(costMetrics.costPerHead) }}</div>
            <div class="cost-label">Cost per Active Hog</div>
          </div>
        </div>
      </div>

      <!-- Hog Status Breakdown -->
      <div class="status-breakdown">
        <div class="status-card active">
          <div class="status-count">{{ costMetrics.activeHogCount }}</div>
          <div class="status-label">Active Hogs</div>
          <div class="status-amount">{{ formatCurrency(costMetrics.activeInvestment) }}</div>
        </div>

        <div class="status-card sold">
          <div class="status-count">{{ costMetrics.soldHogCount }}</div>
          <div class="status-label">Sold Hogs</div>
          <div class="status-amount">{{ formatCurrency(costMetrics.soldInvestment) }}</div>
        </div>
      </div>

      <!-- Detailed Hog Cost List -->
      <div class="hog-costs-section">
        <h3>Hog Cost Breakdown</h3>
        <div class="hog-costs-list">
          <template v-for="hog in hogCosts" :key="hog.id">
            <div class="hog-cost-item" :class="{ sold: hog.status === 'sold' }">
              <div class="hog-info">
                <div class="hog-code">{{ hog.code }}</div>
                <div class="hog-details">
                  <span class="hog-weight">{{ hog.weight }}kg</span>
                  <span class="hog-days">{{ hog.days }} days</span>
                  <span class="hog-stage">{{ hog.stage }}</span>
                  <span class="hog-status" :class="hog.status">{{ hog.status }}</span>
                </div>
              </div>
              <div class="hog-costs">
                <div class="cost-item">
                  <span class="cost-type">Purchase:</span>
                  <span class="cost-value">{{ formatCurrency(hog.purchase_price) }}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-type">Feed:</span>
                  <span class="cost-value">{{ formatCurrency(hog.total_feed_cost) }}</span>
                </div>
                <div class="cost-item total">
                  <span class="cost-type">Total:</span>
                  <span class="cost-value">{{ formatCurrency(hog.total_cost) }}</span>
                </div>
                <button
                  @click="toggleDailyDetails(hog.id)"
                  class="daily-details-btn"
                  :class="{ active: expandedHogs.includes(hog.id) }"
                >
                  {{ expandedHogs.includes(hog.id) ? 'Hide' : 'Show' }} Daily Feed Costs
                </button>
              </div>
            </div>

            <!-- Daily Feed Cost Details - Immediately after each hog card -->
            <div v-show="expandedHogs.includes(hog.id)" class="daily-feed-details">
              <div class="daily-details-header">
                <h4>{{ hog.code }} - Daily Feed Consumption</h4>
                <div class="daily-summary">
                  <span class="summary-item">
                    <strong>Daily Average:</strong>
                    {{ calculateDailyAverage(hog) }} kg/day
                  </span>
                  <span class="summary-item">
                    <strong>Total Days Tracked:</strong>
                    {{ dailyFeedCosts[hog.id]?.length || 0 }} days
                  </span>
                </div>
              </div>
              <div class="daily-feed-list">
                <div
                  v-for="(cost, index) in dailyFeedCosts[hog.id] || []"
                  :key="hog.id + '-' + index"
                  class="daily-feed-item"
                >
                  <div class="feed-date">{{ formatDate(cost.date) }}</div>
                  <div class="feed-category">{{ cost.feed_category }}</div>
                  <div class="feed-amount">{{ cost.amount_kg }} kg</div>
                  <div class="feed-price">{{ formatCurrency(cost.unit_price) }}/kg</div>
                  <div class="feed-total">{{ formatCurrency(cost.total_cost) }}</div>
                </div>
                <div
                  v-if="!dailyFeedCosts[hog.id] || dailyFeedCosts[hog.id].length === 0"
                  class="no-daily-data"
                >
                  No daily feed consumption data available yet.
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Calculating costs...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-alert">
        <div class="error-icon">❌</div>
        <div class="error-message">
          <strong>Error:</strong>
          <p>{{ error }}</p>
          <button @click="error = null" class="dismiss-btn">Dismiss</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getHogCostSummary,
  calculateCostMetrics,
  getHogFeedCostHistory,
} from '../services/hogCostService'

// Reactive data
const hogCosts = ref([])
const loading = ref(false)
const error = ref(null)
const expandedHogs = ref([])
const dailyFeedCosts = ref({})

// Computed cost metrics
const costMetrics = computed(() => {
  return calculateCostMetrics(hogCosts.value)
})

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount || 0)
}

// Refresh data
const refreshData = async () => {
  await fetchHogCosts()
}

// Toggle daily details for a hog
const toggleDailyDetails = async (hogId) => {
  const index = expandedHogs.value.indexOf(hogId)
  if (index > -1) {
    expandedHogs.value.splice(index, 1)
  } else {
    expandedHogs.value.push(hogId)

    // Load daily feed costs if not already loaded
    if (!dailyFeedCosts.value[hogId]) {
      try {
        const costs = await getHogFeedCostHistory(hogId)
        dailyFeedCosts.value[hogId] = costs
      } catch (err) {
        console.error('Error fetching daily feed costs:', err)
        dailyFeedCosts.value[hogId] = []
      }
    }
  }
}

// Calculate daily average for a hog
const calculateDailyAverage = (hog) => {
  const costs = dailyFeedCosts.value[hog.id] || []
  if (costs.length === 0) return 0

  const totalKg = costs.reduce((sum, cost) => sum + cost.amount_kg, 0)
  const uniqueDays = new Set(costs.map((cost) => cost.date)).size
  return uniqueDays > 0 ? (totalKg / uniqueDays).toFixed(2) : '0.00'
}

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Test manual daily deduction
const testDailyDeduction = async () => {
  try {
    console.log('🧪 Testing manual daily deduction...')
    const { useFeedInventoryStore } = await import('../stores/feedInventory')
    const feedInventory = useFeedInventoryStore()

    const success = await feedInventory.performDailyDeduction()
    if (success) {
      console.log('✅ Manual daily deduction completed')
      // Refresh the data to show new costs
      await fetchHogCosts()
      // Clear expanded hogs to force refresh of daily data
      expandedHogs.value = []
      dailyFeedCosts.value = {}
    }
  } catch (error) {
    console.error('❌ Manual daily deduction failed:', error)
  }
}

// Fetch hog cost data
const fetchHogCosts = async () => {
  try {
    loading.value = true
    error.value = null

    const data = await getHogCostSummary()
    hogCosts.value = data

    console.log('Loaded hog cost data:', data)
  } catch (err) {
    console.error('Error fetching hog costs:', err)
    error.value = err.message || 'Failed to load cost data'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchHogCosts()
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

/* Cost Overview Cards */
.cost-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.cost-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.cost-card.total-investment {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cost-card.feed-cost {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.cost-card.purchase-cost {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.cost-card.cost-per-head {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.cost-icon {
  font-size: 32px;
  opacity: 0.9;
}

.cost-info {
  flex: 1;
}

.cost-amount {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.cost-label {
  font-size: 14px;
  opacity: 0.9;
}

/* Status Breakdown */
.status-breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.status-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.status-card.active {
  border-color: #28a745;
  background: #d4edda;
}

.status-card.sold {
  border-color: #ffc107;
  background: #fff3cd;
}

.status-count {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.status-label {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.status-amount {
  font-size: 18px;
  font-weight: 600;
  color: #2f8b60;
}

/* Hog Costs Section */
.hog-costs-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
}

.hog-costs-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
}

.hog-costs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.hog-cost-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.hog-cost-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hog-cost-item.sold {
  opacity: 0.7;
  border-color: #ffc107;
}

.hog-info {
  flex: 1;
}

.hog-code {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.hog-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hog-weight,
.hog-days,
.hog-stage {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.hog-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.hog-status.active {
  background: #d4edda;
  color: #155724;
}

.hog-status.sold {
  background: #fff3cd;
  color: #856404;
}

.hog-costs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  min-width: 200px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
  min-width: 140px;
}

.cost-item.total {
  font-weight: 600;
  border-top: 1px solid #e9ecef;
  padding-top: 4px;
  margin-top: 4px;
}

.cost-type {
  color: #6c757d;
}

.cost-value {
  font-weight: 600;
  color: #2c3e50;
}

/* Daily Feed Cost Details */
.daily-details-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.daily-details-btn:hover {
  background: #e9ecef;
}

.daily-details-btn.active {
  background: #2f8b60;
  color: white;
  border-color: #2f8b60;
}

.daily-feed-details {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-top: 12px;
  padding: 16px;
}

.daily-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.daily-details-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.daily-summary {
  display: flex;
  gap: 20px;
}

.summary-item {
  font-size: 14px;
  color: #6c757d;
}

.summary-item strong {
  color: #2c3e50;
}

.daily-feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.daily-feed-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 8px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 13px;
  align-items: center;
}

.feed-date {
  font-weight: 600;
  color: #2c3e50;
}

.feed-category {
  color: #6c757d;
  text-transform: capitalize;
}

.feed-amount {
  font-weight: 600;
  color: #2c3e50;
}

.feed-price {
  color: #6c757d;
  font-size: 12px;
}

.feed-total {
  font-weight: 600;
  color: #2f8b60;
}

.no-daily-data {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}

/* Loading and Error States */
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

.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.error-icon {
  font-size: 24px;
}

.error-message {
  flex: 1;
}

.dismiss-btn {
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}

.test-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff3cd;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 8px;
}

.test-btn:hover {
  background: #ffeaa7;
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 768px) {
  .cost-overview {
    grid-template-columns: 1fr;
  }

  .status-breakdown {
    grid-template-columns: 1fr;
  }

  .hog-cost-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .hog-costs {
    width: 100%;
    align-items: flex-start;
  }

  .daily-feed-item {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .daily-summary {
    flex-direction: column;
    gap: 8px;
  }

  .daily-details-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
