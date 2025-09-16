<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

    <section class="hero">
      <img src="/pig.jpg" alt="Hogs" />
      <div class="overlay">
        <div class="title">Olivier Ecovillage</div>
        <div class="stats">
          <span>31 Production Logs</span>
          <span>18 Staff</span>
          <span>18 Hogs Tracked</span>
        </div>
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

    <nav class="bottombar">
      <button @click="go('dashboard')" :class="{ active: $route.name === 'dashboard' }">
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button @click="go('records')" :class="{ active: $route.name === 'records' }">
        <img src="/record.png" alt="Records" />
      </button>
      <button @click="go('expenses')" :class="{ active: $route.name === 'expenses' }">
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button @click="go('profile')" :class="{ active: $route.name === 'profile' }">
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<style scoped>
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
.hero .title {
  font-weight: 700;
  margin-bottom: 6px;
}
.hero .stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
  opacity: 0.9;
  flex-wrap: wrap;
}
.grid {
  margin: 0 16px;
  background: #2f8b60;
  border-radius: 32px;
  padding: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  background: #fff;
  border: 0;
  border-radius: 32px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.2s ease-in-out;
}
.card:hover {
  transform: scale(1.05);
}
.card img {
  width: 48px;
  height: 48px;
}
.card div {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}
.bottombar {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  width: 32px;
  height: 32px;
  object-fit: contain;
  transition: filter 0.2s ease-in-out;
}
</style>
