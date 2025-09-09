<template>
  <div class="screen">
    <section class="hero">
      <div class="header">
        <h2>Manage Staff</h2>
        <img src="/favicon.ico" alt="icon" />
      </div>
      <p class="sub">Manage your staff's activities and logs.</p>
    </section>

    <div class="list">
      <button class="row" v-for="i in 3" :key="i">
        <div class="avatar">👤</div>
        <div class="col">
          <div class="title">Staff {{ i }}</div>
          <div class="muted">{{ 6 - i }} Recent Logs</div>
        </div>
        <span class="action">⋯</span>
      </button>
    </div>

    <BottomBar />
  </div>
</template>

<script setup>
import BottomBar from './parts/BottomBar.vue'
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}
.hero {
  background: #2f8b60;
  color: #fff;
  margin: 16px;
  border-radius: 16px;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header img {
  width: 60px;
  height: 60px;
}
.sub {
  opacity: 0.9;
  margin-top: 6px;
}
.list {
  background: #fff;
  margin: 0 16px;
  border-radius: 16px;
  padding: 8px;
}
.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  width: 100%;
}
.row:last-child {
  border-bottom: 0;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #2f8b6030;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title {
  font-weight: 600;
}
.muted {
  color: #789;
}
.action {
  color: #2f8b60;
  font-size: 22px;
}
button {
  cursor: pointer;
}
</style>
