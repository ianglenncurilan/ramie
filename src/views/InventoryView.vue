<template>
  <div class="screen">
    <div>
      <section class="panel">
        <div class="panel-header">
          <button class="back" @click="$router.back()">←</button>
          <div class="title-wrap">
            <h2 class="title-lg">Inventory</h2>
            <p class="sub">Manage your ingredients</p>
          </div>
          <div class="header-actions">
            <button class="add-btn" @click="openModal">
              <span>+</span>
            </button>
            <img class="panel-illustration" src="/inventory.png" alt="icon" />
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <span class="stat-value">{{ inventory.ingredients.length }}</span>
            <span class="stat-label">Total Items</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ inventory.availableIngredients.length }}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">₱{{ inventory.totalValue.toFixed(2) }}</span>
            <span class="stat-label">Total Value</span>
          </div>
        </div>

        <div class="table">
          <div class="tbody">
            <div class="thead">
              <span>Ingredient</span>
              <span>Qty</span>
              <span>Cost</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            <div class="row" v-for="ingredient in inventory.ingredients" :key="ingredient.id">
              <span class="ingredient-name">{{ ingredient.name }}</span>
              <span class="quantity">
                <input
                  v-model="ingredient.quantity"
                  @change="updateQuantity(ingredient.id, ingredient.quantity)"
                  type="number"
                  min="0"
                  step="0.1"
                  class="qty-input"
                />
                <span class="unit">{{ ingredient.unit }}</span>
              </span>
              <span class="cost">₱{{ ingredient.cost.toFixed(2) }}</span>
              <span :class="{ ok: ingredient.isAvailable, bad: !ingredient.isAvailable }">
                {{ ingredient.isAvailable ? 'Available' : 'Not Available' }}
              </span>
              <div class="actions">
                <button class="edit-btn" @click="editIngredient(ingredient)">✏️</button>
                <button
                  class="delete-btn"
                  @click="() => deleteIngredient(ingredient.id)"
                  @mousedown="console.log('Delete button mousedown')"
                  @mouseup="console.log('Delete button mouseup')"
                  @touchstart="console.log('Delete button touchstart')"
                  @touchend="console.log('Delete button touchend')"
                  @keydown="console.log('Delete button keydown')"
                  @keyup="console.log('Delete button keyup')"
                  type="button"
                >
                  X
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient' }}</h3>
            <button class="close-btn" @click="closeModal">×</button>
          </div>

          <form @submit.prevent="saveIngredient" class="modal-form">
            <div class="form-group">
              <label>Ingredient Name</label>
              <input
                v-model="form.name"
                @input="onNameChange"
                type="text"
                placeholder="Enter ingredient name"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Quantity</label>
                <input
                  v-model="form.quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  required
                />
              </div>

              <div class="form-group">
                <label>Unit</label>
                <select v-model="form.unit">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lbs">lbs</option>
                  <option value="tons">tons</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Cost per Unit (₱)</label>
              <input
                v-model="form.cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <!-- Hidden type field - not shown in UI -->
            <!-- <input v-model="form.type" type="hidden" /> -->

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
              <button type="submit" class="save-btn">
                {{ editingIngredient ? 'Update' : 'Add' }} Ingredient
              </button>
            </div>
          </form>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useInventoryStore } from '../stores/inventory'

const inventory = useInventoryStore()

// Modal state
const showModal = ref(false)
const editingIngredient = ref(null)

// Form data
const form = reactive({
  name: '',
  quantity: '',
  cost: '',
  unit: '',
  type: 'carbs',
})

// Fetch ingredients when component is mounted
onMounted(() => {
  inventory.fetchIngredients()
})

// Modal functions
function openModal() {
  showModal.value = true
  editingIngredient.value = null
  resetForm()
}

function closeModal() {
  showModal.value = false
  editingIngredient.value = null
  resetForm()
}

function resetForm() {
  form.name = ''
  form.quantity = ''
  form.cost = ''
  form.unit = 'kg'
  form.type = 'carbs'
}

function editIngredient(ingredient) {
  editingIngredient.value = ingredient
  form.name = ingredient.name
  form.quantity = ingredient.quantity
  form.cost = ingredient.cost
  form.unit = ingredient.unit
  form.type = ingredient.type || 'carbs'
  showModal.value = true
}

async function saveIngredient() {
  try {
    // Normalize numeric fields
    const payload = {
      name: String(form.name).trim(),
      quantity: Number(form.quantity) || 0,
      cost: Number(form.cost) || 0,
      unit: form.unit || 'kg',
      type: form.type || 'carbs',
    }

    if (editingIngredient.value) {
      // Update existing ingredient
      const { error } = await inventory.updateIngredient(editingIngredient.value.id, payload)
      if (error) {
        console.error('Error updating ingredient:', error)
        alert('Failed to update ingredient. Please try again.')
        return
      }
      closeModal()
    } else {
      // Add new ingredient
      const { data, error } = await inventory.addIngredient(payload)
      if (error) {
        console.error('Error saving ingredient:', error)
        alert('Failed to add ingredient. Please try again.')
        return
      }
      if (data) closeModal()
    }
  } catch (error) {
    console.error('Error saving ingredient:', error)
    alert('Unexpected error. Please try again.')
  }
}

async function deleteIngredient(id) {
  if (!confirm('Are you sure you want to delete this ingredient?')) return
  const { error } = await inventory.deleteIngredient(id)
  if (error) {
    console.error('Error deleting ingredient:', error)
    alert('Failed to delete ingredient. Please try again.')
  }
}

function updateQuantity(id, newQuantity) {
  inventory.updateQuantity(id, newQuantity)
}

// Function to auto-detect ingredient type based on name
function detectIngredientType(name) {
  const lowerName = name.toLowerCase()

  // Protein sources
  if (
    lowerName.includes('meal') ||
    lowerName.includes('fish') ||
    lowerName.includes('soybean') ||
    lowerName.includes('ramie') ||
    lowerName.includes('cadamba') ||
    lowerName.includes('copra')
  ) {
    return 'protein'
  }

  // Carbohydrate sources
  if (
    lowerName.includes('corn') ||
    lowerName.includes('wheat') ||
    lowerName.includes('rice') ||
    lowerName.includes('banana') ||
    lowerName.includes('bran')
  ) {
    return 'carbs'
  }

  // Vitamins
  if (
    lowerName.includes('vitamin') ||
    lowerName.includes('molasses') ||
    lowerName.includes('herbal') ||
    lowerName.includes('premix') ||
    lowerName.includes('cececal')
  ) {
    return 'vitamins'
  }

  // Minerals
  if (lowerName.includes('salt') || lowerName.includes('hull') || lowerName.includes('mineral')) {
    return 'minerals'
  }

  // Default to carbs
  return 'carbs'
}

// Auto-detect type when name changes
function onNameChange() {
  if (form.name) {
    form.type = detectIngredientType(form.name)
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
  background: #fff;
  margin: 12px 16px 100px 16px;
  border-radius: 18px;
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.header-actions {
  display: flex;
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
.add-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2f8b60;
  color: white;
  border: none;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0;
}
.stat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e9ecef;
}
.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #2f8b60;
}
.stat-label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

/* Table */
.table {
  background: #fff;
  margin-top: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  /* allow inner scroller to manage overflow */
}
.thead,
.row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
  /* ensure horizontal scrolling shows when viewport is narrow */
  min-width: 760px;
}
.thead {
  font-weight: 600;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

/* Column alignment: name left, qty center, cost right, status center, actions center */
.thead span:nth-child(1),
.row > :nth-child(1) { text-align: left; }
.thead span:nth-child(2),
.row > :nth-child(2) { text-align: center; }
.thead span:nth-child(3),
.row > :nth-child(3) { text-align: right; }
.thead span:nth-child(4),
.row > :nth-child(4) { text-align: center; }
.thead span:nth-child(5),
.row > :nth-child(5) { text-align: center; }
.row > .actions { justify-content: center; }
.tbody {
  overflow: auto; /* vertical and horizontal scroll */
  flex: 1;
  min-height: 0;
}
.row {
  border-bottom: 1px solid #f0f0f0;
}
.row:last-child {
  border-bottom: 0;
}

/* Table content */
.quantity {
  display: flex;
  align-items: center;
  gap: 4px;
}
.qty-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.unit {
  font-size: 12px;
  color: #666;
}
.cost {
  font-weight: 600;
  color: #2f8b60;
}
.actions {
  display: flex;
  gap: 8px;
}
.edit-btn,
.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}
.delete-btn {
  background: #ffebee;
  color: #d32f2f;
  pointer-events: auto;
  z-index: 10;
  position: relative;
}

.ok {
  color: #2f8b60;
  font-weight: 600;
}
.bad {
  color: #c94d4d;
  font-weight: 600;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
}

/* Form */
.modal-form {
  padding: 0 20px 20px 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.1);
}

/* Form actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.cancel-btn,
.save-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.cancel-btn {
  background: #f5f5f5;
  color: #666;
}
.save-btn {
  background: #2f8b60;
  color: white;
}

button {
  cursor: pointer;
}

/* Bottom Bar */
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
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}
.bottombar button.active {
  background: #2f8b60;
}
.bottombar button img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.bottombar button.active img {
  filter: brightness(0) invert(1);
}

/* Mobile responsiveness */
@media (max-width: 420px) {
  .panel {
    margin: 12px 12px 100px 12px;
    padding: 18px; /* slightly larger padding for better spacing */
  }
  .stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .stat-card { padding: 14px; border-radius: 12px; }
  .table { padding: 6px; border-radius: 12px; }
  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 90px; /* tighter to fit mobile */
    gap: 8px;
    padding: 8px 6px;
    font-size: 12px;
    min-width: 640px; /* allow side scroll on small phones */
  }
  .qty-input {
    width: 50px;
    padding: 2px 4px;
    font-size: 12px;
  }
  .actions {
    gap: 4px;
  }
  .edit-btn,
  .delete-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  .modal {
    margin: 10px;
    max-height: 95vh;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

/* Removed PIN styles */
</style>
