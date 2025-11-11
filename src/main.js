import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { supabase } from './supabase'

// Create and configure Pinia
const pinia = createPinia()

const app = createApp(App)

// Use Pinia and router
app.use(pinia)
app.use(router)

// Make supabase available throughout the app
app.config.globalProperties.$supabase = supabase

// Ensure stores are available
import { useFeedFormulationsStore } from './stores/feedFormulations.js'
// Initialize the store to ensure it's available
const feedFormulationsStore = useFeedFormulationsStore()

app.mount('#app')
