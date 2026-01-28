<template>
  <div id="app">
    <div v-if="isLoading" class="loading-screen">
      <h2>Loading RAMIE...</h2>
      <p>Please wait while we initialize the application.</p>
    </div>
    <template v-else>
      <div class="app-content">
        <router-view />
      </div>
      <BottomBar />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BottomBar from '@/components/BottomBar.vue'

const isLoading = ref(true)

onMounted(() => {
  console.log('App mounted successfully!')
  // Simulate loading time
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
})
</script>

<style>
/* Add viewport meta tag for responsive design */
/* This should be added to index.html, but including for completeness */

html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Ensure proper responsive behavior */
* {
  box-sizing: border-box;
}

.app-content {
  padding-bottom: 70px;
  min-height: 100vh;
  background-color: #f8f9fa;
  width: 100%;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #2f8b60;
  color: white;
  font-family: 'Quicksand', sans-serif;
  text-align: center;
  padding: 20px;
}

.loading-screen h2 {
  font-size: clamp(24px, 5vw, 32px);
  margin-bottom: 16px;
}

.loading-screen p {
  font-size: clamp(14px, 3vw, 16px);
  opacity: 0.8;
  max-width: 300px;
}

/* Responsive adjustments for app content */
@media (max-width: 374px) {
  .app-content {
    padding-bottom: 60px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .app-content {
    padding-bottom: 80px;
  }
}

@media (min-width: 1024px) {
  .app-content {
    padding-bottom: 90px;
  }
}

@media (min-width: 1440px) {
  .app-content {
    padding-bottom: 100px;
  }
}
</style>
