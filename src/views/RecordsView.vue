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
          <div class="item-content">
            <div class="item-title">Feed: {{ rec.stage }} — {{ rec.items.length }} ingredients</div>
            <div class="item-details">
              <span class="amount">{{
                rec.totalAmount ? rec.totalAmount.toFixed(1) + 'kg' : 'N/A'
              }}</span>
              <span class="cost">₱{{ rec.totalCost ? rec.totalCost.toFixed(2) : '0.00' }}</span>
              <span class="rate"
                >@₱{{ rec.totalCostPerKg ? rec.totalCostPerKg.toFixed(2) : '0.00' }}/kg</span
              >
            </div>
            <div class="ingredients">
              <span v-for="(item, idx) in rec.items.slice(0, 3)" :key="idx" class="ingredient-tag">
                {{ item.amountKg }}kg {{ item.label.split('(')[0].trim() }}
              </span>
              <span v-if="rec.items.length > 3" class="more">+{{ rec.items.length - 3 }} more</span>
            </div>
          </div>
          <span class="muted">{{ new Date(rec.date).toLocaleDateString() }}</span>
        </div>
        <div v-if="!feeds.records.length" class="empty">No records yet</div>
      </div>
    </div>
    <nav class="bottombar">
      <button
        @click="$router.push({ name: 'dashboard' })"
        :class="{ active: $route.name === 'dashboard' }"
      >
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button
        @click="$router.push({ name: 'records' })"
        :class="{ active: $route.name === 'records' }"
      >
        <img src="/record.png" alt="Records" />
      </button>
      <button
        @click="$router.push({ name: 'expenses' })"
        :class="{ active: $route.name === 'expenses' }"
      >
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button
        @click="$router.push({ name: 'profile' })"
        :class="{ active: $route.name === 'profile' }"
      >
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { useFeedsStore } from '../stores/feeds'
const feeds = useFeedsStore()
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  margin: 0 16px 16px 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  flex: 1;
  overflow-y: auto;
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
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
}
.item:last-child {
  border-bottom: 0;
}
.item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.item-title {
  font-weight: 600;
  color: #333;
}
.item-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
.amount {
  color: #2f8b60;
  font-weight: 600;
}
.cost {
  color: #c94d4d;
  font-weight: 600;
}
.rate {
  color: #666;
}
.ingredients {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ingredient-tag {
  background: #f0f8f4;
  color: #2f8b60;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}
.more {
  color: #999;
  font-size: 10px;
  font-style: italic;
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
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
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
