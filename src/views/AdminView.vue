<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Admin Dashboard</h2>
          <p class="sub">Administrator controls and settings</p>
        </div>
        <img class="panel-illustration" src="/staff.png" alt="icon" />
      </div>

      <!-- Admin Info Cards -->
      <div class="info-cards">
        <div class="info-card">
          <div class="label">Role</div>
          <div class="value">{{ userRole }}</div>
        </div>
        <div class="info-card">
          <div class="label">Access Level</div>
          <div class="value">Full</div>
        </div>
        <div class="info-card">
          <div class="label">User</div>
          <div class="value">{{ userName }}</div>
        </div>
      </div>

      <!-- Admin Features Section -->
      <div class="features-section">
        <h3 class="section-title">Admin Features</h3>
        <div class="feature-grid">
          <!-- Records Feature -->
          <button class="feature-card" @click="$router.push({ name: 'records' })">
            <div class="feature-icon">
              <img src="/record.png" alt="Records" />
            </div>
            <div class="feature-content">
              <div class="feature-title">Records</div>
              <div class="feature-desc">View feed formulation records</div>
            </div>
            <span class="feature-arrow">›</span>
          </button>

          <!-- Expenses Feature -->
          <button class="feature-card" @click="$router.push({ name: 'expenses' })">
            <div class="feature-icon">
              <img src="/expensesicon.png" alt="Expenses" />
            </div>
            <div class="feature-content">
              <div class="feature-title">Expenses</div>
              <div class="feature-desc">Track income and expenses</div>
            </div>
            <span class="feature-arrow">›</span>
          </button>

          <!-- Manage Staff Feature -->
          <button class="feature-card" @click="$router.push({ name: 'manage-staff' })">
            <div class="feature-icon">
              <img src="/staff.png" alt="Manage Staff" />
            </div>
            <div class="feature-content">
              <div class="feature-title">Manage Staff</div>
              <div class="feature-desc">Manage staff activities</div>
            </div>
            <span class="feature-arrow">›</span>
          </button>

          <!-- Hogs Tracked Feature -->
          <button class="feature-card" @click="$router.push({ name: 'hogs-tracked' })">
            <div class="feature-icon">
              <img src="/pig2.png" alt="Hogs Tracked" />
            </div>
            <div class="feature-content">
              <div class="feature-title">Hogs Tracked</div>
              <div class="feature-desc">Monitor hog tracking</div>
            </div>
            <span class="feature-arrow">›</span>
          </button>
        </div>
      </div>

      <!-- Statistics Section -->
      <div class="stats-section">
        <h3 class="section-title">Quick Stats</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalRecords }}</div>
            <div class="stat-label">Total Records</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalHogs }}</div>
            <div class="stat-label">Hogs Tracked</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">₱{{ stats.netProfit }}</div>
            <div class="stat-label">Net Profit</div>
          </div>
        </div>
      </div>
    </section>

    <nav class="bottombar">
      <button
        @click="$router.push({ name: 'dashboard' })"
        :class="{ active: $route.name === 'dashboard' }"
      >
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button
        @click="$router.push({ name: 'records' })"
        :class="{ active: $route.name === 'records' }"
      >
        <img src="/record.png" alt="Records" />
      </button>
      <button
        @click="$router.push({ name: 'expenses' })"
        :class="{ active: $route.name === 'expenses' }"
      >
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button
        @click="$router.push({ name: 'manage-staff' })"
        :class="{ active: $route.name === 'manage-staff' }"
      >
        <img src="/staff.png" alt="Manage Staff" />
      </button>
      <button
        @click="$router.push({ name: 'profile' })"
        :class="{ active: $route.name === 'profile' }"
      >
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCurrentUser, isAdmin } from '../services/supabase'
import { useFeedsStore } from '../stores/feeds'
import { useHogsStore } from '../stores/hogs'
import { useRouter } from 'vue-router'

const router = useRouter()
const feedsStore = useFeedsStore()
const hogsStore = useHogsStore()

// User info
const userName = ref('Admin User')
const userRole = ref('Administrator')
const isAdminUser = ref(false)

// Statistics
const stats = computed(() => ({
  totalRecords: feedsStore.records?.length || 0,
  totalHogs: hogsStore.getAllHogs()?.length || 0,
  netProfit: feedsStore.netProfit?.toFixed(2) || '0.00',
}))

// Check admin status and load user info
onMounted(async () => {
  try {
    // Verify admin status
    const adminStatus = await isAdmin()
    isAdminUser.value = adminStatus

    if (!adminStatus) {
      console.warn('User is not an admin, redirecting to forbidden page')
      router.push({ name: 'forbidden' })
      return
    }

    // Get current user info
    const user = await getCurrentUser()
    if (user) {
      userName.value = user.user_metadata?.name || user.email || 'Admin User'
      console.log('Admin user loaded:', userName.value)
      console.log('User metadata:', user.user_metadata)
      console.log('App metadata:', user.app_metadata)
    }
  } catch (error) {
    console.error('Error loading admin data:', error)
  }
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}
.screen {
  min-height: 100vh;
  background: #2f8b60;
  display: flex;
  flex-direction: column;
}
.panel {
  background: #fff;
  margin: 20px 16px 100px 16px;
  border-radius: 18px;
  padding: 16px;
}
.panel-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}
.title-wrap {
  display: flex;
  flex-direction: column;
}
.title-lg {
  font-weight: 700;
  font-size: 24px;
  margin: 0;
}
.sub {
  color: #7a8b99;
  margin-top: 6px;
}

.panel-illustration {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

/* Info Cards */
.info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.info-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}
.label {
  font-size: 11px;
  color: #789;
  margin-bottom: 4px;
}
.value {
  font-weight: 700;
  font-size: 16px;
  color: #2f8b60;
}

/* Features Section */
.features-section {
  margin-top: 24px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #333;
}
.feature-grid {
  display: grid;
  gap: 12px;
}
.feature-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(47, 139, 96, 0.15);
  border-color: #2f8b60;
}
.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f0f8f4;
  display: flex;
  align-items: center;
  justify-content: center;
}
.feature-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.feature-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.feature-title {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}
.feature-desc {
  font-size: 12px;
  color: #7a8b99;
}
.feature-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f8f4;
  color: #2f8b60;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

/* Statistics Section */
.stats-section {
  margin-top: 24px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat-card {
  background: linear-gradient(135deg, #2f8b60 0%, #4caf50 100%);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  color: #fff;
  box-shadow: 0 2px 8px rgba(47, 139, 96, 0.2);
}
.stat-value {
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 11px;
  opacity: 0.9;
}

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
  transition: all 0.2s;
}
.bottombar button.active {
  background: #2f8b60;
  color: #fff;
}
.bottombar img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.bottombar button.active img {
  filter: brightness(0) invert(1);
}
</style>
