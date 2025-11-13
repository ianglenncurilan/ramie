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
          <div class="intro-actions">
            <button
              class="refresh-costs-btn"
              @click="autoPopulateCosts"
              title="Refresh costs from inventory"
            >
              🔄 Update Costs from Inventory
            </button>
            <div class="inventory-status">
              📦 {{ inventoryStore.availableIngredients.length }} ingredients available
            </div>
          </div>
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
            </div>

            <div v-for="(item, idx) in category.items" :key="item.id" class="row">
              <div class="item-left">
                <span class="num">{{ idx + 1 }}.</span>
                <span class="label">{{ item.label }}</span>
                <span class="ghost" v-if="item.note">({{ item.note }})</span>
              </div>
              <div class="cell amount">
                <div class="pill" :class="{ active: amounts[item.id] }">
                  <input type="number" min="0" step="0.01" v-model.number="amounts[item.id]" />
                  <span class="unit">KG</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <button class="save" @click="saveFormulation">Save</button>
          </div>
        </div>
      </div>
    </section>

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
import { computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Removed BottomBar import - using inline navigation
import { useFeedsStore } from '../stores/feeds'
import { useInventoryStore } from '../stores/inventory'

const route = useRoute()
const router = useRouter()
const stage = computed(() => String(route.params.stage || 'starter'))
const title = computed(() => stage.value.charAt(0).toUpperCase() + stage.value.slice(1))

const feedsStore = useFeedsStore()
const inventoryStore = useInventoryStore()

// Mapping between feed calculator ingredients and inventory items
const INGREDIENT_MAPPING = {
  banana: ['banana', 'banana peels'],
  ricebran: ['rice bran', 'ricebran', 'rbd2'],
  ramie: ['ramie'],
  cadamba: ['cadamba'],
  copra: ['copra', 'copra meal'],
  molasses: ['molasses'],
  herbal: ['herbal', 'herbal concoctions'],
  premix: ['premix', 'animal vita', 'vitamins'],
  cececal: ['cececal'],
  salt: ['salt'],
  ricehull: ['rice hull', 'ricehull', 'carbonised rice hull'],
  water: ['water'],
}

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

// Function to find matching inventory item for a feed ingredient
function findInventoryItem(ingredientId) {
  const possibleNames = INGREDIENT_MAPPING[ingredientId] || [ingredientId]

  for (const name of possibleNames) {
    const inventoryItem = inventoryStore.ingredients.find(
      (item) =>
        item.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(item.name.toLowerCase()),
    )
    if (inventoryItem) {
      return inventoryItem
    }
  }
  return null
}

// Function to find inventory item by exact name match (for dynamic ingredients)
function findInventoryItemByName(ingredientName) {
  return inventoryStore.ingredients.find(
    (item) =>
      item.name.toLowerCase() === ingredientName.toLowerCase() ||
      item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(item.name.toLowerCase()),
  )
}

function getCategoryTotal(category) {
  return category.items.reduce((total, item) => {
    return total + (Number(amounts[item.id]) || 0)
  }, 0)
}

async function saveFormulation() {
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
      if (amountKg > 0) {
        items.push({
          id: it.id,
          label: `${it.label}${it.note ? ' (' + it.note + ')' : ''}`,
          amountKg,
        })
      }
    })
  })

  // Total amount
  const totalAmount = items.reduce((sum, item) => sum + item.amountKg, 0)

  // Pre-check inventory sufficiency to avoid partial deductions
  const insufficient = []
  for (const item of items) {
    const invItem = findInventoryItem(item.id) || findInventoryItemByName(item.label)
    const currentQty = Number(invItem?.quantity) || 0
    if (!invItem || currentQty < Number(item.amountKg)) {
      insufficient.push({ name: item.label, available: currentQty, needed: item.amountKg })
    }
  }

  if (insufficient.length > 0) {
    const msg = insufficient
      .map((x) => `${x.name} (available: ${x.available}, needed: ${x.needed})`)
      .join(', ')
    alert(`Cannot save: insufficient quantity for ${msg}.`)
    return
  }

  // All sufficient: perform actual deductions and await completion
  for (const item of items) {
    const res = await inventoryStore.deductIngredientQuantity(item.id, item.amountKg)
    if (!res.success) {
      alert(`Failed to deduct ${item.label}: ${res.error || 'Unknown error'}`)
      return
    }
  }

  // Add record with detailed information
  await feedsStore.addRecord({
    stage: stage.value,
    items,
    totalAmount: totalAmount,
    date: new Date().toISOString(),
  })

  // Show success message
  alert(`Feed formulation saved successfully!\nTotal: ${totalAmount.toFixed(1)}kg`)

  router.replace({ name: 'records' })
}
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  height: 100vh;
  background: #2f8b60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel {
  margin: 12px 16px 100px 16px;
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.intro-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.refresh-costs-btn {
  background: #2f8b60;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.2s ease;
}
.refresh-costs-btn:hover {
  background: #247a52;
}
.inventory-status {
  font-size: 11px;
  color: #2f8b60;
  font-weight: 500;
  background: #f0f8f4;
  padding: 4px 8px;
  border-radius: 6px;
  align-self: flex-start;
}

.table {
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 20px;
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
.pill.auto-populated {
  border-color: #2f8b60;
  background-color: #f0f8f4;
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
.auto-indicator {
  font-size: 10px;
  margin-left: 2px;
  cursor: help;
}
.footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-bottom: 20px;
}
.save {
  background: #2f8b60;
  color: #fff;
  border: none;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
}
.save:hover {
  background: #247a52;
}
.save:active {
  transform: scale(0.98);
}

/* Mobile tweaks */
@media (max-width: 420px) {
  .panel {
    margin: 12px 12px 100px 12px;
    padding: 16px;
    max-height: calc(100vh - 140px);
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
    margin-top: 12px;
    padding-bottom: 20px;
  }
  .save {
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 14px;
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }
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
  height: 80px;
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
