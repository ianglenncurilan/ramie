<script setup>
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
    <header class="topbar">
      <div class="time">12:00</div>
      <div class="icons">⋯</div>
    </header>

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
        <img src="/favicon.ico" alt="Make Feeds" />
        <div>Make Feeds</div>
      </button>
      <button class="card" @click="go('manage-staff')">
        <img src="/favicon.ico" alt="Manage Staff" />
        <div>Manage Staff</div>
      </button>
      <button class="card" @click="go('inventory')">
        <img src="/favicon.ico" alt="Inventory" />
        <div>Inventory</div>
      </button>
      <button class="card" @click="go('hogs-tracked')">
        <img src="/favicon.ico" alt="Hogs Tracked" />
        <div>Hogs Tracked</div>
      </button>
    </section>

    <nav class="bottombar">
      <button @click="go('dashboard')">🏠</button>
      <button @click="go('records')">📋</button>
      <button class="fab">＋</button>
      <button @click="go('expenses')">💬</button>
      <button @click="go('profile')">👤</button>
    </nav>
  </div>
</template>

<style scoped>
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
  border-radius: 16px;
  padding: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  background: #fff;
  border: 0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.card img {
  width: 40px;
  height: 40px;
}
.bottombar {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 14px 18px;
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
}
.fab {
  background: #2f8b60;
  color: #fff;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  justify-self: center;
}
button {
  cursor: pointer;
}
</style>
