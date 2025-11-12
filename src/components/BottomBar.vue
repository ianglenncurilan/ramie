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
      <span class="label">{{ item.label }}</span>
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
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottombar button {
  background: none;
  border: none;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
  flex: 1;
  max-width: 25%;
  opacity: 0.7;
}

.bottombar button:hover {
  opacity: 1;
  transform: translateY(-2px) scale(1.06);
}

.bottombar button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bottombar button img {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.bottombar button .label {
  font-size: 10px;
  margin-top: 2px;
}

.bottombar button.active {
  color: #2f8b60;
  opacity: 1;
}

.bottombar button.active img {
  filter: brightness(0) saturate(100%) invert(42%) sepia(65%) saturate(441%) 
    hue-rotate(112deg) brightness(90%) contrast(85%);
}
</style>
