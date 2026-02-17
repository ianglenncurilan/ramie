<template>
  <div class="screen">
    <div>
      <section class="panel">
        <div class="panel-header">
          <button class="back" @click="$router.back()">←</button>
          <div class="title-wrap">
            <h2 class="title-lg">Ingredient Inventory</h2>
            <p class="sub">Manage your ingredients</p>
          </div>
          <div class="header-actions">
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
        </div>
        <div class="add-button-container">
          <button class="add-btn" @click="openModal">
            <span>Add Ingredient</span>
          </button>
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
              <div class="quantity-cell">
                <div
                  class="quantity-input-wrapper"
                  :class="{ updating: updatingQuantity === ingredient.id }"
                >
                  <input
                    type="text"
                    class="quantity-input"
                    :value="`${ingredient.quantity} ${ingredient.unit}`"
                    readonly
                    :disabled="updatingQuantity === ingredient.id"
                  />
                  <span v-if="updatingQuantity === ingredient.id" class="updating-indicator"
                    >⏳</span
                  >
                </div>
              </div>
              <span class="cost"
                >₱{{ (ingredient.isAvailable ? ingredient.cost || 0 : 0).toFixed(2) }}</span
              >
              <span :class="{ ok: ingredient.isAvailable, bad: !ingredient.isAvailable }">
                {{ ingredient.isAvailable ? 'Available' : 'Not Available' }}
              </span>
              <div class="actions">
                <button class="edit-btn" @click="editIngredient(ingredient)">✏️</button>
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
                v-if="editingIngredient"
                v-model="form.name"
                type="text"
                placeholder="Enter ingredient name"
                class="form-input"
                readonly
                disabled
                style="background: #f8f9fa; color: #666; cursor: not-allowed"
              />
              <select v-else v-model="form.name" @change="onNameChange" required>
                <option value="">Select an ingredient</option>

                <!-- Carbs -->
                <option value="Corn">Corn</option>
                <option value="Rice Bran D1">Rice Bran D1</option>
                <option value="Rice Bran D2">Rice Bran D2</option>
                <option value="Rice Hull">Rice Hull</option>
                <option value="Ramie">Ramie</option>

                <!-- Protein -->
                <option value="Camote Tops">Camote Tops</option>
                <option value="Moringa">Moringa</option>
                <option value="Azolla">Azolla</option>
                <option value="Madre de Agua">Madre de Agua</option>
                <option value="Water Hyacinth">Water Hyacinth</option>
                <option value="Cadamba">Cadamba</option>
                <option value="Banana Leaves">Banana Leaves</option>
                <option value="Fish Meal">Fish Meal</option>
                <option value="Soybean Meal">Soybean Meal</option>
                <option value="Palm Kernel Meal">Palm Kernel Meal</option>

                <!-- Minerals -->
                <option value="Salt">Salt</option>
                <option value="Carbonized Rice Hulls">Carbonized Rice Hulls</option>

                <!-- Vitamins -->
                <option value="Molasses">Molasses</option>

                <!-- Water -->
                <option value="Water">Water</option>

                <option value="Other">Other (Specify)</option>
              </select>
              <input
                v-if="!editingIngredient && form.name === 'Other'"
                v-model="form.customName"
                type="text"
                placeholder="Enter ingredient name"
                class="form-input"
                style="margin-top: 8px"
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
                  <option value="oz">oz</option>
                  <option value="liters">liters</option>
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

      <!-- Quantity Edit Modal -->
      <div v-if="showQuantityModal" class="modal-overlay" @click="closeQuantityModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Edit Quantity</h3>
            <button class="close-btn" @click="closeQuantityModal">×</button>
          </div>

          <form @submit.prevent="saveQuantity" class="modal-form">
            <div class="form-group">
              <label>Ingredient</label>
              <input
                type="text"
                :value="editingQuantityIngredient?.name"
                disabled
                class="disabled-input"
              />
            </div>

            <div class="form-group">
              <label>Quantity</label>
              <div class="quantity-input-group">
                <input
                  type="number"
                  v-model.number="quantityForm.quantity"
                  min="0"
                  step="0.1"
                  required
                  class="quantity-field"
                  ref="quantityInput"
                />
                <span class="unit">{{ editingQuantityIngredient?.unit }}</span>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="closeQuantityModal">Cancel</button>
              <button type="submit" class="btn-save" :disabled="updatingQuantity">
                {{ updatingQuantity ? 'Updating...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Undo Notification -->
      <div v-if="showUndoNotification" class="undo-notification">
        <div class="undo-content">
          <div class="undo-message">
            <span class="undo-icon">⚠️</span>
            <span
              >Deleted: {{ deletedIngredient?.name }} ({{ deletedIngredient?.quantity }}
              {{ deletedIngredient?.unit }})</span
            >
          </div>
          <div class="undo-actions">
            <button @click="undoDelete" class="undo-btn">Undo</button>
            <button @click="hideUndoNotification" class="dismiss-btn">Dismiss</button>
          </div>
        </div>
        <div class="undo-progress" :style="{ width: '100%' }">
          <div class="undo-progress-bar" :style="{ animation: 'countdown 10s linear' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { useInventoryStore } from '../stores/inventory'
import { isAdmin } from '../services/supabase'

const inventory = useInventoryStore()
const isUserAdmin = ref(false)

// Format number with commas
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Modal state
const showModal = ref(false)
const showQuantityModal = ref(false)
const editingIngredient = ref(null)
const editingQuantityIngredient = ref(null)
const updatingQuantity = ref(null)
const quantityInput = ref(null)

// Undo functionality state
const deletedIngredient = ref(null)
const showUndoNotification = ref(false)
const undoTimeout = ref(null)

// Form data
const form = reactive({
  name: '',
  customName: '',
  quantity: '',
  cost: '',
  unit: '',
  type: 'carbs',
})

// Quantity edit form
const quantityForm = reactive({
  quantity: '',
})

// Fetch ingredients when component is mounted
onMounted(async () => {
  await inventory.fetchIngredients()
  isUserAdmin.value = await isAdmin()
})

// Refresh inventory when view is activated (when navigating back to this view)
onActivated(() => {
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

// Quantity modal functions
function openQuantityModal(ingredient) {
  editingQuantityIngredient.value = ingredient
  quantityForm.quantity = ingredient.quantity
  showQuantityModal.value = true

  // Focus on the quantity input after modal opens
  setTimeout(() => {
    if (quantityInput.value) {
      quantityInput.value.focus()
      quantityInput.value.select()
    }
  }, 100)
}

function closeQuantityModal() {
  showQuantityModal.value = false
  editingQuantityIngredient.value = null
  quantityForm.quantity = ''
}

async function saveQuantity() {
  if (!editingQuantityIngredient.value) return

  try {
    updatingQuantity.value = editingQuantityIngredient.value.id

    // Validate the quantity
    const newQuantity = Number(quantityForm.quantity)
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Please enter a valid quantity (0 or greater)')
      return
    }

    // Update the ingredient in the database
    const { error } = await inventory.updateIngredient(editingQuantityIngredient.value.id, {
      quantity: newQuantity,
    })

    if (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity. Please try again.')
    } else {
      console.log(
        `Successfully updated ${editingQuantityIngredient.value.name} quantity to ${newQuantity}`,
      )
      closeQuantityModal()
    }
  } catch (error) {
    console.error('Error updating quantity:', error)
    alert('An error occurred while updating the quantity.')
  } finally {
    updatingQuantity.value = null
  }
}

function resetForm() {
  form.name = ''
  form.customName = ''
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
      name: form.name === 'Other' ? String(form.customName).trim() : String(form.name).trim(),
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
      // Add new ingredient (with upsert logic)
      const { data, error, action } = await inventory.addIngredient(payload)
      if (error) {
        console.error('Error saving ingredient:', error)
        alert('Failed to add ingredient. Please try again.')
        return
      }

      if (data) {
        // Show appropriate notification based on action
        if (action === 'updated') {
          showToast('Existing ingredient detected. Stock has been updated.', 'success')
        } else if (action === 'inserted') {
          showToast('Ingredient added successfully!', 'success')
        }
        closeModal()
      }
    }
  } catch (error) {
    console.error('Error saving ingredient:', error)
    alert('Unexpected error. Please try again.')
  }
}

// Toast notification function
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message

  // Add styles
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: type === 'success' ? '#28a745' : '#17a2b8',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    opacity: '0',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    transform: 'translateX(-50%) translateY(20px)',
  })

  // Add to DOM
  document.body.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateX(-50%) translateY(0)'
  }, 100)

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(-50%) translateY(20px)'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

async function deleteIngredient(id) {
  // Find the ingredient before deleting for undo functionality
  const ingredientToDelete = inventory.ingredients.find((item) => item.id === id)

  if (!ingredientToDelete) {
    alert('Ingredient not found')
    return
  }

  // Store the deleted ingredient for undo
  deletedIngredient.value = { ...ingredientToDelete }

  // Delete the ingredient
  const { error } = await inventory.deleteIngredient(id)
  if (error) {
    console.error('Error deleting ingredient:', error)
    alert('Failed to delete ingredient. Please try again.')
    deletedIngredient.value = null
    return
  }

  // Show undo notification
  showUndoNotification.value = true

  // Clear any existing timeout
  if (undoTimeout.value) {
    clearTimeout(undoTimeout.value)
  }

  // Auto-hide undo notification after 10 seconds
  undoTimeout.value = setTimeout(() => {
    hideUndoNotification()
  }, 10000)
}

// Undo delete function
async function undoDelete() {
  if (!deletedIngredient.value) return

  try {
    // Restore the ingredient
    const { error } = await inventory.addIngredient(deletedIngredient.value)

    if (error) {
      console.error('Error restoring ingredient:', error)
      alert('Failed to restore ingredient. Please try again.')
      return
    }

    console.log('✅ Ingredient restored:', deletedIngredient.value.name)
    hideUndoNotification()
  } catch (err) {
    console.error('Error undoing delete:', err)
    alert('Failed to restore ingredient. Please try again.')
  }
}

// Hide undo notification
function hideUndoNotification() {
  showUndoNotification.value = false
  deletedIngredient.value = null

  if (undoTimeout.value) {
    clearTimeout(undoTimeout.value)
    undoTimeout.value = null
  }
}

async function updateIngredientQuantity(ingredient) {
  try {
    updatingQuantity.value = ingredient.id

    // Validate the quantity
    const newQuantity = Number(ingredient.quantity)
    if (isNaN(newQuantity) || newQuantity < 0) {
      // Revert to original quantity if invalid
      const originalIngredient = inventory.ingredients.find((ing) => ing.id === ingredient.id)
      ingredient.quantity = originalIngredient.quantity
      alert('Please enter a valid quantity (0 or greater)')
      return
    }

    // Update the ingredient in the database
    const { error } = await inventory.updateIngredient(ingredient.id, {
      quantity: newQuantity,
    })

    if (error) {
      console.error('Error updating quantity:', error)
      // Revert to original quantity on error
      const originalIngredient = inventory.ingredients.find((ing) => ing.id === ingredient.id)
      ingredient.quantity = originalIngredient.quantity
      alert('Failed to update quantity. Please try again.')
    } else {
      console.log(`Successfully updated ${ingredient.name} quantity to ${newQuantity}`)
    }
  } catch (error) {
    console.error('Error updating quantity:', error)
    alert('An error occurred while updating the quantity.')
  } finally {
    updatingQuantity.value = null
  }
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
  height: 130vh;
  background: #dcdcdc;
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
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.add-button-container {
  display: flex;
  justify-content: flex-start;
  margin: 16px 0;
}

.add-btn {
  padding: 8px 16px;
  border-radius: 12px;
  background: #2f8b60;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  width: auto;
  min-width: 150px;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: #266647;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(47, 139, 96, 0.4);
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
  padding-top: 6px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  max-height: 60vh; /* Limit the maximum height */
  overflow: hidden; /* Hide the scrollbar for the container */
}
.thead,
.row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 140px;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
  /* ensure horizontal scrolling shows when viewport is narrow */
  min-width: 780px;
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
.row > :nth-child(1) {
  text-align: left;
}
.thead span:nth-child(2),
.row > :nth-child(2) {
  text-align: left;
}
.thead span:nth-child(3),
.row > :nth-child(3) {
  text-align: right;
}
.thead span:nth-child(4),
.row > :nth-child(4) {
  text-align: center;
}
.thead span:nth-child(5),
.row > :nth-child(5) {
  text-align: center;
}
.row > .actions {
  justify-content: center;
}
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
.quantity-cell {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.quantity-input-wrapper {
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 4px 8px;
  min-width: 80px;
  transition: all 0.2s ease;
}

.quantity-input-wrapper:focus-within {
  border-color: #2f8b60;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.1);
}

.quantity-input-wrapper.updating {
  border-color: #ffa500;
  background: #fff8dc;
}

.updating-indicator {
  font-size: 12px;
  margin-left: 4px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.quantity-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9em;
  font-weight: 500;
  color: #333;
  width: 50px;
  text-align: right;
  min-width: 0;
}

.quantity-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quantity-pill {
  display: inline-flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 12px;
  padding: 1px 12px;
  font-size: 0.9em;
  font-weight: 500;
  color: #333;
  border: 1px solid #ddd;
  min-width: 40px;
  justify-content: space-between;
  gap: 4px;
}

.unit {
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
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

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .panel {
    margin: 8px 8px 100px 8px;
    padding: 16px;
  }

  .panel-header {
    grid-template-columns: auto 1fr;
    gap: 12px;
  }

  .panel-illustration {
    display: none;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-card {
    padding: 12px;
    border-radius: 10px;
  }

  .table {
    padding: 4px;
    border-radius: 10px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 100px;
    gap: 6px;
    padding: 6px 4px;
    font-size: 11px;
    min-width: 600px;
  }

  .qty-input {
    width: 45px;
    padding: 2px 3px;
    font-size: 11px;
  }

  .quantity-input-wrapper {
    min-width: 65px;
    padding: 2px 4px;
  }

  .quantity-input {
    width: 35px;
    font-size: 11px;
  }

  .actions {
    gap: 3px;
  }

  .edit-btn,
  .delete-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .modal {
    margin: 8px;
    max-height: 96vh;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .panel {
    margin: 10px 10px 100px 10px;
    padding: 17px;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 14px;
  }

  .panel-illustration {
    width: 48px;
    height: 48px;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .stat-card {
    padding: 13px;
    border-radius: 11px;
  }

  .table {
    padding: 5px;
    border-radius: 11px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 105px;
    gap: 7px;
    padding: 7px 5px;
    font-size: 11px;
    min-width: 630px;
  }

  .qty-input {
    width: 48px;
    padding: 2px 3px;
    font-size: 11px;
  }

  .quantity-input-wrapper {
    min-width: 68px;
    padding: 2px 5px;
  }

  .quantity-input {
    width: 38px;
    font-size: 11px;
  }

  .actions {
    gap: 3px;
  }

  .edit-btn,
  .delete-btn {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }

  .modal {
    margin: 9px;
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 7px;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .panel {
    margin: 12px 12px 100px 12px;
    padding: 18px;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 16px;
  }

  .panel-illustration {
    width: 56px;
    height: 56px;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 14px;
    border-radius: 12px;
  }

  .table {
    padding: 6px;
    border-radius: 12px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 110px;
    gap: 8px;
    padding: 8px 6px;
    font-size: 12px;
    min-width: 660px;
  }

  .qty-input {
    width: 50px;
    padding: 2px 4px;
    font-size: 12px;
  }

  .quantity-input-wrapper {
    min-width: 70px;
    padding: 2px 6px;
  }

  .quantity-input {
    width: 40px;
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

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .panel {
    margin: 14px 14px 100px 14px;
    padding: 20px;
    max-width: 768px;
    margin-left: auto;
    margin-right: auto;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 20px;
  }

  .panel-illustration {
    width: 60px;
    height: 60px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    border-radius: 14px;
  }

  .table {
    padding: 8px;
    border-radius: 14px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 120px;
    gap: 10px;
    padding: 10px 8px;
    font-size: 13px;
    min-width: 720px;
  }

  .qty-input {
    width: 55px;
    padding: 3px 5px;
    font-size: 13px;
  }

  .quantity-input-wrapper {
    min-width: 75px;
    padding: 3px 8px;
  }

  .quantity-input {
    width: 45px;
    font-size: 13px;
  }

  .actions {
    gap: 5px;
  }

  .edit-btn,
  .delete-btn {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }

  .modal {
    margin: 15px;
    max-height: 90vh;
  }

  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .panel {
    margin: 16px 16px 100px 16px;
    padding: 22px;
    max-width: 1024px;
    margin-left: auto;
    margin-right: auto;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 24px;
  }

  .panel-illustration {
    width: 64px;
    height: 64px;
  }

  .stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .stat-card {
    padding: 18px;
    border-radius: 16px;
  }

  .table {
    padding: 10px;
    border-radius: 16px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 130px;
    gap: 12px;
    padding: 12px 10px;
    font-size: 14px;
    min-width: 770px;
  }

  .qty-input {
    width: 60px;
    padding: 4px 6px;
    font-size: 14px;
  }

  .quantity-input-wrapper {
    min-width: 80px;
    padding: 4px 10px;
  }

  .quantity-input {
    width: 50px;
    font-size: 14px;
  }

  .actions {
    gap: 6px;
  }

  .edit-btn,
  .delete-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .modal {
    margin: 20px;
    max-height: 85vh;
  }

  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .panel {
    margin: 18px 18px 100px 18px;
    padding: 24px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 28px;
  }

  .panel-illustration {
    width: 72px;
    height: 72px;
  }

  .stats {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
    border-radius: 18px;
  }

  .table {
    padding: 12px;
    border-radius: 18px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 140px;
    gap: 14px;
    padding: 14px 12px;
    font-size: 15px;
    min-width: 820px;
  }

  .qty-input {
    width: 65px;
    padding: 5px 8px;
    font-size: 15px;
  }

  .quantity-input-wrapper {
    min-width: 85px;
    padding: 5px 12px;
  }

  .quantity-input {
    width: 55px;
    font-size: 15px;
  }

  .actions {
    gap: 7px;
  }

  .edit-btn,
  .delete-btn {
    width: 34px;
    height: 34px;
    font-size: 17px;
  }

  .modal {
    margin: 25px;
    max-height: 80vh;
  }

  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
}

/* Quantity Modal Styles */
.quantity-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-field {
  flex: 1;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
}

.quantity-field:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.2);
}

.quantity-input-group .unit {
  font-weight: 600;
  color: #666;
  min-width: 30px;
}

.disabled-input {
  background: #f8f9fa;
  color: #666;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save {
  background: #2f8b60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  background: #247a52;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Undo Notification Styles */
.undo-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border: 2px solid #dc3545;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 350px;
  max-width: 450px;
  animation: slideIn 0.3s ease-out;
}

.undo-content {
  padding: 16px 20px;
}

.undo-message {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.undo-icon {
  font-size: 18px;
  color: #dc3545;
}

.undo-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.undo-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.undo-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

.dismiss-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dismiss-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.undo-progress {
  height: 4px;
  background: #f8f9fa;
  border-radius: 0 0 10px 10px;
  overflow: hidden;
}

.undo-progress-bar {
  height: 100%;
  background: #dc3545;
  width: 100%;
  transform-origin: left;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes countdown {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Removed PIN styles */
</style>
