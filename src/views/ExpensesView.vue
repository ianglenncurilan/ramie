<template>
  <div class="screen">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
      <div class="overlay">
        <div class="title">Track Expense</div>
      </div>
    </section>
    <div class="panel">
      <div class="cards">
        <div class="card success">
          <div class="label">Income</div>
          <div class="value">+0.00</div>
        </div>
        <div class="card danger">
          <div class="label">Expense</div>
          <div class="value">-{{ feeds.totalExpense.toFixed(2) }}</div>
        </div>
      </div>
      <div class="table">
        <div class="row" v-for="e in feeds.expenses" :key="e.id">
          <span>{{ e.label }}</span>
          <span class="amt">-{{ Number(e.amount).toFixed(2) }}</span>
        </div>
        <div v-if="!feeds.expenses.length" class="row">
          <span>No expenses yet</span><span class="amt">0.00</span>
        </div>
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
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  background: #fff;
  color: #333;
  border-radius: 12px;
  padding: 16px;
}
.card.success .value {
  color: #2f8b60;
}
.card.danger .value {
  color: #c94d4d;
}
.label {
  font-size: 12px;
  color: #789;
}
.value {
  font-weight: 700;
  font-size: 18px;
}
.table {
  background: #fff;
  border-radius: 12px;
  margin-top: 12px;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}
.row:last-child {
  border-bottom: 0;
}
.amt {
  color: #2f8b60;
}
</style>
