import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { supabase } from './supabase'

// Create and configure Pinia
const pinia = createPinia()

const app = createApp(App)

// Use Pinia and router FIRST
app.use(pinia)
app.use(router)

// Make supabase available throughout the app
app.config.globalProperties.$supabase = supabase

// Ensure stores are available
import { useFeedFormulationsStore } from './stores/feedFormulations.js'
// Initialize store to ensure it's available
const feedFormulationsStore = useFeedFormulationsStore()

// Now initialize cron service AFTER Pinia is ready
import cronService from './services/cronService.js'

// Initialize cron service asynchronously
const initializeCronService = async () => {
  try {
    await cronService.initialize()
    cronService.requestNotificationPermission()
    await cronService.start()
  } catch (error) {
    console.error('Failed to initialize cron service:', error)
  }
}

// Start cron service initialization
initializeCronService()

app.mount('#app')
