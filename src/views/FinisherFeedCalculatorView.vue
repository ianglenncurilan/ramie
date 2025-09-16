<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-inner">
        <button class="back" @click="$router.back()">←</button>

        <div class="profile">
          <img class="avatar" src="/finsher.png" alt="finisher" />
          <div class="who">
            <div class="name">Finisher Feed</div>
            <div class="stage">40% Protein / 60% Carbs</div>
            <div class="days">120-150 Days</div>
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
                <div
                  class="pill"
                  :class="{
                    'auto-populated':
                      findInventoryItem(item.id) && findInventoryItem(item.id).isAvailable,
                  }"
                >
                  <input type="number" min="0" step="0.01" v-model.number="costs[item.id]" />
                  <span
                    v-if="findInventoryItem(item.id) && findInventoryItem(item.id).isAvailable"
                    class="auto-indicator"
                    title="Auto-populated from inventory"
                    >📦</span
                  >
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
import { useRouter } from 'vue-router'
import { useFeedsStore } from '../stores/feeds'
import { useInventoryStore } from '../stores/inventory'

const router = useRouter()
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

// Finisher feed categories with 40% Protein / 60% Carbs ratio
const uiCategories = [
  {
    key: 'carbs',
    title: 'Carbohydrates (60%)',
    total: 60,
    items: [
      { id: 'banana', label: 'Banana Peels', base: 30 },
      { id: 'ricebran', label: 'Rice Bran D2 (rbd2)', base: 30 },
    ],
  },
  {
    key: 'protein',
    title: 'Protein (40%)',
    total: 40,
    items: [
      { id: 'ramie', label: 'Ramie', note: 'fresh & shredded', base: 10 },
      { id: 'cadamba', label: 'Cadamba', note: 'dried', base: 10 },
      { id: 'copra', label: 'Copra Meal', base: 20 },
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
]

const amounts = reactive({})
const costs = reactive({})

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

// Function to auto-populate costs from inventory
function autoPopulateCosts() {
  uiCategories.forEach((category) => {
    category.items.forEach((item) => {
      const inventoryItem = findInventoryItem(item.id)
      if (inventoryItem && inventoryItem.isAvailable) {
        // Convert cost to per KG if needed
        let costPerKg = inventoryItem.cost
        if (inventoryItem.unit !== 'kg') {
          // Simple conversion - you might want to add more sophisticated unit conversion
          switch (inventoryItem.unit) {
            case 'g':
              costPerKg = inventoryItem.cost * 1000
              break
            case 'lbs':
              costPerKg = inventoryItem.cost * 2.20462
              break
            case 'tons':
              costPerKg = inventoryItem.cost / 1000
              break
            default:
              costPerKg = inventoryItem.cost
          }
        }
        costs[item.id] = costPerKg
      }
    })
  })
}

function getCategoryTotal(category) {
  return category.items.reduce((total, item) => {
    return total + (Number(amounts[item.id]) || 0)
  }, 0)
}

// Auto-populate costs when component mounts
onMounted(() => {
  autoPopulateCosts()
})

// Watch for changes in inventory to re-populate costs
watch(
  () => inventoryStore.ingredients,
  () => {
    autoPopulateCosts()
  },
  { deep: true },
)

function saveFormulation() {
  // Validate that all categories meet their requirements
  const validationErrors = []

  uiCategories.forEach((category) => {
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
  uiCategories.forEach((cat) => {
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

  // Deduct ingredients from inventory
  const deductionResults = []
  const totalAmount = items.reduce((sum, item) => sum + item.amountKg, 0)
  const totalCost = items.reduce((sum, item) => sum + item.amountKg * item.costPerKg, 0)

  items.forEach((item) => {
    const result = inventoryStore.deductIngredientQuantity(item.label, item.amountKg)
    deductionResults.push(result)
  })

  // Show deduction results
  const successfulDeductions = deductionResults.filter((result) => result.success)
  const failedDeductions = deductionResults.filter((result) => !result.success)

  if (successfulDeductions.length > 0) {
    const successMessage = successfulDeductions
      .map((r) => `${r.deducted}kg of ${r.ingredient}`)
      .join(', ')
    console.log(`Successfully deducted: ${successMessage}`)
  }

  if (failedDeductions.length > 0) {
    const failedNames = failedDeductions.map((r) => r.ingredient).join(', ')
    alert(
      `Warning: Could not deduct inventory for: ${failedNames}. These ingredients may not be in your inventory.`,
    )
  }

  // Add record with detailed information
  feedsStore.addRecord({
    stage: 'finisher',
    items,
    totalAmount: totalAmount,
    totalCost: totalCost,
    date: new Date().toISOString(),
  })

  // Add expense for the total cost
  if (totalCost > 0) {
    feedsStore.addExpense({
      label: `Feed Formulation (Finisher) - ${totalAmount.toFixed(1)}kg`,
      amount: totalCost,
    })
  }

  // Show success message
  alert(
    `Finisher feed formulation saved successfully!\nTotal: ${totalAmount.toFixed(1)}kg\nTotal Cost: ₱${totalCost.toFixed(2)}`,
  )

  router.push({ name: 'records' })
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
