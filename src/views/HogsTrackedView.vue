<template>
  <div class="screen">
    <section class="hero">
      <div class="header">
        <h2>Hogs Tracked</h2>
        <img src="/favicon.ico" alt="icon" />
      </div>
      <p class="sub">Monitor your hogs across all stages</p>
    </section>

    <div class="table">
      <div class="thead">
        <span>Hog Code</span>
        <span>Weight</span>
        <span>Days</span>
        <span>Feeding</span>
      </div>
      <div class="row" v-for="i in 6" :key="i">
        <span>XX{{ i }}</span>
        <span>{{ 150 + i * 5 }}kg</span>
        <span>{{ 10 + i }}</span>
        <span :class="{ ok: i % 2, bad: !(i % 2) }">{{
          i % 2 ? 'Completed' : 'Not Completed'
        }}</span>
      </div>
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
.table {
  background: #fff;
  margin: 0 16px;
  border-radius: 16px;
  padding: 8px;
  display: grid;
}
.thead,
.row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 10px 12px;
}
.thead {
  font-weight: 600;
  border-bottom: 1px solid #eee;
}
.row {
  border-bottom: 1px solid #f0f0f0;
}
.row:last-child {
  border-bottom: 0;
}
.ok {
  color: #2f8b60;
}
.bad {
  color: #c94d4d;
}
button {
  cursor: pointer;
}
</style>
