<template>
  <div class="screen">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
      <div class="overlay">
        <div class="title">Olivier Ecovillage</div>
      </div>
    </section>
    <div class="panel">
      <h3>Records</h3>
      <div class="list">
        <div class="item" v-for="rec in feeds.records" :key="rec.id">
          <span class="dot"></span>
          <span>Feed: {{ rec.stage }} — {{ rec.items.length }} ingredients</span>
          <span class="muted">{{ new Date(rec.date).toLocaleDateString() }}</span>
        </div>
        <div v-if="!feeds.records.length" class="empty">No records yet</div>
      </div>
    </div>
    <BottomBar />
  </div>
</template>

<script setup>
import BottomBar from './parts/BottomBar.vue'
import { useFeedsStore } from '../stores/feeds'
const feeds = useFeedsStore()
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  min-height: 100vh;
  background: #f5f5f5;
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
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
  border-radius: 14px;
}
.panel {
  margin: 0 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
}
.list {
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  margin-top: 12px;
  color: #333;
}
.item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 10px 6px;
  border-bottom: 1px solid #eee;
}
.item:last-child {
  border-bottom: 0;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2f8b60;
  margin-top: 5px;
}
.muted {
  color: #789;
}
.empty {
  padding: 12px;
  text-align: center;
  color: #789;
}
</style>
