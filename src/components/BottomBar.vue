<template>
  <nav class="bottombar" v-if="showBottomBar">
    <button
      v-for="item in menuItems"
      :key="item.name"
      @click="navigateTo(item.name)"
      :class="{ active: isActive(item) }"
      :disabled="item.disabled"
    >
      <img :src="item.icon" :alt="item.label" />
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { name: 'dashboard', label: 'Home', icon: '/home.png', disabled: false },
  { name: 'records', label: 'Records', icon: '/record.png', disabled: false },
  { name: 'expenses', label: 'Expenses', icon: '/expensesicon.png', disabled: false },
  { name: 'profile', label: 'Profile', icon: '/profile.png', disabled: false },
]

// Define routes where bottom bar should be hidden
const hiddenRoutes = ['splash', 'login', 'register', 'onboarding-1']

const showBottomBar = computed(() => {
  return !hiddenRoutes.includes(route.name)
})

const isActive = (item) => {
  return route.name === item.name || 
         (route.matched[0] && route.matched[0].name === item.name)
}

const navigateTo = (routeName) => {
  router.push({ name: routeName })
}
</script>

<style scoped>
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  display: flex;
  justify-content: space-around;
  padding: 14px 0; /* taller bar */
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.15);
  border-top: 1px solid #e5e7eb;
  z-index: 1000;
}

.bottombar button {
  background: none;
  border: none;
  padding: 12px 18px; /* comfy touch target */
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #334155; /* darker for contrast */
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
  flex: 1;
  max-width: 25%;
  opacity: 0.9; /* more visible */
  border-radius: 12px;
}

.bottombar button:hover {
  opacity: 1;
  transform: translateY(-2px) scale(1.06);
  background: rgba(47, 139, 96, 0.12); /* subtle green hover */
}

.bottombar button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bottombar button img {
  width: 28px; /* icon-only */
  height: 28px;
  margin-bottom: 0;
  transition: transform 0.18s ease, filter 0.18s ease;
}

/* labels removed */

.bottombar button.active {
  color: #2f8b60;
  opacity: 1;
}

.bottombar button.active img {
  filter: brightness(0) saturate(100%) invert(42%) sepia(65%) saturate(441%) 
    hue-rotate(112deg) brightness(90%) contrast(85%);
}
</style>
