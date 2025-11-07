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
html,
body,
#app {
  height: 100%;
  margin: 0;
}

.app-content {
  padding-bottom: 70px; /* Space for bottom bar */
  min-height: 100vh;
  background-color: #f8f9fa;
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
}

.loading-screen h2 {
  font-size: 32px;
  margin-bottom: 16px;
}

.loading-screen p {
  font-size: 16px;
  opacity: 0.8;
}
</style>
