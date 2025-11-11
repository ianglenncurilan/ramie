<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Hogs Tracked</h2>
          <p class="sub">Monitor your hogs across all stages</p>
          <div class="stats" v-if="stats.totalHogs > 0">
            <span class="stat-item">Total: {{ stats.totalHogs }}</span>
            <span class="stat-item completed">Completed: {{ stats.completedToday }}</span>
            <span class="stat-item pending">Pending: {{ stats.pendingFeeding }}</span>
          </div>
        </div>
        <img class="panel-illustration" src="/pig2.png" alt="icon" />
      </div>

      <!-- Add Hog Button -->
      <div class="add-hog-section">
        <button class="add-hog-btn" @click="showAddHogModal = true">
          <span class="add-icon">+</span>
          Add New Hog
        </button>
      </div>

      <div class="table" v-if="hogs.length > 0">
        <div class="thead">
          <span>Hog Code</span>
          <span>Weight (kg)</span>
          <span>Days</span>
          <span>Feeding</span>
          <span>Actions</span>
        </div>
        <div class="row" v-for="hog in hogs" :key="hog.id">
          <span class="hog-code">{{ hog.code }}</span>
          <div class="weight-cell">
            <input
              type="number"
              v-model.number="hog.weight"
              @blur="updateHogWeight(hog.id, hog.weight)"
              @keyup.enter="updateHogWeight(hog.id, hog.weight)"
              class="weight-input"
              min="0"
              step="0.1"
            />
            <span class="unit">kg</span>
          </div>
          <span class="days">{{ hog.days }}</span>
          <div class="feeding-status">
            <span
              :class="{
                'status-completed': hog.feedingCompleted,
                'status-pending': !hog.feedingCompleted,
              }"
            >
              {{ hog.feedingCompleted ? 'Completed' : 'Pending' }}
            </span>
          </div>
          <div class="actions">
            <button
              class="action-btn complete-btn"
              @click="markFeedingComplete(hog.id)"
              :disabled="hog.feedingCompleted"
              :class="{ disabled: hog.feedingCompleted }"
              title="Mark feeding as completed"
            >
              ✓
            </button>
            <button
              class="action-btn incomplete-btn"
              @click="markFeedingIncomplete(hog.id)"
              :disabled="!hog.feedingCompleted"
              :class="{ disabled: !hog.feedingCompleted }"
              title="Mark feeding as not completed"
            >
              ✗
            </button>
            <button class="action-btn delete-btn" @click="deleteHog(hog.id)" title="Delete hog">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <img src="/pig2.png" alt="No hogs" class="empty-icon" />
        <h3>No Hogs Tracked</h3>
        <p>Add your first hog to start tracking</p>
        <button class="add-first-hog-btn" @click="showAddHogModal = true">
          Add Your First Hog
        </button>
      </div>
    </section>

    <!-- Add Hog Modal -->
    <div v-if="showAddHogModal" class="modal-overlay" @click="closeAddHogModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add New Hog</h3>
          <button class="close-btn" @click="closeAddHogModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="hogCode">Hog Code</label>
            <input
              type="text"
              id="hogCode"
              v-model="newHog.code"
              placeholder="e.g., HOG001"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="hogWeight">Initial Weight (kg)</label>
            <input
              type="number"
              id="hogWeight"
              v-model.number="newHog.weight"
              placeholder="0.0"
              min="0"
              step="0.1"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="hogDays">Initial Days</label>
            <input
              type="number"
              id="hogDays"
              v-model.number="newHog.days"
              placeholder="0"
              min="0"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddHogModal">Cancel</button>
          <button class="btn-save" @click="addNewHog">Add Hog</button>
        </div>
      </div>
    </div>

    <BottomBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityLogger } from '@/composables/useActivityLogger'
import BottomBar from './parts/BottomBar.vue'
import { useHogsStore } from '../stores/hogs'

const router = useRouter()
const hogsStore = useHogsStore()
const { logHogActivity, ActivityType } = useActivityLogger()

// Reactive data
const showAddHogModal = ref(false)
const loading = ref(true)
const error = ref(null)
const newHog = ref({
  code: '',
  weight: 0,
  days: 0,
})

// Computed properties
const hogs = computed(() => hogsStore.hogs)
const stats = computed(() => hogsStore.getStats())
const isLoading = computed(() => hogsStore.loading)

// Fetch hogs when component mounts
onMounted(async () => {
  try {
    loading.value = true
    await hogsStore.fetchHogs()
    // Initialize daily tasks after loading hogs
    hogsStore.incrementDaysForAllHogs()
  } catch (err) {
    console.error('Failed to load hogs:', err)
    error.value = 'Failed to load hogs. Please try again.'
  } finally {
    loading.value = false
  }
})

// Methods
async function addNewHog() {
  if (!newHog.value.code.trim()) {
    alert('Please enter a hog code')
    return
  }

  if (newHog.value.weight < 0) {
    alert('Weight cannot be negative')
    return
  }

  if (newHog.value.days < 0) {
    alert('Days cannot be negative')
    return
  }

  try {
    loading.value = true

    // Add the new hog to the database
    const hog = await hogsStore.addHog({
      code: newHog.value.code.trim(),
      weight: newHog.value.weight,
      days: newHog.value.days,
    })
    
    // Log the activity
    await logHogActivity(ActivityType.HOG_ADDED, hog.id, {
      code: hog.code,
      weight: hog.weight,
      days: hog.days
    })

    // Reset form and close modal
    newHog.value = { code: '', weight: 0, days: 0 }
    showAddHogModal.value = false
  } catch (err) {
    console.error('Error adding hog:', err)
    error.value = err.message || 'Failed to add hog. Please try again.'
    alert(error.value)
  } finally {
    loading.value = false
  }

  // Reset form and close modal
  newHog.value = { code: '', weight: 0, days: 0 }
  showAddHogModal.value = false
}

function closeAddHogModal() {
  showAddHogModal.value = false
  newHog.value = { code: '', weight: 0, days: 0 }
}

async function updateHogWeight(hogId, weight) {
  try {
    const oldHog = hogs.value.find(h => h.id === hogId)
    await hogsStore.updateHogWeight(hogId, parseFloat(weight) || 0)
    
    // Log the activity
    await logHogActivity(ActivityType.HOG_WEIGHT_UPDATED, hogId, {
      code: oldHog.code,
      oldWeight: oldHog.weight,
      newWeight: weight,
      difference: (parseFloat(weight) - parseFloat(oldHog.weight)).toFixed(2)
    })
  } catch (err) {
    console.error('Error updating hog weight:', err)
    error.value = 'Failed to update hog weight. Please try again.'
    alert(error.value)
  }
}

async function markFeedingComplete(hogId) {
  try {
    const hog = hogs.value.find(h => h.id === hogId)
    await hogsStore.markFeedingComplete(hogId)
    
    // Log the activity
    await logHogActivity(ActivityType.FEEDING_COMPLETED, hogId, {
      code: hog.code,
      weight: hog.weight,
      days: hog.days
    })
  } catch (err) {
    console.error('Error marking feeding as complete:', err)
    error.value = 'Failed to update feeding status. Please try again.'
    alert(error.value)
  }
}

async function markFeedingIncomplete(hogId) {
  try {
    const hog = hogs.value.find(h => h.id === hogId)
    await hogsStore.markFeedingIncomplete(hogId)
    
    // Log the activity
    await logHogActivity(ActivityType.FEEDING_INCOMPLETE, hogId, {
      code: hog.code,
      weight: hog.weight,
      days: hog.days
    })
  } catch (err) {
    console.error('Error marking feeding as incomplete:', err)
    error.value = 'Failed to update feeding status. Please try again.'
    alert(error.value)
  }
}

async function deleteHog(hogId) {
  if (confirm('Are you sure you want to delete this hog? This action cannot be undone.')) {
    try {
      const hog = hogs.value.find(h => h.id === hogId)
      
      // Log the activity before deletion
      await logHogActivity(ActivityType.HOG_DELETED, hogId, {
        code: hog.code,
        weight: hog.weight,
        days: hog.days
      })
      
      // Then delete the hog
      await hogsStore.deleteHog(hogId)
    } catch (err) {
      console.error('Error deleting hog:', err)
      error.value = 'Failed to delete hog. Please try again.'
      alert(error.value)
    }
  }
}

// This is now handled in the onMounted hook above
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
  cursor: pointer;
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
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.stat-item {
  background: #f0f8f4;
  color: #2f8b60;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.stat-item.completed {
  background: #e8f5e8;
  color: #2f8b60;
}
.stat-item.pending {
  background: #fff3cd;
  color: #856404;
}

/* Add Hog Section */
.add-hog-section {
  margin: 16px 0;
}
.add-hog-btn {
  background: #2f8b60;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}
.add-hog-btn:hover {
  background: #247a52;
}
.add-icon {
  font-size: 18px;
  font-weight: bold;
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
  grid-template-columns: 1.5fr 1fr 0.8fr 1fr 1.2fr;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
}
.thead {
  font-weight: 600;
  border-bottom: 1px solid #eee;
  color: #666;
}
.row {
  border-bottom: 1px solid #f0f0f0;
}
.row:last-child {
  border-bottom: 0;
}

/* Hog Code */
.hog-code {
  font-weight: 600;
  color: #2f8b60;
}

/* Weight Cell */
.weight-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.weight-input {
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  padding: 4px 6px;
  width: 60px;
  font-size: 12px;
  text-align: center;
}
.weight-input:focus {
  outline: none;
  border-color: #2f8b60;
}
.unit {
  font-size: 10px;
  color: #7a8b99;
}

/* Days */
.days {
  font-weight: 600;
  color: #333;
}

/* Feeding Status */
.feeding-status {
  display: flex;
  align-items: center;
}
.status-completed {
  color: #2f8b60;
  font-weight: 600;
  background: #e8f5e8;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
}
.status-pending {
  color: #c94d4d;
  font-weight: 600;
  background: #ffeaea;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
}

/* Actions */
.actions {
  display: flex;
  gap: 4px;
  align-items: center;
}
.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}
.complete-btn {
  background: #2f8b60;
  color: white;
}
.complete-btn:hover:not(.disabled) {
  background: #247a52;
  transform: scale(1.1);
}
.incomplete-btn {
  background: #c94d4d;
  color: white;
}
.incomplete-btn:hover:not(.disabled) {
  background: #b03e3e;
  transform: scale(1.1);
}
.delete-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}
.delete-btn:hover {
  background: #e9ecef;
  transform: scale(1.1);
}
.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7a8b99;
}
.empty-icon {
  width: 80px;
  height: 80px;
  opacity: 0.5;
  margin-bottom: 16px;
}
.empty-state h3 {
  margin: 0 0 8px 0;
  color: #333;
}
.empty-state p {
  margin: 0 0 20px 0;
}
.add-first-hog-btn {
  background: #2f8b60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.add-first-hog-btn:hover {
  background: #247a52;
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
}
.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
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
  color: #333;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}
.modal-body {
  padding: 0 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}
.form-input:focus {
  outline: none;
  border-color: #2f8b60;
}
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
  margin-top: 20px;
}
.btn-cancel {
  flex: 1;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-cancel:hover {
  background: #e9ecef;
}
.btn-save {
  flex: 1;
  background: #2f8b60;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
}
.btn-save:hover {
  background: #247a52;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .panel {
    margin: 12px 12px;
    padding: 12px;
  }
  .thead,
  .row {
    grid-template-columns: 1fr 0.8fr 0.6fr 1fr 1fr;
    gap: 8px;
    padding: 8px 6px;
    font-size: 12px;
  }
  .weight-input {
    width: 50px;
    font-size: 11px;
  }
  .action-btn {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  .stats {
    gap: 8px;
  }
  .stat-item {
    font-size: 10px;
    padding: 3px 6px;
  }
  .modal {
    width: 95%;
    margin: 20px;
  }
}

button {
  cursor: pointer;
}
</style>
