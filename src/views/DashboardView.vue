<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, hasSupabaseConfig } from '@/services/supabase'
import { useFeedInventoryStore } from '../stores/feedInventory'
import { useHogsStore } from '../stores/hogs'
import { useFarmData } from '../composables/useFarmData'

const router = useRouter()
const feedInventory = useFeedInventoryStore()
const hogsStore = useHogsStore()

// Use farm data composable for shared state and sync
const { isSyncing, lastSyncTime, syncError, refreshAllData, setupRealtimeSubscriptions } =
  useFarmData()

const userFirstName = ref('')
const rotatingMessage = ref('')
const isAdmin = ref(false)

// Check if current user is admin
const checkAdminStatus = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin') {
      isAdmin.value = true
      console.log('✅ Admin user detected:', user.email)
    } else {
      isAdmin.value = false
      console.log('ℹ️ Non-admin user detected:', user?.email)
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    isAdmin.value = false
  }
}
const timeGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
})
const contextGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return "Ready to start today's tasks?"
  if (h < 18) return 'Ready to check on the farm?'
  return "Let\'s review the day\'s records."
})

onMounted(async () => {
  try {
    if (!hasSupabaseConfig) return

    // Check admin status first
    await checkAdminStatus()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const fullName =
      user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || ''
    const first = fullName?.split(/[\s@]/)[0] || ''
    userFirstName.value = first.charAt(0).toUpperCase() + first.slice(1)
    // Build rotating suggestions and pick one each refresh
    const name = userFirstName.value || 'there'
    const options = [
      `Let's get organized, Have you reviewed the current Inventory Ingredients?`,
      "Don't let the team wait! Head to Manage Staff to check today's Activities.",
      `Need to mix a new batch? Let's go Make Feeds!`,
      `Quick check: Are all of the Hogs Feeded? Lets feed them now!`,
    ]
    const idx = Math.floor(Math.random() * options.length)
    rotatingMessage.value = options[idx]

    // Load all farm data for stock cards
    await refreshAllData()
  } catch (e) {
    // noop
  }
})

const go = (name) => {
  if (router.hasRoute(name)) {
    router.push({ name })
  } else {
    alert('Coming soon')
  }
}

// Computed properties for stock cards
const totalHogs = computed(() => hogsStore.getStats().totalHogs)
const stockLevels = computed(() => feedInventory.feedStock)

// Methods for stock cards
const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
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
</script>

<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <div class="title-wrap">
          <h2 class="title-lg">Dashboard</h2>
          <p class="sub">Farm Management Overview</p>
        </div>
        <div class="header-actions">
          <div v-if="isSyncing" class="syncing-indicator" title="Syncing data...">
            <div class="sync-spinner"></div>
            <span class="sync-text">Syncing...</span>
          </div>

          <img class="panel-illustration" src="/leaf.png" alt="icon" />
        </div>
      </div>

      <main class="dashboard-content">
        <!-- Stock Status Cards -->
        <div class="stock-overview">
          <div class="total-hogs-wrapper">
            <div class="total-hogs-card">
              <div class="hogs-icon">🐷</div>
              <div class="hogs-info">
                <div class="hogs-number">{{ totalHogs }}</div>
                <div class="hogs-label">Total Active Hogs</div>
              </div>
            </div>
          </div>
          <div class="stock-status-section">
            <h2 class="stock-status-title">Stock Status</h2>
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
        </div>

        <section class="grid">
          <button
            class="card"
            @click="go('make-feeds')"
            title="Create feed formulations for your hogs"
          >
            <div class="card-content">
              <img src="/makefeeds.png" alt="Make Feeds" />
              <div class="card-title">Make Feeds</div>
            </div>
          </button>
          <button
            class="card"
            @click="go('user-management')"
            title="View staff and their activities"
          >
            <div class="card-content">
              <img src="/staff.png" alt="User Management" />
              <div class="card-title">User Management</div>
            </div>
          </button>
          <button
            class="card"
            @click="go('inventory')"
            title="Track and manage ingredients available for feed formulations"
          >
            <div class="card-content">
              <img src="/inventory.png" alt="Inventory" />
              <div class="card-title">Ingredients Inventory</div>
            </div>
          </button>
          <button class="card" @click="go('hogs-tracked')" title="Track and manage your hogs">
            <div class="card-content">
              <img src="/pig2.png" alt="Hogs Tracked" />
              <div class="card-title">Hogs Tracked</div>
            </div>
          </button>
        </section>
      </main>
    </section>
  </div>
</template>

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
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 1200px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
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

.dashboard-content {
  display: flex;
  flex-direction: column;
}

.hero {
  position: relative;
  margin: 0 0 24px 0;
}

.hero img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 14px;
}

.hero .overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
  border-radius: 14px;
}

.hero .brand-right {
  position: absolute;
  top: 10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero .brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.hero .title {
  font-weight: 700;
  font-size: 22px;
}

.hero .greet {
  font-weight: 600;
  font-size: 13px;
  opacity: 0.95;
  margin-left: 6px;
}

/* Stock Overview Styles */
.stock-overview {
  display: grid;
  grid-template-columns: 1fr 2.5fr;
  gap: 32px;
  margin-bottom: 32px;
  align-items: start;
}

.stock-status-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stock-status-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  text-align: center;
}

.total-hogs-wrapper {
  background: white;
  border-radius: 20px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.total-hogs-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.total-hogs-card {
  background: #2f8b60;
  color: white;
  padding: 32px 24px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  min-height: 140px;
  position: relative;
  overflow: hidden;
}

.total-hogs-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 20px;
}

.total-hogs-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.hogs-icon {
  font-size: 48px;
  opacity: 0.9;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.hogs-info {
  text-align: center;
  position: relative;
  z-index: 1;
}

.hogs-number {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1;
}

.hogs-label {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.9;
  line-height: 1.2;
}

.stock-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  flex: 1;
}

.stock-card {
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stock-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.stock-card.good {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 2px solid #28a745;
  color: #155724;
}

.stock-card.critical {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 2px solid #dc3545;
  color: #721c24;
}

.stock-card.low {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 2px solid #ffc107;
  color: #856404;
}

.stock-card.moderate {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  border: 2px solid #17a2b8;
  color: #0c5460;
}

.stock-card.unknown {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #6c757d;
  color: #495057;
}

.category-info {
  margin-bottom: 12px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stock-amount {
  font-size: 24px;
  font-weight: 700;
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

.grid {
  background: #2f8b60;
  border-radius: 32px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  flex: 1;
  align-content: center;
  min-height: 250px;
}

.card {
  background: #fff;
  border: 0;
  border-radius: 32px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08
  );
  min-height: 200px;
}

.card:hover {
  transform: scale(1.05);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.card-content img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.card-title {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .screen {
    padding: 16px;
  }

  .panel {
    padding: 24px;
    border-radius: 20px;
    max-width: 100%;
  }

  .title-lg {
    font-size: 24px;
  }

  .stock-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .stock-status-section {
    text-align: center;
    padding: 20px;
  }

  .stock-status-title {
    text-align: center;
    margin-bottom: 12px;
  }

  .stock-card {
    padding: 16px 12px;
    min-height: 90px;
  }

  .total-hogs-card {
    padding: 24px 20px;
    min-height: 120px;
  }

  .hogs-icon {
    font-size: 36px;
    margin-bottom: 6px;
  }

  .hogs-number {
    font-size: 36px;
  }

  .hogs-label {
    font-size: 14px;
  }

  .stock-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stock-card {
    padding: 14px 10px;
    min-height: 90px;
  }

  .hogs-icon {
    font-size: 24px;
  }

  .hogs-number {
    font-size: 28px;
  }

  .card-icon {
    font-size: 24px;
  }

  .nav-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .nav-tile {
    padding: 20px 12px;
    gap: 8px;
  }

  .nav-icon {
    font-size: 24px;
  }

  .nav-label {
    font-size: 13px;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .hero img {
    height: 180px;
  }

  .grid {
    margin: 0 12px;
    padding: 12px;
    gap: 10px;
    border-radius: 24px;
    flex: 1;
    align-content: center;
    min-height: 180px;
  }

  .card {
    padding: 32px;
    min-height: 140px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .card-content {
    gap: 8px;
  }

  .card img {
    width: 44px;
    height: 44px;
  }

  .card-title {
    font-size: 15px;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .hero {
    margin: 20px;
  }

  .hero img {
    height: 200px;
  }

  .hero .brand-right {
    top: 12px;
    right: 16px;
  }

  .hero .brand-logo {
    width: 36px;
    height: 36px;
  }

  .hero .title {
    font-size: 24px;
  }

  .hero .greet {
    font-size: 17px;
    margin-left: 8px;
  }

  .grid {
    margin: 0 20px;
    padding: 16px;
    gap: 16px;
    border-radius: 30px;
    flex: 1;
    align-content: center;
    min-height: 220px;
  }

  .card {
    padding: 44px;
    min-height: 170px;
    border-radius: 28px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-content {
    gap: 14px;
  }

  .card img {
    width: 60px;
    height: 60px;
  }

  .card-title {
    font-size: 19px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard-content {
    max-width: 768px;
    margin: 0 auto;
  }

  .hero {
    margin: 24px;
  }

  .hero img {
    height: 180px;
  }

  .hero .brand-right {
    top: 16px;
    right: 20px;
  }

  .hero .brand-logo {
    width: 40px;
    height: 40px;
  }

  .hero .title {
    font-size: 28px;
  }

  .hero .greet {
    font-size: 18px;
    margin-left: 10px;
  }

  .grid {
    margin: 0 24px;
    padding: 20px;
    gap: 20px;
    border-radius: 32px;
    grid-template-columns: repeat(4, 1fr);
    flex: 1;
    align-content: center;
    min-height: 250px;
  }

  .card {
    padding: 40px;
    min-height: 180px;
    border-radius: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-content {
    gap: 12px;
  }

  .card img {
    width: 64px;
    height: 64px;
  }

  .card-title {
    font-size: 17px;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .dashboard-content {
    max-width: 1024px;
    margin: 0 auto;
  }

  .hero {
    margin: 32px;
    border-radius: 20px;
    overflow: hidden;
  }

  .hero img {
    height: 220px;
  }

  .hero .overlay {
    padding: 20px;
  }

  .hero .brand-right {
    top: 20px;
    right: 24px;
  }

  .hero .brand-logo {
    width: 48px;
    height: 48px;
  }

  .hero .title {
    font-size: 32px;
  }

  .hero .greet {
    font-size: 20px;
    margin-left: 12px;
  }

  .grid {
    margin: 0 32px;
    padding: 24px;
    gap: 24px;
    border-radius: 40px;
    grid-template-columns: repeat(4, 1fr);
    flex: 1;
    align-content: center;
    min-height: 280px;
  }

  .card {
    padding: 48px;
    min-height: 200px;
    border-radius: 28px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }

  .card-content {
    gap: 16px;
  }

  .card:hover {
    transform: scale(1.05);
  }

  .card img {
    width: 72px;
    height: 72px;
  }

  .card-title {
    font-size: 18px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hero {
    margin: 40px;
    border-radius: 24px;
    overflow: hidden;
  }

  .hero img {
    height: 260px;
  }

  .hero .overlay {
    padding: 24px;
  }

  .hero .brand-right {
    top: 24px;
    right: 32px;
  }

  .hero .brand-logo {
    width: 56px;
    height: 56px;
  }

  .hero .title {
    font-size: 36px;
  }

  .hero .greet {
    font-size: 22px;
    margin-left: 16px;
  }

  .grid {
    margin: 0 40px;
    padding: 28px;
    gap: 32px;
    border-radius: 48px;
    grid-template-columns: repeat(4, 1fr);
    flex: 1;
    align-content: center;
    min-height: 320px;
  }

  .card {
    padding: 56px;
    min-height: 220px;
    border-radius: 32px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .card-content {
    gap: 20px;
  }

  .card:hover {
    transform: scale(1.03);
  }

  .card img {
    width: 80px;
    height: 80px;
  }

  .card-title {
    font-size: 20px;
  }
}
.bottombar {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px; /* Increased from 16px */
  padding: 24px 32px; /* Increased from 20px 24px */
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.bottombar button {
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 16px; /* Increased from 12px */
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
  width: 36px; /* Increased from 32px */
  height: 36px; /* Increased from 32px */
  object-fit: contain;
  transition: filter 0.2s ease-in-out;
}
</style>
