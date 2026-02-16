<template>
  <nav class="sidebar" v-if="showBottomBar">
    <button
      v-for="item in menuItems"
      :key="item.name"
      @click="navigateTo(item.name)"
      :class="{ active: isActive(item) }"
      :disabled="item.disabled"
      :title="item.label"
    >
      <img :src="item.icon" :alt="item.label" />
      <span class="menu-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAdmin } from '@/services/supabase'

const route = useRoute()
const router = useRouter()

const isUserAdmin = ref(false)

// Base menu items for all users
const baseMenuItems = [
  { name: 'dashboard', label: 'Home', icon: '/home.png', disabled: false },
  { name: 'feed-inventory', label: 'Feed', icon: '/inventory.png', disabled: false },
  { name: 'cost-summary', label: 'Costs', icon: '/budget.png', disabled: false },
  { name: 'expenses', label: 'Expenses', icon: '/expensesicon.png', disabled: false },
  { name: 'records', label: 'Records', icon: '/record.png', disabled: false },
]

// Admin-only menu items
const adminMenuItems = [
  { name: 'user-management', label: 'Users', icon: '/staff.png', disabled: false },
]

// Profile item (added separately to ensure it's last)
const profileItem = { name: 'profile', label: 'Profile', icon: '/profile.png', disabled: false }

// Combined menu items based on admin status
const menuItems = computed(() => {
  if (isUserAdmin.value) {
    return [...baseMenuItems, ...adminMenuItems, profileItem]
  }
  return [...baseMenuItems, profileItem]
})

// Define routes where bottom bar should be hidden
const hiddenRoutes = ['splash', 'login', 'onboarding-1']

const showBottomBar = computed(() => {
  return !hiddenRoutes.includes(route.name)
})

const isActive = (item) => {
  return route.name === item.name || (route.matched[0] && route.matched[0].name === item.name)
}

const navigateTo = (routeName) => {
  router.push({ name: routeName })
}

// Check admin status on component mount
onMounted(async () => {
  try {
    isUserAdmin.value = await isAdmin()
  } catch (error) {
    console.error('Error checking admin status:', error)
    isUserAdmin.value = false
  }
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 80px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 6px 0 20px rgba(0, 0, 0, 0.15);
  border-right: 1px solid #e5e7eb;
  z-index: 1000;
  overflow-y: auto;
}

.sidebar button {
  background: none;
  border: none;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #334155;
  font-size: 11px;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
  width: 100%;
  opacity: 0.9;
  border-radius: 0;
  gap: 6px;
}

.sidebar button:hover {
  opacity: 1;
  transform: translateX(2px);
  background: rgba(47, 139, 96, 0.12);
}

.sidebar button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sidebar button img {
  width: 28px;
  height: 28px;
  transition:
    transform 0.18s ease,
    filter 0.18s ease;
}

.sidebar button.active {
  color: #2f8b60;
  opacity: 1;
  background: rgba(47, 139, 96, 0.15);
  border-left: 3px solid #2f8b60;
}

.sidebar button.active img {
  filter: brightness(0) saturate(100%) invert(42%) sepia(65%) saturate(441%) hue-rotate(112deg)
    brightness(90%) contrast(85%);
}

.menu-label {
  text-align: center;
  line-height: 1.2;
  margin-top: 2px;
}

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .sidebar {
    width: 60px;
    padding: 12px 0;
  }

  .sidebar button {
    padding: 12px 8px;
    font-size: 9px;
  }

  .sidebar button img {
    width: 22px;
    height: 22px;
  }

  .menu-label {
    display: none;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .sidebar {
    width: 65px;
    padding: 14px 0;
  }

  .sidebar button {
    padding: 14px 10px;
    font-size: 10px;
  }

  .sidebar button img {
    width: 24px;
    height: 24px;
  }

  .menu-label {
    display: none;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .sidebar {
    width: 70px;
    padding: 16px 0;
  }

  .sidebar button {
    padding: 16px 12px;
    font-size: 11px;
  }

  .sidebar button img {
    width: 26px;
    height: 26px;
  }

  .menu-label {
    display: none;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 80px;
    padding: 20px 0;
  }

  .sidebar button {
    padding: 18px 14px;
    font-size: 12px;
  }

  .sidebar button img {
    width: 30px;
    height: 30px;
  }

  .menu-label {
    display: block;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .sidebar {
    width: 90px;
    padding: 22px 0;
  }

  .sidebar button {
    padding: 20px 16px;
    font-size: 13px;
  }

  .sidebar button img {
    width: 32px;
    height: 32px;
  }

  .menu-label {
    display: block;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .sidebar {
    width: 100px;
    padding: 24px 0;
  }

  .sidebar button {
    padding: 22px 18px;
    font-size: 14px;
  }

  .sidebar button img {
    width: 34px;
    height: 34px;
  }

  .menu-label {
    display: block;
  }
}
</style>
