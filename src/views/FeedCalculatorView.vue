<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-inner">
        <button class="back" @click="$router.back()">←</button>

        <div class="profile">
          <img class="avatar" src="/pig.jpg" alt="hog" />
          <div class="who">
            <div class="name">Chris P. Bacon</div>
            <div class="stage">{{ title }}</div>
            <div class="days">90 Days</div>
          </div>
        </div>

        <div class="intro">
          Input the exact amount of KG of each ingredients shown in the table.
        </div>

        <div class="table">
          <div v-for="category in uiCategories" :key="category.key" class="category">
            <div class="cat-head">
              <div class="cat-title">{{ category.title }}</div>
              <div
                class="cat-total"
                :class="{
                  exceeded: getCategoryTotal(category) > category.total,
                  valid:
                    getCategoryTotal(category) <= category.total && getCategoryTotal(category) > 0,
                }"
              >
                {{ getCategoryTotal(category) }}/{{ category.total }}
              </div>
            </div>

            <div class="thead">
              <span></span>
              <span class="th">Amount</span>
              <span class="th">Cost per KG</span>
            </div>

            <div v-for="(item, idx) in category.items" :key="item.id" class="row">
              <div class="item-left">
                <span class="num">{{ idx + 1 }}.</span>
                <span class="label">{{ item.label }}</span>
                <span class="ghost" v-if="item.note">({{ item.note }})</span>
                <span class="right">{{ item.base }}</span>
              </div>
              <div class="cell amount">
                <div class="pill" :class="{ active: amounts[item.id] }">
                  <input type="number" min="0" step="0.01" v-model.number="amounts[item.id]" />
                  <span class="unit">KG</span>
                </div>
              </div>
              <div class="cell cost">
                <div class="pill">
                  <input type="number" min="0" step="0.01" v-model.number="costs[item.id]" />
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="total-label">Total Feed Cost per KG</div>
            <div class="total-input">
              <input type="number" min="0" step="0.01" v-model.number="computedTotalPerKg" />
            </div>
            <button class="save" @click="saveFormulation">Save</button>
          </div>
        </div>
      </div>
    </section>

    <BottomBar />
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomBar from './parts/BottomBar.vue'
import { useFeedsStore } from '../stores/feeds'

const route = useRoute()
const router = useRouter()
const stage = computed(() => String(route.params.stage || 'starter'))
const title = computed(() => stage.value.charAt(0).toUpperCase() + stage.value.slice(1))

const BASE_CATEGORIES = {
  starter: [
    {
      key: 'carbs',
      title: 'Carbohydrates',
      total: 40,
      items: [
        { id: 'banana', label: 'Banana Peels', base: 20 },
        { id: 'ricebran', label: 'Rice Bran D2 (rbd2)', base: 20 },
      ],
    },
    {
      key: 'protein',
      title: 'Protein',
      total: 60,
      items: [
        { id: 'ramie', label: 'Ramie', note: 'fresh & shredded', base: 15 },
        { id: 'cadamba', label: 'Cadamba', note: 'dried', base: 15 },
        { id: 'copra', label: 'Copra Meal', base: 30 },
      ],
    },
    {
      key: 'vitamins',
      title: 'Vitamins',
      total: 3,
      items: [
        { id: 'molasses', label: 'Molasses (% to dry ingredients)', base: 3 },
        { id: 'herbal', label: 'Herbal concoctions (% to DI)', base: 2 },
        { id: 'premix', label: 'Premix (animal vita)', base: 1 },
        { id: 'cececal', label: 'Cececal', base: 1 },
      ],
    },
    {
      key: 'minerals',
      title: 'Minerals',
      total: 5,
      items: [
        { id: 'salt', label: 'Salt (% to dry ingredients)', base: 5 },
        { id: 'ricehull', label: 'Carbonised rice hull (% to DI)', base: 0 },
      ],
    },
    {
      key: 'water',
      title: 'Water (% to dry ingredients)',
      total: 30,
      items: [{ id: 'water', label: 'Water', base: 30 }],
    },
  ],
  grower: null,
  finisher: null,
}

// Use same layout for grower and finisher for now
BASE_CATEGORIES.grower = BASE_CATEGORIES.starter
BASE_CATEGORIES.finisher = BASE_CATEGORIES.starter

const uiCategories = computed(() => BASE_CATEGORIES[stage.value])

const amounts = reactive({})
const costs = reactive({})

const computedTotalPerKg = computed({
  get() {
    const entries = Object.keys(amounts)
      .map((k) => ({ a: Number(amounts[k]) || 0, c: Number(costs[k]) || 0 }))
      .filter((x) => x.a > 0)
    const totalAmount = entries.reduce((s, x) => s + x.a, 0)
    if (!totalAmount) return 0
    const totalCost = entries.reduce((s, x) => s + x.a * x.c, 0)
    return Math.round((totalCost / totalAmount) * 100) / 100
  },
  set(val) {
    // allow manual override if desired
  },
})

function getCategoryTotal(category) {
  return category.items.reduce((total, item) => {
    return total + (Number(amounts[item.id]) || 0)
  }, 0)
}

const feedsStore = useFeedsStore()

function saveFormulation() {
  // Validate that all categories meet their requirements
  const validationErrors = []

  uiCategories.value.forEach((category) => {
    const categoryTotal = getCategoryTotal(category)
    if (categoryTotal === 0) {
      validationErrors.push(`${category.title} has no ingredients added`)
    } else if (categoryTotal > category.total) {
      validationErrors.push(`${category.title} exceeds limit (${categoryTotal}/${category.total})`)
    }
  })

  if (validationErrors.length > 0) {
    alert('Cannot save: ' + validationErrors.join(', '))
    return
  }

  const items = []
  uiCategories.value.forEach((cat) => {
    cat.items.forEach((it) => {
      const amountKg = Number(amounts[it.id]) || 0
      const costPerKg = Number(costs[it.id]) || 0
      if (amountKg > 0) {
        items.push({
          id: it.id,
          label: `${it.label}${it.note ? ' (' + it.note + ')' : ''}`,
          amountKg,
          costPerKg,
        })
      }
    })
  })

  feedsStore.addRecord({ stage: stage.value, items, totalCostPerKg: computedTotalPerKg.value })
  if (computedTotalPerKg.value > 0) {
    feedsStore.addExpense({ label: `Feed Cost (${title.value})`, amount: computedTotalPerKg.value })
  }
  router.push({ name: 'records' })
}
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
  margin: 20px 16px;
  background: #fff;
  border-radius: 18px;
  padding: 24px;
}
.panel-inner {
  display: grid;
  gap: 16px;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}
.profile {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 16px;
  align-items: center;
}
.avatar {
  width: 84px;
  height: 84px;
  border-radius: 14px;
  object-fit: cover;
}
.who .name {
  font-weight: 700;
  font-size: 18px;
}
.who .stage {
  color: #2f8b60;
  font-weight: 600;
}
.who .days {
  color: #7a8b99;
  font-size: 12px;
}
.intro {
  color: #6b7b88;
}

.table {
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 12px;
}
.category + .category {
  margin-top: 14px;
}
.cat-head {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  padding: 6px 4px 8px 4px;
}
.cat-title {
  font-size: 16px;
}
.cat-total {
  font-size: 16px;
  transition: color 0.3s ease;
}

.cat-total.exceeded {
  color: #c94d4d;
  font-weight: 700;
}

.cat-total.valid {
  color: #2f8b60;
  font-weight: 700;
}
.thead {
  display: grid;
  grid-template-columns: 2fr 80px 90px;
  padding: 6px 4px;
  color: #7a8b99;
  font-size: 12px;
}
.row {
  display: grid;
  grid-template-columns: 2fr 80px 90px;
  gap: 6px;
  align-items: center;
  padding: 8px 4px;
}
.row + .row {
  border-top: 1px solid #f2f2f2;
}
.item-left {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 6px;
}
.item-left .ghost {
  color: #9aa7b3;
  margin-left: 4px;
}
.item-left .right {
  margin-left: auto;
  color: #7a8b99;
}
.pill {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  padding: 1px 3px;
  min-width: 0;
}
.pill.active {
  border-color: #ff6a6a;
}
.pill input {
  border: none;
  outline: none;
  padding: 1px 2px;
  font-size: 11px;
  width: 100%;
  min-width: 0;
}
.pill .unit {
  font-size: 9px;
  color: #7a8b99;
  margin-left: 2px;
  white-space: nowrap;
}
.footer {
  display: grid;
  grid-template-columns: 1fr 100px 90px;
  gap: 10px;
  align-items: center;
  margin-top: 16px;
}
.footer .total-label {
  font-weight: 700;
}
.footer input {
  width: 100%;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  padding: 8px 10px;
}
.save {
  background: #2f8b60;
  color: #fff;
  border: none;
  padding: 10px 12px;
  border-radius: 12px;
}

/* Mobile tweaks */
@media (max-width: 420px) {
  .panel {
    margin: 12px 12px;
    padding: 16px;
  }
  .profile {
    grid-template-columns: 72px 1fr;
    gap: 12px;
  }
  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 12px;
  }
  .intro {
    font-size: 12px;
  }
  .table {
    padding: 8px;
  }
  .thead {
    grid-template-columns: 1fr 70px 70px;
    font-size: 10px;
  }
  .row {
    grid-template-columns: 1fr 70px 70px;
    gap: 4px;
    padding: 4px 2px;
  }
  .pill {
    padding: 1px 2px;
  }
  .pill input {
    padding: 1px;
    font-size: 10px;
  }
  .pill .unit {
    font-size: 8px;
  }
  .footer {
    grid-template-columns: 1fr 70px 70px;
    gap: 6px;
  }
  .footer input {
    padding: 6px 8px;
    font-size: 14px;
  }
  .save {
    padding: 8px 10px;
    border-radius: 10px;
  }
}
</style>
