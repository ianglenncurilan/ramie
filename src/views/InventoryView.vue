<template>
  <div class="screen">
    <!-- PIN Verification Screen -->
    <div v-if="!pinStore.isAuthenticated" class="pin-screen">
      <div class="pin-container">
        <div class="pin-header">
          <button class="back-btn" @click="$router.back()">←</button>
          <h2>Enter PIN</h2>
          <p>Access to inventory requires PIN verification</p>
        </div>

        <div class="pin-input-container">
          <div class="pin-display">
            <div
              v-for="i in 4"
              :key="i"
              class="pin-dot"
              :class="{ filled: pinInput.length >= i }"
            ></div>
          </div>
          <div class="pin-keypad">
            <button v-for="num in 9" :key="num" class="pin-key" @click="addDigit(num.toString())">
              {{ num }}
            </button>
            <button class="pin-key" @click="clearPin">Clear</button>
            <button v-for="num in [0]" :key="num" class="pin-key" @click="addDigit(num.toString())">
              {{ num }}
            </button>
            <button class="pin-key" @click="removeDigit">⌫</button>
          </div>
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content (only shown when authenticated) -->
    <div v-else>
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
              <button class="delete-btn" @click="deleteIngredient(ingredient.id)">🗑️</button>
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
              <input v-model="form.name" type="text" placeholder="Enter ingredient name" required />
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
import { usePinStore } from '../stores/pin'

const inventory = useInventoryStore()
const pinStore = usePinStore()

// PIN verification state
const pinInput = ref('')
const errorMessage = ref('')

// Check if PIN is set on mount
onMounted(() => {
  if (!pinStore.isPinSet) {
    // If no PIN is set, redirect to profile to set one
    // For now, we'll just show the PIN screen
  }
})

// PIN functions
function addDigit(digit) {
  if (pinInput.value.length < 4) {
    pinInput.value += digit
    errorMessage.value = ''

    // Auto-verify when 4 digits are entered
    if (pinInput.value.length === 4) {
      setTimeout(() => {
        verifyPin()
      }, 300)
    }
  }
}

function removeDigit() {
  if (pinInput.value.length > 0) {
    pinInput.value = pinInput.value.slice(0, -1)
    errorMessage.value = ''
  }
}

function clearPin() {
  pinInput.value = ''
  errorMessage.value = ''
}

function verifyPin() {
  if (pinInput.value.length === 4) {
    const isValid = pinStore.verifyPin(pinInput.value)
    if (isValid) {
      errorMessage.value = ''
    } else {
      errorMessage.value = 'Invalid PIN. Please try again.'
      pinInput.value = ''
    }
  } else {
    errorMessage.value = 'Please enter 4 digits'
  }
}

// Modal state
const showModal = ref(false)
const editingIngredient = ref(null)

// Form data
const form = reactive({
  name: '',
  quantity: '',
  cost: '',
  unit: 'kg',
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
}

function editIngredient(ingredient) {
  editingIngredient.value = ingredient
  form.name = ingredient.name
  form.quantity = ingredient.quantity
  form.cost = ingredient.cost
  form.unit = ingredient.unit
  showModal.value = true
}

function saveIngredient() {
  if (editingIngredient.value) {
    // Update existing ingredient
    inventory.updateIngredient(editingIngredient.value.id, {
      name: form.name,
      quantity: form.quantity,
      cost: form.cost,
      unit: form.unit,
    })
  } else {
    // Add new ingredient
    inventory.addIngredient({
      name: form.name,
      quantity: form.quantity,
      cost: form.cost,
      unit: form.unit,
    })
  }
  closeModal()
}

function deleteIngredient(id) {
  if (confirm('Are you sure you want to delete this ingredient?')) {
    inventory.deleteIngredient(id)
  }
}

function updateQuantity(id, newQuantity) {
  inventory.updateQuantity(id, newQuantity)
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
  overflow-y: auto;
  max-height: calc(100vh - 140px);
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
  display: grid;
}
.thead,
.row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
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
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}
.delete-btn {
  background: #ffebee;
  color: #d32f2f;
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
    max-height: calc(100vh - 140px);
  }
  .stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .thead,
  .row {
    grid-template-columns: 1.5fr 0.8fr 0.8fr 1fr 0.8fr;
    gap: 8px;
    padding: 8px 6px;
    font-size: 12px;
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
    width: 24px;
    height: 24px;
    font-size: 12px;
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

/* PIN Verification Styles */
.pin-screen {
  height: 100vh;
  background: #2f8b60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.pin-container {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.pin-header {
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  color: #333;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

.pin-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.pin-header p {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
}

.pin-input-container {
  text-align: center;
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
}

.pin-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: transparent;
  transition: all 0.2s ease;
}

.pin-dot.filled {
  background: #2f8b60;
  border-color: #2f8b60;
}

.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 240px;
  margin: 0 auto;
}

.pin-key {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-key:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

.pin-key:active {
  transform: scale(0.95);
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  margin-top: 16px;
  font-weight: 500;
}
</style>
