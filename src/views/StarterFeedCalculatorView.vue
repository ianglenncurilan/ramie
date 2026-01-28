<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-inner">
        <button class="back" @click="$router.back()">←</button>

        <div class="profile">
          <img class="avatar" src="/starter.png" alt="starter" />
          <div class="who">
            <div class="name">Starter Feed</div>
            <div class="stage">60% Protein / 40% Carbs</div>
            <div class="days">60-90 Days</div>
          </div>
        </div>

        <div class="category-totals">
          <div class="totals-title">Feed Formulation Calculator</div>
          <div class="formulation-info">
            <div class="info-text">
              <strong>Target Ratio:</strong> 60% Protein : 40% Carbohydrates
            </div>
            <div class="calculation-breakdown">
              <div class="calc-row">
                <span>Current Protein (Anchor):</span>
                <span class="calc-value">{{ getCurrentProteinTotal().toFixed(2) }}kg</span>
              </div>
              <div class="calc-row">
                <span>Required Carbohydrates:</span>
                <span class="calc-value required-calc"
                  >{{ getRequiredCarbohydrates().toFixed(2) }}kg</span
                >
              </div>
              <div class="calc-row">
                <span>Total Batch Size:</span>
                <span class="calc-value">{{ getTotalBatchSize().toFixed(2) }}kg</span>
              </div>
              <div class="calc-row">
                <span>Current Carbohydrates:</span>
                <span
                  class="calc-value"
                  :class="{ exceeded: getCurrentCarbsTotal() > getRequiredCarbohydrates() }"
                >
                  {{ getCurrentCarbsTotal().toFixed(2) }}kg
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="table">
          <div v-for="category in uiCategories" :key="category.key" class="category">
            <div class="cat-head">
              <div class="cat-title">{{ category.title }}</div>
              <div
                v-if="['carbs', 'protein'].includes(category.key)"
                class="cat-total"
                :class="{
                  exceeded:
                    category.key === 'carbs' && getCurrentCarbsTotal() > getRequiredCarbohydrates(),
                  valid: category.key === 'protein' && getCurrentProteinTotal() > 0,
                }"
              >
                <template v-if="category.key === 'protein'">
                  {{ getCurrentProteinTotal().toFixed(2) }}kg
                </template>
                <template v-else-if="category.key === 'carbs'">
                  {{ getCurrentCarbsTotal().toFixed(2) }}kg /
                  {{ getRequiredCarbohydrates().toFixed(2) }}kg
                </template>
              </div>
            </div>

            <div class="thead">
              <span></span>
              <span class="th">Amount</span>
              <span class="th">Cost per kg</span>
            </div>

            <div v-for="(item, idx) in category.items" :key="item.id" class="row">
              <div class="item-left">
                <span class="num">{{ idx + 1 }}.</span>
                <span class="label">{{ item.label }}</span>
                <span class="ghost" v-if="item.note">({{ item.note }})</span>
              </div>
              <div class="cell amount">
                <div
                  class="pill"
                  :class="{
                    active: amounts[item.id],
                    exceeded: getCategoryTotal(category) > category.total,
                  }"
                >
                  <input type="number" min="0" step="0.01" v-model.number="amounts[item.id]" />
                  <span class="unit">{{ getIngredientUnit(item) }}</span>
                </div>
              </div>
              <div class="cell cost">
                <div
                  class="pill"
                  :class="{
                    'auto-populated':
                      (findInventoryItem(item.id) && findInventoryItem(item.id).isAvailable) ||
                      (findInventoryItemByName(item.label) &&
                        findInventoryItemByName(item.label).isAvailable),
                  }"
                >
                  <template
                    v-if="
                      (findInventoryItem(item.id) && findInventoryItem(item.id).isAvailable) ||
                      (findInventoryItemByName(item.label) &&
                        findInventoryItemByName(item.label).isAvailable)
                    "
                  >
                    <span class="cost-display"
                      >₱ {{ costs[item.id] ? Number(costs[item.id]).toFixed(2) : '0.00' }}</span
                    >
                    <span class="auto-indicator" title="Auto-populated from inventory">📦</span>
                  </template>
                  <input v-else type="number" min="0" step="0.01" v-model.number="costs[item.id]" />
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
  </div>
</template>

<script setup>
import { computed, reactive, watch, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedsStore } from '../stores/feeds'
import { useInventoryStore } from '../stores/inventory'
import { useFeedFormulationsStore } from '../stores/feedFormulations'

const router = useRouter()
const feedsStore = useFeedsStore()
const inventoryStore = useInventoryStore()
// Initialize the store
const feedFormulationsStore = useFeedFormulationsStore()
const saveStatus = ref({ success: false, error: null })

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
  ricehull: ['rice hull', 'ricehull', 'ricehulls', 'rice hulls'],
  // Water is handled separately and should not be in the main ingredient mapping
}

// Starter feed categories with 60% Protein / 40% Carbs ratio
const uiCategories = computed(() => {
  // Get available ingredients from inventory
  const availableIngredients = inventoryStore.availableIngredients

  // Categorize ingredients by type
  const categorizedIngredients = {
    carbs: availableIngredients.filter((ingredient) => ingredient.type === 'carbs'),
    protein: availableIngredients.filter((ingredient) => ingredient.type === 'protein'),
    vitamins: availableIngredients.filter((ingredient) => ingredient.type === 'vitamins'),
    minerals: availableIngredients.filter((ingredient) => ingredient.type === 'minerals'),
  }

  return [
    {
      key: 'protein',
      title: 'Protein (Anchor)',
      items: categorizedIngredients.protein.map((ingredient) => ({
        id: ingredient.id,
        label: ingredient.name,
        base: Math.round(ingredient.quantity * 0.1) || 1,
        cost: ingredient.cost,
      })),
    },
    {
      key: 'carbs',
      title: 'Carbohydrates',
      items: categorizedIngredients.carbs.map((ingredient) => ({
        id: ingredient.id,
        label: ingredient.name,
        base: Math.round(ingredient.quantity * 0.1) || 1, // Use 10% of available quantity as base
        cost: ingredient.cost,
      })),
    },
    {
      key: 'vitamins',
      title: 'Vitamins',
      items: categorizedIngredients.vitamins.map((ingredient) => ({
        id: ingredient.id,
        label: ingredient.name,
        base: Math.round(ingredient.quantity * 0.1) || 1,
        cost: ingredient.cost,
      })),
    },
    {
      key: 'minerals',
      title: 'Minerals',
      items: categorizedIngredients.minerals.map((ingredient) => ({
        id: ingredient.id,
        label: ingredient.name,
        base: Math.round(ingredient.quantity * 0.1) || 1,
        cost: ingredient.cost,
      })),
    },
  ].filter((category) => category.items.length > 0) // Only show categories that have ingredients
})

const amounts = reactive({})
const costs = reactive({})
const categoryTotals = reactive({})

// Function to calculate similarity between two strings (0-1)
function stringSimilarity(s1, s2) {
  // Remove all non-alphanumeric characters and convert to lowercase
  const cleanStr = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

  // If either string is empty after cleaning, return 0
  if (!s1 || !s2) return 0

  const str1 = cleanStr(s1)
  const str2 = cleanStr(s2)

  // If strings are identical after cleaning, return 1
  if (str1 === str2) return 1

  // If one string is empty after cleaning, return 0
  if (str1.length === 0 || str2.length === 0) return 0

  // Calculate Levenshtein distance
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))
  for (let i = 0; i <= str1.length; i++) track[0][i] = i
  for (let j = 0; j <= str2.length; j++) track[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + cost, // substitution
      )
    }
  }

  // Calculate similarity ratio (0-1)
  const maxLen = Math.max(str1.length, str2.length)
  return 1 - track[str2.length][str1.length] / maxLen
}

// Function to find matching inventory item for a feed ingredient
const findInventoryItem = (ingredientId) => {
  // Map of feed ingredient IDs to possible inventory item names
  const ingredientMap = {
    // Carbohydrates
    'starter-carbs-1': ['rice bran d1', 'ricebran d1', 'rbd1', 'rice bran', 'ricebran'],
    'starter-carbs-2': ['rice bran d2', 'ricebran d2', 'rbd2'],
    'starter-carbs-3': ['rice hull', 'ricehull', 'ricehulls', 'rice hulls'],

    // Protein
    'starter-protein-1': ['camote tops', 'sweet potato leaves', 'camote', 'sweet potato'],
    'starter-protein-2': ['moringa', 'malunggay', 'moringa leaves'],
    'starter-protein-3': ['ramie'],
    'starter-protein-4': ['azolla'],
    'starter-protein-5': ['madre de agua', 'madre de agua leaves', 'madre agua'],
    'starter-protein-6': ['water hyacinth', 'waterhyacinth', 'hyacinth'],
    'starter-protein-7': ['cadamba'],
    'starter-protein-8': ['banana leaves', 'bananaleaves', 'banana'],
    'starter-protein-9': ['fish meal', 'fishmeal', 'fish'],
    'starter-protein-10': ['soya meal', 'soybean meal', 'soy meal', 'soybean', 'soya'],
    'starter-protein-11': ['palm kernel meal', 'palm kernel', 'palm meal'],

    // Minerals
    'starter-minerals-1': ['salt', 'iodized salt', 'rock salt'],
    'starter-minerals-2': [
      'carbonized rice hulls',
      'crushed rice hull',
      'carbonized rice',
      'cr rice hulls',
    ],

    // Vitamins
    'starter-vitamins-1': ['molasses', 'blackstrap molasses', 'sugar cane molasses'],

    // Water (not a carbohydrate, kept for reference if needed elsewhere)
    'water-1': ['water', 'clean water', 'drinking water'],
  }

  const possibleNames = ingredientMap[ingredientId] || []
  if (possibleNames.length === 0) return null

  // Find the best matching inventory item using similarity score
  let bestMatch = null
  let highestScore = 0.7 // Minimum similarity threshold (0-1)

  for (const item of inventoryStore.ingredients) {
    for (const name of possibleNames) {
      const score = stringSimilarity(item.name, name)
      if (score > highestScore) {
        highestScore = score
        bestMatch = item
      }
    }
  }

  return bestMatch
}

// Function to find inventory item by name with fuzzy matching
const findInventoryItemByName = (ingredientName) => {
  if (!ingredientName) return null

  console.log(`findInventoryItemByName called with:`, {
    ingredientName,
    totalIngredients: inventoryStore.ingredients.length,
  })

  // First try exact match
  const exactMatch = inventoryStore.ingredients.find(
    (item) => item.name.toLowerCase().trim() === ingredientName.toLowerCase().trim(),
  )
  if (exactMatch) {
    console.log(`Found exact match:`, exactMatch)
    return exactMatch
  }

  // If no exact match, find the most similar item
  let bestMatch = null
  let highestScore = 0.7 // Minimum similarity threshold (0-1)

  for (const item of inventoryStore.ingredients) {
    const score = stringSimilarity(item.name, ingredientName)
    if (score > highestScore) {
      highestScore = score
      bestMatch = item
    }
  }

  console.log(`Best fuzzy match:`, { bestMatch, score: highestScore })
  return bestMatch
}

// Function to get the unit for an ingredient from inventory
const getIngredientUnit = (ingredient) => {
  if (!ingredient) return 'KG'

  // First try to find by ID if id exists
  if (ingredient.id) {
    const byId = findInventoryItem(ingredient.id)
    if (byId?.unit) return byId.unit.toUpperCase()
  }

  // Then try to find by name if label exists
  if (ingredient.label) {
    const byName = findInventoryItemByName(ingredient.label)
    if (byName?.unit) return byName.unit.toUpperCase()
  }

  // Default to KG if no unit found
  return 'KG'
}

// Initialize all amounts to 0 to ensure reactivity
onMounted(() => {
  uiCategories.value.forEach((category) => {
    category.items.forEach((item) => {
      amounts[item.id] = 0
    })
    // Initialize category totals
    if (categoryTotals[category.key] === undefined) {
      categoryTotals[category.key] = category.total || 0
    }
  })
})

// Function to auto-populate costs from inventory
function autoPopulateCosts() {
  uiCategories.value.forEach((category) => {
    category.items.forEach((item) => {
      // First try to find by ID mapping (for hardcoded ingredients)
      let inventoryItem = findInventoryItem(item.id)

      // If not found by ID, try to find by name (for dynamic ingredients)
      if (!inventoryItem) {
        inventoryItem = findInventoryItemByName(item.label)
      }

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
        console.log(`Auto-populated cost for ${item.label}: ₱${costPerKg}/kg from inventory`)
      } else {
        console.log(`No available inventory found for ${item.label}`)
      }
    })
  })
}

// Reverse calculation functions for intelligent feed formulation
const getCurrentProteinTotal = () => {
  const proteinCategory = uiCategories.value.find((cat) => cat.key === 'protein')
  const total = proteinCategory
    ? proteinCategory.items.reduce((sum, item) => sum + (amounts[item.id] || 0), 0)
    : 0
  return Math.round(total * 100) / 100 // Strict 2 decimal places
}

const getCurrentCarbsTotal = () => {
  const carbsCategory = uiCategories.value.find((cat) => cat.key === 'carbs')
  const total = carbsCategory
    ? carbsCategory.items.reduce((sum, item) => sum + (amounts[item.id] || 0), 0)
    : 0
  return Math.round(total * 100) / 100 // Strict 2 decimal places
}

const getRequiredCarbohydrates = () => {
  const proteinTotal = getCurrentProteinTotal()
  if (proteinTotal === 0) return 0

  // If protein is 60%, then carbs must be 40% of total
  // protein = 0.60 * total_batch_size
  // total_batch_size = protein / 0.60
  // required_carbs = 0.40 * total_batch_size = 0.40 * (protein / 0.60) = (0.40/0.60) * protein = (2/3) * protein
  const required = (2 / 3) * proteinTotal
  return Math.round(required * 100) / 100 // Strict 2 decimal places, rounds up .666666 to .67
}

const getTotalBatchSize = () => {
  const proteinTotal = getCurrentProteinTotal()
  if (proteinTotal === 0) return 0

  // total_batch_size = protein / 0.60
  const total = proteinTotal / 0.6
  return Math.round(total * 100) / 100 // Strict 2 decimal places
}

function getCategoryTotal(category) {
  const total = category.items.reduce((total, item) => {
    const amount = Number(amounts[item.id]) || 0
    return total + amount
  }, 0)
  return Math.round(total * 100) / 100 // Strict 2 decimal places
}

// Auto-populate costs when component mounts
onMounted(async () => {
  // Always refresh inventory to ensure we have the latest data
  await inventoryStore.fetchIngredients()
  autoPopulateCosts()
})

// Watch for changes in inventory to re-populate costs and update UI
watch(
  () => inventoryStore.ingredients,
  () => {
    autoPopulateCosts()
    // Force reactivity update for uiCategories
    // The computed property will automatically update, but we ensure it triggers
  },
  { deep: true },
)

// Watch availableIngredients to ensure UI updates when quantities change
watch(
  () => inventoryStore.availableIngredients,
  () => {
    // This ensures the ingredient list updates when inventory changes
    autoPopulateCosts()
  },
  { deep: true },
)

const saveFormulation = async () => {
  try {
    // Initialize array to track inventory deduction results
    const deductionResults = []

    // No longer require individual fields to be filled
    // Only the totals for Carbs and Protein matter

    // Reverse calculation validation - Protein is the anchor
    const proteinTotal = getCurrentProteinTotal()
    const carbsTotal = getCurrentCarbsTotal()
    const requiredCarbs = getRequiredCarbohydrates()

    if (proteinTotal === 0) {
      alert('Please input protein ingredients first. Protein is the anchor for the formulation.')
      return
    }

    // Strict validation - carbohydrates must exactly match required amount
    if (Math.abs(carbsTotal - requiredCarbs) > 0.01) {
      alert(
        `Carbohydrates must exactly match the required amount for the 60:40 ratio. With ${proteinTotal}kg of protein, you need exactly ${requiredCarbs.toFixed(2)}kg of carbohydrates. Current: ${carbsTotal}kg`,
      )
      return
    }

    // For other categories, validate against their custom totals if set
    for (const category of uiCategories.value) {
      if (category.key === 'carbs' || category.key === 'protein') continue

      const categoryTotal = category.items.reduce((sum, item) => sum + (amounts[item.id] || 0), 0)
      const targetTotal = categoryTotals[category.key] || 0

      if (targetTotal > 0 && Math.abs(categoryTotal - targetTotal) > 0.01) {
        alert(
          `Total ${category.title.toLowerCase()} must be ${targetTotal}. Current total: ${categoryTotal}`,
        )
        return
      }
    }

    // Prepare items for saving - use same pattern as Grower/Finisher views
    const items = []
    uiCategories.value.forEach((cat) => {
      cat.items.forEach((it) => {
        const amountKg = parseFloat(amounts[it.id]) || 0
        const costPerKg = parseFloat(costs[it.id]) || 0
        if (amountKg > 0) {
          // Find the inventory item using the original label (without notes)
          const inventoryItem = findInventoryItem(it.id) || findInventoryItemByName(it.label)
          items.push({
            id: it.id,
            label: `${it.label}${it.note ? ' (' + it.note + ')' : ''}`,
            originalLabel: it.label, // Store original label for inventory matching
            inventoryItemId: inventoryItem?.id, // Store inventory item ID for direct deduction
            amountKg,
            costPerKg,
          })
        }
      })
    })

    console.log(`Final items for saving:`, items)

    // Calculate totals directly from amounts and costs objects
    let totalAmount = 0
    let totalCost = 0

    // Calculate total amount and cost from the actual form inputs
    for (const [ingredientId, amount] of Object.entries(amounts)) {
      const amountValue = parseFloat(amount) || 0
      const costValue = parseFloat(costs[ingredientId]) || 0
      totalAmount += amountValue
      totalCost += amountValue * costValue
    }

    console.log('Calculated totals:', { totalAmount, totalCost, amounts, costs })

    // Pre-check inventory sufficiency to avoid partial deductions
    const insufficient = []
    for (const item of items) {
      if (item.amountKg > 0) {
        // Use inventory item ID if available, otherwise try to find by original label
        let invItem = null
        if (item.inventoryItemId) {
          invItem = inventoryStore.ingredients.find(ing => ing.id === item.inventoryItemId)
        }
        if (!invItem) {
          invItem = findInventoryItemByName(item.originalLabel || item.label)
        }
        const currentQty = Number(invItem?.quantity) || 0
        if (!invItem || currentQty < Number(item.amountKg)) {
          insufficient.push({ name: item.label, available: currentQty, needed: item.amountKg })
        }
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
      if (item.amountKg > 0) {
        try {
          // Use inventory item ID if available, otherwise try to find by original label
          let inventoryItem = null
          if (item.inventoryItemId) {
            inventoryItem = inventoryStore.ingredients.find(ing => ing.id === item.inventoryItemId)
          }
          if (!inventoryItem) {
            inventoryItem = findInventoryItemByName(item.originalLabel || item.label)
          }
          
          if (inventoryItem) {
            const res = await inventoryStore.deductIngredientQuantity(
              inventoryItem.id,
              item.amountKg,
            )
            if (!res.success) {
              alert(`Failed to deduct ${item.label}: ${res.error || 'Unknown error'}`)
              return
            }
            // Use updated remaining quantity from result when available
            deductionResults.push({
              success: true,
              ingredient: item.label,
              deducted: item.amountKg,
              remaining:
                typeof res.remaining === 'number'
                  ? res.remaining
                  : Math.max(0, (Number(inventoryItem.quantity) || 0) - item.amountKg),
            })
          } else {
            alert(`Failed to deduct ${item.label}: Item not found in inventory`)
            return
          }
        } catch (error) {
          console.error(`Error deducting ${item.label}:`, error)
          alert(`Failed to deduct ${item.label}: ${error.message}`)
          return
        }
      }
    }

    // Filter successful and failed deductions
    const successfulDeductions = deductionResults.filter((r) => r.success)
    const failedDeductions = deductionResults.filter((r) => !r.success)

    // Create record with detailed information
    const record = {
      stage: 'Starter',
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        amountKg: item.amountKg,
        costPerKg: item.costPerKg,
      })),
      totalAmount,
      totalCost,
      date: new Date().toISOString(),
      inventoryDeductions: deductionResults,
    }

    // Update UI state
    saveStatus.value = { success: true, error: null }

    // Save to database
    const result = await feedFormulationsStore.saveFormulation(record)
    console.log('Save result:', result)

    await feedsStore.addRecord(record)

    // Add expense for the total cost
    if (totalCost > 0) {
      feedsStore.addExpense({
        label: `Feed Formulation (Starter) - ${totalAmount.toFixed(1)}kg`,
        amount: totalCost,
      })
    }

    // Prepare success message
    let successMessage = `Starter feed formulation saved successfully!\n\n`
    successMessage += `Total: ${totalAmount.toFixed(1)}kg\n`
    successMessage += `Total Cost: ₱${totalCost.toFixed(2)}`

    if (successfulDeductions.length > 0) {
      successMessage += '\n\nInventory updated:'
      successfulDeductions.forEach((d) => {
        successMessage += `\n- ${d.deducted}kg of ${d.ingredient} (${d.remaining}kg remaining)`
      })
    }

    if (failedDeductions.length > 0) {
      successMessage += '\n\nWarning: Could not update inventory for:'
      failedDeductions.forEach((d) => {
        successMessage += `\n- ${d.ingredient}: ${d.error || 'Unknown error'}`
      })
    }

    alert(successMessage)

    // Refresh inventory to ensure UI is up to date
    await inventoryStore.fetchIngredients()

    // Reset form
    Object.keys(amounts).forEach((key) => {
      amounts[key] = 0
    })
    Object.keys(costs).forEach((key) => {
      costs[key] = 0
    })

    // Navigate to records
    router.replace({ name: 'records' })
  } catch (error) {
    console.error('Error saving feed formulation:', error)
    alert(`Error saving feed formulation: ${error.message}`)
  }
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

.auto-populate-info {
  font-size: 11px;
  color: #666;
  font-style: italic;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 6px;
  align-self: flex-start;
  margin-top: 4px;
}

.category-totals {
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.totals-title {
  font-weight: 600;
  font-size: 14px;
  color: #2f8b60;
  margin-bottom: 12px;
  text-align: center;
}

.formulation-info {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-text {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.calculation-breakdown {
  display: grid;
  gap: 6px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.calc-value {
  font-weight: 600;
  color: #2f8b60;
}

.calc-value.required-calc {
  color: #007500;
  font-weight: 700;
}

.calc-value.exceeded {
  color: #e74c3c;
  font-weight: 700;
  background-color: #fdf2f2;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.totals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.total-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.total-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  min-width: 80px;
  flex: 1;
}

.total-input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #007500;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  font-weight: 600;
  outline: none;
  background: white;
}

.total-input:focus {
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.2);
}

.total-input[readonly] {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.fixed-indicator {
  font-size: 12px;
  margin-left: 4px;
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
  color: #e74c3c;
  font-weight: 700;
  background-color: #fdf2f2;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.cat-total.valid {
  color: #2f8b60;
  font-weight: 700;
}
.thead {
  display: grid;
  grid-template-columns: 2fr 80px 90px;
  padding: 6px 0px;
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
  border: 1px solid #007500;
  border-radius: 6px;
  padding: 0.3rem;
  min-width: 0;
  border-color: rgb(19, 183, 1);
}
.pill.exceeded {
  background-color: #fdf2f2;
}
.pill.auto-populated {
  background-color: #f0f9ff;
  border-color: grey;
}

.cost-display {
  padding: 0.1rem;
  color: rgb(0, 15, 0);
  font-weight: 500;
  min-width: 60px;
  display: inline-block;
  text-align: right;
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
