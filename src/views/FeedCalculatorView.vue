<template>
  <div class="screen">
    <section class="hero">
      <div class="header">
        <h2>Feed Calculator - {{ title }}</h2>
      </div>
      <p class="sub">Input the total feed per kg. We'll split by ratio.</p>
    </section>

    <div class="card">
      <div class="row">
        <label>Total feed per KG</label>
        <input type="number" min="0" step="0.01" v-model.number="totalPerKg" />
      </div>
      <div class="grid">
        <div class="box">
          <div class="label">Carbohydrates ({{ ratios.carbs * 100 }}%)</div>
          <div class="value">{{ carbsKg.toFixed(2) }} kg</div>
        </div>
        <div class="box">
          <div class="label">Protein ({{ ratios.protein * 100 }}%)</div>
          <div class="value">{{ proteinKg.toFixed(2) }} kg</div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        <label>Cost per KG (optional)</label>
        <input type="number" min="0" step="0.01" v-model.number="costPerKg" />
      </div>
      <div class="summary">
        <div>Total Cost for 1 KG</div>
        <div class="value">{{ totalCost.toFixed(2) }}</div>
      </div>
    </div>

    <BottomBar />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import BottomBar from './parts/BottomBar.vue'

const route = useRoute()
const stage = computed(() => String(route.params.stage || 'starter'))

const totalPerKg = ref(1)
const costPerKg = ref(0)

const ratios = computed(() => {
  switch (stage.value) {
    case 'starter':
      return { carbs: 0.6, protein: 0.4 }
    case 'grower':
      return { carbs: 0.5, protein: 0.5 }
    case 'finisher':
      return { carbs: 0.6, protein: 0.4 }
    default:
      return { carbs: 0.5, protein: 0.5 }
  }
})

const carbsKg = computed(() => precise(totalPerKg.value * ratios.value.carbs))
const proteinKg = computed(() => precise(totalPerKg.value * ratios.value.protein))

const totalCost = computed(() => precise(costPerKg.value * totalPerKg.value))

const title = computed(() => stage.value.charAt(0).toUpperCase() + stage.value.slice(1))

function precise(num) {
  // Avoid floating point drift; round to 2 decimals precisely
  return Math.round((Number(num) || 0) * 100) / 100
}
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
.sub {
  opacity: 0.9;
  margin-top: 6px;
}
.card {
  background: #fff;
  margin: 0 16px;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 160px;
  gap: 12px;
  align-items: center;
}
input {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.box {
  background: #f6faf8;
  border: 1px solid #e2eee8;
  border-radius: 12px;
  padding: 14px;
}
.label {
  font-size: 12px;
  color: #567;
}
.value {
  font-size: 18px;
  font-weight: 700;
  color: #2f8b60;
}
.hr {
  height: 1px;
  background: #eee;
  margin: 4px 0;
}
.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
