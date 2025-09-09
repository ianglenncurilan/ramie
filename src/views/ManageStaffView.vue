<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Manage Staff</h2>
          <p class="sub">Manage your staff's activities and logs.</p>
        </div>
        <img class="panel-illustration" src="/staff.png" alt="icon" />
      </div>

      <div class="list">
        <button class="row" v-for="i in 3" :key="i">
          <div class="avatar">👤</div>
          <div class="col">
            <div class="title">Staff {{ i }}</div>
            <div class="muted">{{ 6 - i }} Recent Logs</div>
          </div>
          <span class="chev">⋯</span>
        </button>
      </div>
    </section>

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
  background: #2f8b60;
  display: flex;
  flex-direction: column;
}
.panel {
  background: #fff;
  margin: 20px 16px;
  border-radius: 18px;
  padding: 16px;
}
.panel-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}
.panel-illustration {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.title-wrap {
  display: flex;
  flex-direction: column;
}
.title-lg {
  font-weight: 700;
  font-size: 24px;
  line-height: 1.05;
  margin: 0;
}
.sub {
  color: #7a8b99;
  margin-top: 6px;
}
.list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  width: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}
.avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #2f8b6015;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title {
  font-weight: 600;
}
.muted {
  color: #7a8b99;
}
.chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: #2f8b6015;
  color: #2f8b60;
  border-radius: 999px;
  font-size: 20px;
}
button {
  cursor: pointer;
}
</style>
