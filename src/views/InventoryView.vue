<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Inventory</h2>
          <p class="sub">View your available ingredients</p>
        </div>
        <img class="panel-illustration" src="/inventory.png" alt="icon" />
      </div>

      <div class="table">
        <div class="thead">
          <span>Ingredient</span>
          <span>Qty</span>
          <span>Cost</span>
          <span>Status</span>
        </div>
        <div class="row" v-for="i in 6" :key="i">
          <span>Ingredient {{ i }}</span>
          <span>{{ i }}</span>
          <span>{{ (i * 12).toFixed(2) }}</span>
          <span :class="{ ok: i % 2, bad: !(i % 2) }">{{
            i % 2 ? 'Available' : 'Not Available'
          }}</span>
        </div>
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
.table {
  background: #fff;
  margin-top: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
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
