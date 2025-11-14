<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, hasSupabaseConfig } from '@/services/supabase'

const router = useRouter()

const userFirstName = ref('')
const rotatingMessage = ref('')
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
    const { data: { user } } = await supabase.auth.getUser()
    const fullName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || ''
    const first = fullName?.split(/[\s@]/)[0] || ''
    userFirstName.value = first.charAt(0).toUpperCase() + first.slice(1)
    // Build rotating suggestions and pick one each refresh
    const name = userFirstName.value || 'there'
    const options = [
      `Let's get organized, ${name}! Have you reviewed the current Inventory Ingredients?`,
      "Don't let the team wait! Head to Manage Staff to check today's Activities.",
      `Need to mix a new batch? Hi ${name}, let's go Make Feeds!`,
      `Hey ${name}! Quick check: Are all the Hogs Feeded? Lets feed them now!`,
    ]
    const idx = Math.floor(Math.random() * options.length)
    rotatingMessage.value = options[idx]
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
</script>

<template>
  <div class="dashboard">
    <header class="topbar"></header>

    <main class="dashboard-content">
      <section class="hero">
        <img src="/pig.jpg" alt="Hogs" />
        <div class="overlay">
          <div class="brand-right">
            <img src="/leaf.png" alt="RAMIE" class="brand-logo" />
            <div class="title">RAMIE</div>
          </div>
          <div v-if="userFirstName" class="greet">{{ timeGreeting }}, {{ userFirstName }}! {{ rotatingMessage }}</div>
        </div>
      </section>

      <section class="grid">
        <button class="card" @click="go('make-feeds')">
          <img src="/makefeeds.png" alt="Make Feeds" />
          <div>Make Feeds</div>
        </button>
        <button class="card" @click="go('manage-staff')">
          <img src="/staff.png" alt="Manage Staff" />
          <div>Manage Staff</div>
        </button>
        <button class="card" @click="go('inventory')">
          <img src="/inventory.png" alt="Inventory" />
          <div>Inventory</div>
        </button>
        <button class="card" @click="go('hogs-tracked')">
          <img src="/pig2.png" alt="Hogs Tracked" />
          <div>Hogs Tracked</div>
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* App.vue already provides bottom padding for the global BottomBar */
.dashboard {
  padding-bottom: 0;
}

.dashboard-content {
  min-height: calc(100vh - 60px);
}
* {
  font-family: 'Quicksand', sans-serif;
}

.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
}
.hero {
  position: relative;
  margin: 16px;
}
.hero img {
  width: 100%;
  height: 180px;
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
.hero .brand-right { position: absolute; top: 10px; right: 12px; display: inline-flex; align-items: center; gap: 8px; }
.hero .brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.hero .title {
  font-weight: 700;
  font-size: 22px;
}
.hero .greet { font-weight: 600; font-size: 16px; opacity: 0.95; margin-left: 6px; }
.hero .subgreet { font-weight: 500; font-size: 13px; opacity: 0.9; margin-left: 6px; }
.hero .rotating-hint { font-weight: 600; font-size: 13px; opacity: 0.95; margin-left: 6px; margin-top: 4px; }
.grid {
  margin: 0 16px;
  background: #2f8b60;
  border-radius: 32px;
  padding: 40px; /* increase overall grid padding */
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  background: #fff;
  border: 0;
  border-radius: 32px;
  padding: 40px; /* larger card padding */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.2s ease-in-out;
  min-height: 140px; /* ensure a larger visual footprint */
}
.card:hover {
  transform: scale(1.01);
}
.card img {
  width: 56px; /* larger icon */
  height: 56px;
}
.card div {
  font-size: 18px; /* larger label text */
  font-weight: 600;
  text-align: center;
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

/* Responsive tweaks for small phones */
@media (max-width: 400px) {
  .hero img {
    height: 170px;
  }
  .grid {
    padding: 24px; /* bigger green background */
    gap: 14px;
    border-radius: 28px;
  }
  .card {
    padding: 20px; /* bigger cards */
    min-height: 130px;
    border-radius: 24px;
    gap: 10px;
  }
  .card img {
    width: 48px;
    height: 48px;
  }
  .card div {
    font-size: 16px;
  }
  .bottombar {
    padding: 16px 20px;
    gap: 12px;
  }
  .bottombar img {
    width: 28px;
    height: 28px;
  }
}
</style>
