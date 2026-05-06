<template>
  <nav
    class="sidebar"
    v-if="showBottomBar"
    :class="{
      expanded: isExpanded,
      collapsed: !isExpanded,
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Sidebar Header with Toggle -->
    <div class="sidebar-header">
      <!-- Toggle Button -->

      <!-- Logo/Title Content -->
      <div class="brand-content">
        <img src="/leaf.png" alt="Leaf Logo" class="logo" />
        <transition name="brand-fade">
          <span v-if="isExpanded" class="brand-name">RAMIE</span>
        </transition>
      </div>
    </div>

    <!-- Navigation Items -->
    <div class="nav-items-container">
      <button
        v-for="item in menuItems"
        :key="item.name"
        @click="navigateTo(item.name)"
        :class="{ active: isActive(item) }"
        :disabled="item.disabled"
        :title="item.label"
        class="nav-item"
      >
        <div class="nav-content">
          <img :src="item.icon" :alt="item.label" class="nav-icon" />
          <transition name="label-slide">
            <span v-if="isExpanded" class="menu-label">{{ item.label }}</span>
          </transition>
        </div>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAdmin } from '@/services/supabase'

const route = useRoute()
const router = useRouter()

const isUserAdmin = ref(false)
const isExpanded = ref(false)
const isHovering = ref(false)

// Base menu items for all users
const baseMenuItems = [
  { name: 'dashboard', label: 'Home', icon: '/home.png', disabled: false },
  {
    name: 'feed-inventory',
    label: 'Feed Inventory',
    icon: '/product-management.png',
    disabled: false,
  },
  { name: 'cost-summary', label: 'Daily Feed Cost', icon: '/cost.png', disabled: false },
  { name: 'expenses', label: 'Budget Overview', icon: '/expensesicon.png', disabled: false },
  { name: 'records', label: 'Records', icon: '/record.png', disabled: false },
]

// Admin-only menu items
const adminMenuItems = [
  { name: 'manage-staff', label: 'Activity Log', icon: '/activity-log.png', disabled: false },
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

// Toggle sidebar expand/collapse
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
  // Save preference to localStorage
  localStorage.setItem('sidebarExpanded', isExpanded.value.toString())
}

// Handle mouse enter/leave for auto-expand on hover
const handleMouseEnter = () => {
  isHovering.value = true
  // Auto-expand on hover if collapsed
  if (!isExpanded.value) {
    isExpanded.value = true
  }
}

const handleMouseLeave = () => {
  isHovering.value = false
  // Auto-collapse on mouse leave if not manually expanded
  if (
    !localStorage.getItem('sidebarExpanded') ||
    localStorage.getItem('sidebarExpanded') === 'false'
  ) {
    isExpanded.value = false
  }
}

// Check admin status on component mount
onMounted(async () => {
  try {
    isUserAdmin.value = await isAdmin()
    // Load saved sidebar preference
    const savedState = localStorage.getItem('sidebarExpanded')
    if (savedState !== null) {
      isExpanded.value = savedState === 'true'
    }
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
  width: 70px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  display: flex;
  flex-direction: column;
  padding: 0;
  box-shadow: 6px 0 25px rgba(0, 0, 0, 0.1);
  border-right: 1px solid #e2e8f0;
  z-index: 1000;
  overflow-x: hidden;
  overflow-y: auto;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Quicksand', sans-serif;
}

.sidebar.expanded {
  width: 240px;
}

.sidebar.collapsed {
  width: 70px;
}

/* Sidebar Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  min-height: 60px;
  transition: all 0.4s ease;
}

.brand-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  gap: 16px;
}

.logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: #2f8b60;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}

/* Toggle Button */
.toggle-btn {
  width: 32px;
  height: 32px;
  background: rgba(47, 139, 96, 0.1);
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.toggle-btn:hover {
  background: rgba(47, 139, 96, 0.2);
  transform: scale(1.05);
}

.toggle-btn.active {
  background: rgba(47, 139, 96, 0.3);
}

.toggle-icon {
  color: #2f8b60;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon svg {
  transition: all 0.3s ease;
}

/* Navigation Container */
.nav-items-container {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Navigation Items */
.nav-item {
  background: none;
  border: none;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #475569;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  min-height: 48px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: 0;
}

.nav-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.nav-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.menu-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* Hover and Active States */
.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(47, 139, 96, 0.1) 0%, rgba(47, 139, 96, 0.05) 100%);
  transition: width 0.3s ease;
}

.nav-item:hover {
  color: #2f8b60;
  transform: translateX(4px);
}

.nav-item:hover::before {
  width: 100%;
}

.nav-item.active {
  color: #2f8b60;
  background: linear-gradient(90deg, rgba(47, 139, 96, 0.15) 0%, rgba(47, 139, 96, 0.05) 100%);
  border-left: 3px solid #2f8b60;
  font-weight: 600;
}

/* Transitions */
.brand-fade-enter-active,
.brand-fade-leave-active {
  transition: all 0.3s ease;
}

.brand-fade-enter-from,
.brand-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.label-slide-enter-active,
.label-slide-leave-active {
  transition: all 0.3s ease;
}

.label-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.label-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.label-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.label-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive Design */
/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .sidebar.expanded {
    width: 180px;
  }

  .sidebar.collapsed {
    width: 60px;
  }

  .sidebar-header {
    padding: 12px 8px;
  }

  .logo {
    width: 24px;
    height: 24px;
  }

  .brand-name {
    font-size: 14px;
  }

  .toggle-btn {
    width: 24px;
    height: 24px;
  }

  .nav-item {
    padding: 10px 8px;
    min-height: 44px;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
  }

  .nav-content {
    gap: 8px;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .sidebar.expanded {
    width: 200px;
  }

  .sidebar.collapsed {
    width: 65px;
  }

  .sidebar-header {
    padding: 14px 10px;
  }

  .logo {
    width: 26px;
    height: 26px;
  }

  .brand-name {
    font-size: 15px;
  }

  .toggle-btn {
    width: 26px;
    height: 26px;
  }

  .nav-item {
    padding: 12px 10px;
    min-height: 48px;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .sidebar.expanded {
    width: 220px;
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .sidebar-header {
    padding: 16px 12px;
  }

  .logo {
    width: 28px;
    height: 28px;
  }

  .brand-name {
    font-size: 16px;
  }

  .toggle-btn {
    width: 28px;
    height: 28px;
  }

  .nav-item {
    padding: 14px 12px;
    min-height: 52px;
  }

  .nav-icon {
    width: 19px;
    height: 19px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar.expanded {
    width: 260px;
  }

  .sidebar.collapsed {
    width: 75px;
  }

  .sidebar-header {
    padding: 18px 14px;
  }

  .logo {
    width: 30px;
    height: 30px;
  }

  .brand-name {
    font-size: 17px;
  }

  .toggle-btn {
    width: 30px;
    height: 30px;
  }

  .nav-item {
    padding: 16px 14px;
    min-height: 56px;
  }

  .nav-icon {
    width: 20px;
    height: 20px;
  }
}

/* Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .sidebar.expanded {
    width: 280px;
  }

  .sidebar.collapsed {
    width: 80px;
  }

  .sidebar-header {
    padding: 20px 16px;
  }

  .logo {
    width: 32px;
    height: 32px;
  }

  .brand-name {
    font-size: 18px;
  }

  .toggle-btn {
    width: 32px;
    height: 32px;
  }

  .nav-item {
    padding: 18px 16px;
    min-height: 60px;
  }

  .nav-icon {
    width: 22px;
    height: 22px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .sidebar.expanded {
    width: 320px;
  }

  .sidebar.collapsed {
    width: 90px;
  }

  .sidebar-header {
    padding: 22px 18px;
  }

  .logo {
    width: 34px;
    height: 34px;
  }

  .brand-name {
    font-size: 19px;
  }

  .toggle-btn {
    width: 34px;
    height: 34px;
  }

  .nav-item {
    padding: 20px 18px;
    min-height: 64px;
  }

  .nav-icon {
    width: 24px;
    height: 24px;
  }
}

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .sidebar {
    width: 110px;
  }

  .sidebar-header {
    padding: 15px 0;
  }

  .logo {
    width: 24px;
    height: 24px;
    margin-bottom: 6px;
  }

  .brand-name {
    font-size: 12px;
  }

  .nav-item {
    padding: 12px 8px;
    font-size: 11px;
    min-height: 50px;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
  }

  .nav-content {
    gap: 6px;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .sidebar {
    width: 120px;
  }

  .sidebar-header {
    padding: 17px 0;
  }

  .logo {
    width: 28px;
    height: 28px;
    margin-bottom: 7px;
  }

  .brand-name {
    font-size: 14px;
  }

  .nav-item {
    padding: 14px 10px;
    font-size: 12px;
    min-height: 55px;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }

  .nav-content {
    gap: 7px;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .sidebar {
    width: 150px;
  }

  .sidebar-header {
    padding: 18px 0;
  }

  .logo {
    width: 30px;
    height: 30px;
    margin-bottom: 7px;
  }

  .brand-name {
    font-size: 15px;
  }

  .nav-item {
    padding: 16px 12px;
    font-size: 13px;
    min-height: 60px;
  }

  .nav-icon {
    width: 19px;
    height: 19px;
  }

  .nav-content {
    gap: 7px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 150px;
  }

  .sidebar-header {
    padding: 19px 0;
  }

  .logo {
    width: 31px;
    height: 31px;
    margin-bottom: 8px;
  }

  .brand-name {
    font-size: 15px;
  }

  .nav-item {
    padding: 18px 14px;
    font-size: 14px;
    min-height: 65px;
  }

  .nav-icon {
    width: 19px;
    height: 19px;
  }

  .nav-content {
    gap: 8px;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .sidebar {
    width: 170px;
  }

  .sidebar-header {
    padding: 20px 0;
  }

  .logo {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
  }

  .brand-name {
    font-size: 16px;
  }

  .nav-item {
    padding: 20px 16px;
    font-size: 15px;
    min-height: 70px;
  }

  .nav-icon {
    width: 20px;
    height: 20px;
  }

  .nav-content {
    gap: 8px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .sidebar {
    width: 190px;
  }

  .sidebar-header {
    padding: 22px 0;
  }

  .logo {
    width: 34px;
    height: 34px;
    margin-bottom: 9px;
  }

  .brand-name {
    font-size: 17px;
  }

  .nav-item {
    padding: 22px 18px;
    font-size: 16px;
    min-height: 75px;
  }

  .nav-icon {
    width: 22px;
    height: 22px;
  }

  .nav-content {
    gap: 10px;
  }
}
</style>
