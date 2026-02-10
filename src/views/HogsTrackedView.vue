<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button type="button" class="back" @click="$router.back()">←</button>
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

      <div class="add-hog-section">
        <button type="button" class="add-hog-btn" @click="showAddHogModal = true">
          <span class="add-icon">+</span>
          Add New Hog
        </button>
      </div>

      <template v-if="hogs && hogs.length > 0">
        <div class="table-container">
          <div class="table">
            <div class="thead">
              <span class="hog-code">Hog Code</span>
              <span class="stage">Stage</span>
              <span class="days">Days</span>
              <span class="feeding-header">Feeding</span>
              <span class="status-header">Status</span>
              <span class="weight-cell">Weight (kg)</span>
              <span class="actions">Actions</span>
            </div>
            <div class="row" v-for="hog in hogs" :key="hog.id">
              <span class="hog-code">{{ hog.code }}</span>
              <span class="stage">{{ getHogStage(hog.days) }}</span>
              <span class="days">{{ hog.days }}</span>
              <div class="feeding-status-cell">
                <div class="feeding-toggle-container">
                  <div
                    class="feeding-toggle"
                    :class="{
                      fed: hog.amFeeding,
                      disabled: hog.feedingCompleted || (hog.amFeeding && hog.pmFeeding),
                    }"
                    @click="!hog.feedingCompleted && toggleFeeding(hog, 'am')"
                    :title="
                      hog.amFeeding ? 'Morning feed completed' : 'Click if the morning feed is done'
                    "
                  >
                    <span class="time-label">AM</span>
                    <div class="icon-wrapper">
                      <svg v-if="hog.amFeeding" class="check-icon" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <svg v-else class="x-icon" viewBox="0 0 24 24">
                        <path
                          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="feeding-toggle-container">
                  <div
                    class="feeding-toggle"
                    :class="{
                      fed: hog.pmFeeding,
                      disabled: hog.feedingCompleted || (hog.amFeeding && hog.pmFeeding),
                    }"
                    @click="!hog.feedingCompleted && toggleFeeding(hog, 'pm')"
                    :title="
                      hog.pmFeeding
                        ? 'Afternoon feed completed'
                        : 'Click if the afternoon feed is done'
                    "
                  >
                    <span class="time-label">PM</span>
                    <div class="icon-wrapper">
                      <svg v-if="hog.pmFeeding" class="check-icon" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <svg v-else class="x-icon" viewBox="0 0 24 24">
                        <path
                          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="undo-container">
                  <button
                    class="undo-btn"
                    @click.prevent="(hog.amFeeding || hog.pmFeeding) && confirmUndo(hog, $event)"
                    :disabled="isUndoing === hog.id || !(hog.amFeeding || hog.pmFeeding)"
                    :class="{ 'is-disabled': !(hog.amFeeding || hog.pmFeeding) }"
                    :aria-label="
                      hog.amFeeding || hog.pmFeeding
                        ? 'Undo feeding for ' + hog.code
                        : 'No feeding to undo'
                    "
                    :title="
                      hog.amFeeding || hog.pmFeeding
                        ? showUndoTooltip === hog.id
                          ? 'Click again to confirm'
                          : 'Undo feeding'
                        : 'No feeding to undo'
                    "
                  >
                    <span class="undo-icon-wrapper" :class="{ loading: isUndoing === hog.id }">
                      <svg class="undo-icon" viewBox="0 0 24 24" v-if="isUndoing !== hog.id">
                        <path
                          fill="currentColor"
                          d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"
                        />
                      </svg>
                      <span class="spinner" v-else></span>
                    </span>
                  </button>
                  <div
                    class="tooltip"
                    v-if="showUndoTooltip === hog.id && (hog.amFeeding || hog.pmFeeding)"
                  >
                    Click again to confirm
                  </div>
                </div>
              </div>
              <div class="status-cell">
                <span :class="getStatusClass(hog)">
                  {{ getStatusText(hog) }}
                </span>
              </div>
              <div class="weight-cell">
                <div class="weight-content">
                  <div class="weight-value">{{ hog.weight }} kg</div>
                  <div class="weight-divider" v-if="hog.updated_at"></div>
                  <div class="weight-date" v-if="hog.updated_at">
                    as of {{ formatDate(hog.updated_at) }}
                  </div>
                </div>
                <button type="button" class="edit-btn" @click="openEditModal(hog)">✏️</button>
              </div>
              <div class="actions">
                <button
                  type="button"
                  class="action-btn sold-btn"
                  @click="openSoldModal(hog)"
                  title="Mark as sold"
                >
                  💰
                </button>
                <button
                  type="button"
                  class="action-btn died-btn"
                  @click="openDiedModal(hog)"
                  title="Mark as died"
                >
                  X
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="empty-state">
          <img src="/pig2.png" alt="No hogs" class="empty-icon" />
          <h3>{{ loading ? 'Loading...' : 'No Hogs Tracked' }}</h3>
          <p v-if="!loading">Add your first hog to start tracking</p>
          <p v-if="error" class="error-message">{{ error }}</p>
          <div v-if="!loading"></div>
        </div>
      </template>
    </section>

    <div v-if="showAddHogModal" class="modal-overlay" @click="closeAddHogModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add New Hog</h3>
          <button type="button" class="close-btn" @click="closeAddHogModal">×</button>
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
          <button type="button" class="btn-cancel" @click="closeAddHogModal">Cancel</button>
          <button type="button" class="btn-save" @click="addNewHog">Add Hog</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Update Hog Weight</h3>
          <button type="button" class="close-btn" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Current Weight: {{ currentHog?.weight }} kg</label>
            <input
              type="number"
              v-model.number="currentHog.weight"
              min="0"
              step="0.1"
              class="form-input"
              placeholder="Enter new weight"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="showEditModal = false">Cancel</button>
          <button
            type="button"
            class="btn-save"
            @click="updateHogWeight(currentHog.id, currentHog.weight)"
          >
            Update Weight
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSoldModal" class="modal-overlay" @click.self="closeSoldModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark as Sold</h3>
          <button type="button" class="close-btn" @click="closeSoldModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Price per Kilo (₱)</label>
            <input
              type="number"
              v-model.number="saleData.pricePerKilo"
              min="0"
              step="0.01"
              class="form-input"
              placeholder="Enter price per kilo"
            />
          </div>
          <div class="form-group">
            <label>Final Weight (kg)</label>
            <input
              type="number"
              v-model.number="saleData.weight"
              min="0"
              step="0.1"
              class="form-input"
              :placeholder="`Current: ${currentHog?.weight} kg`"
            />
          </div>
          <div class="form-group">
            <label>Sale Date</label>
            <input
              type="date"
              v-model="saleData.date"
              class="form-input"
              :max="new Date().toISOString().split('T')[0]"
            />
          </div>
          <div class="form-group" v-if="saleData.pricePerKilo && saleData.weight">
            <div class="calculation">
              Total: ₱{{ (saleData.pricePerKilo * saleData.weight).toFixed(2) }} ({{
                saleData.weight
              }}kg × ₱{{ saleData.pricePerKilo }}/kg)
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeSoldModal">Cancel</button>
          <button
            type="button"
            class="btn-save"
            @click="markAsSold"
            :disabled="!saleData.pricePerKilo || !saleData.weight || !saleData.date"
          >
            Mark as Sold
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDiedModal" class="modal-overlay" @click.self="closeDiedModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark as Deceased</h3>
          <button type="button" class="close-btn" @click="closeDiedModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Cause of Death</label>
            <select v-model="deathData.cause" class="form-input">
              <option value="">Select cause of death</option>
              <option value="Swine">Swine Disease</option>
              <option value="Animal Bite">Abite">Animal Bite</option>
              <option value="Diarrhea">Diarrhea</option>
              <option value="others">Others</option>
            </select>
          </div>
          <div class="form-group" v-if="deathData.cause === 'others'">
            <label>Specify Cause</label>
            <input
              type="text"
              v-model="deathData.otherCause"
              class="form-input"
              placeholder="Enter cause of death"
            />
          </div>
          <div class="form-group">
            <label>Date of Death</label>
            <input
              type="date"
              v-model="deathData.date"
              class="form-input"
              :max="new Date().toISOString().split('T')[0]"
            />
          </div>
          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea
              v-model="deathData.notes"
              class="form-input"
              rows="3"
              placeholder="Additional information about the death"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeDiedModal">Cancel</button>
          <button
            type="button"
            class="btn-save"
            @click="markAsDied"
            :disabled="
              !deathData.cause ||
              (deathData.cause === 'others' && !deathData.otherCause) ||
              !deathData.date
            "
          >
            Mark as Deceased
          </button>
        </div>
      </div>
    </div>

    <BottomBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { logStaffActivity } from '@/services/staffService'
import { useActivityLogger } from '@/composables/useActivityLogger'

import { useHogsStore } from '../stores/hogs'

const router = useRouter()
const hogsStore = useHogsStore()
const { logHogActivity, ActivityType } = useActivityLogger()

// Reactive data
const showAddHogModal = ref(false)
const showEditModal = ref(false)
const showSoldModal = ref(false)
const showDiedModal = ref(false)
const loading = ref(true)
const newHog = ref({
  code: '',
  weight: 0,
  days: 0,
  amFeeding: false,
  pmFeeding: false,
  status: 'active', // 'active', 'sold', or 'died'
})

const currentHog = ref(null)
const error = ref(null)
const saleData = ref({
  pricePerKilo: null,
  weight: null,
  buyer: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
})

const deathData = ref({
  cause: '',
  otherCause: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
})

let cleanup = null
onUnmounted(() => {
  if (typeof cleanup === 'function') cleanup()
})

// Computed properties
const hogs = computed(() => {
  const allHogs = hogsStore.hogs || []
  const filteredHogs = allHogs.filter((hog) => hog.status !== 'sold' && hog.status !== 'deceased')
  console.log('Filtered hogs for display:', filteredHogs)
  return filteredHogs
})

const stats = computed(() => {
  const stats = hogsStore.getStats()
  console.log('Current stats:', stats)
  return stats
})

const isLoading = computed(() => {
  console.log('Loading state:', hogsStore.loading)
  return hogsStore.loading
})

const prevWeightById = ref({})
const isUndoing = ref(null)
const showUndoTooltip = ref(null)
let undoTimeout = null

// Determine hog stage based on days
const getHogStage = (days) => {
  if (days < 30) return 'Starter'
  if (days < 60) return 'Grower'
  return 'Finisher'
}

const toggleFeeding = async (hog, timeOfDay) => {
  try {
    // Don't allow toggling if both feedings are already complete
    if (hog.feedingCompleted) {
      return
    }

    const newStatus = !hog[`${timeOfDay}Feeding`]

    // Update the feeding time in the store
    await hogsStore.setFeedingTime(hog.id, timeOfDay, newStatus)

    // Get the updated hog to check current status
    const updatedHog = hogsStore.hogs.find((h) => h.id === hog.id)

    if (!updatedHog) return

    // Check if both feedings are now complete
    if (updatedHog.amFeeding && updatedHog.pmFeeding) {
      // Mark as completed for the day
      await hogsStore.markFeedingComplete(hog.id)
    } else if (newStatus) {
      // If this is the first feeding being marked, set to in-progress
      await hogsStore.updateHog(hog.id, { status: 'in-progress' })
    } else if (!updatedHog.amFeeding && !updatedHog.pmFeeding) {
      // If both feedings are now unchecked, set back to pending
      await hogsStore.updateHog(hog.id, { status: 'pending' })
    }
  } catch (err) {
    console.error('Error toggling feeding status:', err)
    error.value = 'Failed to update feeding status. Please try again.'
    alert(error.value)
  }
}

// Undo feeding completion with confirmation
const confirmUndo = async (hog, event) => {
  event?.preventDefault()

  if (showUndoTooltip.value === hog.id) {
    // Second click - proceed with undo
    await performUndo(hog)
    showUndoTooltip.value = null
    return false
  } else {
    // First click - show confirmation
    showUndoTooltip.value = hog.id

    // Hide tooltip after 3 seconds if not confirmed
    if (undoTimeout) clearTimeout(undoTimeout)
    undoTimeout = setTimeout(() => {
      if (showUndoTooltip.value === hog.id) {
        showUndoTooltip.value = null
      }
    }, 3000)
    return false
  }
}

const performUndo = async (hog) => {
  try {
    isUndoing.value = hog.id

    // Get the current user for logging
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Prepare updates
    const updates = {
      feeding_completed: false,
      last_feeding_date: null,
      updated_at: new Date().toISOString(),
      // Reset both AM and PM feedings
      am_feeding: false,
      pm_feeding: false,
      status: 'pending', // Default status to pending
    }

    // Update the hog in the database
    await hogsStore.updateHog(hog.id, updates)

    // Log the undo action if user is authenticated
    if (user) {
      try {
        await logStaffActivity(user.id, 'feeding_undone', {
          hog_id: hog.id,
          hog_code: hog.code,
          action: 'feeding_undone',
          details: `Reset feedings for ${hog.code}`,
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
        // Don't fail the operation if logging fails
      }
    }

    // Refresh the hogs list to show the updated status
    await loadHogs()
    return true
  } catch (err) {
    console.error('Error undoing action:', err)
    error.value = 'Failed to undo. Please try again.'
    alert(error.value)
    return false
  } finally {
    isUndoing.value = null
  }
}

// Open edit modal with hog data
const openEditModal = (hog) => {
  currentHog.value = { ...hog }
  showEditModal.value = true
}

// Open sold modal
const openSoldModal = (hog) => {
  currentHog.value = { ...hog }
  saleData.value = {
    pricePerKilo: null,
    weight: hog.weight,
    date: new Date().toISOString().split('T')[0],
  }
  showSoldModal.value = true
}

// Close sold modal
const closeSoldModal = () => {
  showSoldModal.value = false
  saleData.value = {
    pricePerKilo: null,
    weight: null,
    date: new Date().toISOString().split('T')[0],
  }
}

// Open died modal
const openDiedModal = (hog) => {
  currentHog.value = { ...hog }
  deathData.value = {
    cause: '',
    otherCause: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  }
  showDiedModal.value = true
}

// Close died modal
const closeDiedModal = () => {
  showDiedModal.value = false
  deathData.value = {
    cause: '',
    otherCause: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  }
}

// Mark hog as sold
const markAsSold = async () => {
  if (!currentHog.value || !saleData.value.pricePerKilo || !saleData.value.weight) {
    alert('Please fill in all required fields')
    return
  }

  try {
    const totalPrice = saleData.value.pricePerKilo * saleData.value.weight
    const saleDate = saleData.value.date || new Date().toISOString()

    await hogsStore.markAsSold(currentHog.value.id, {
      price: totalPrice,
      price_per_kilo: saleData.value.pricePerKilo, // Add price per kilo
      weight: saleData.value.weight,
      buyer: saleData.value.buyer || 'Unknown Buyer',
      notes: saleData.value.notes || '',
      date: saleDate,
    })

    // Log the hog activity
    logHogActivity(ActivityType.HOG_SOLD, currentHog.value.id, {
      hog_code: currentHog.value.code,
      sale_price: totalPrice,
      weight: saleData.value.weight,
      price_per_kilo: saleData.value.pricePerKilo,
      buyer: saleData.value.buyer || '',
    })

    // Log staff activity
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await logStaffActivity(user.id, 'hog_sold', {
        hog_id: currentHog.value.id,
        hog_code: currentHog.value.code,
        sale_price: totalPrice,
        weight: saleData.value.weight,
        price_per_kilo: saleData.value.pricePerKilo,
        buyer: saleData.value.buyer || '',
      })
    }

    closeSoldModal()

    // Show success message
    alert(
      `Successfully recorded sale of hog ${currentHog.value.code} for ₱${totalPrice.toFixed(2)}`,
    )

    // Refresh the hogs list
    await loadHogs()
  } catch (error) {
    console.error('Error marking hog as sold:', error)
    alert('Failed to mark hog as sold. Please try again.')
  }
}

// Mark hog as died
const markAsDied = async () => {
  if (!currentHog.value || !deathData.value.cause) {
    alert('Please select a cause of death')
    return
  }

  try {
    const cause =
      deathData.value.cause === 'other' ? deathData.value.otherCause : deathData.value.cause

    await hogsStore.markAsDeceased(currentHog.value.id, {
      cause: cause,
      weight: currentHog.value.weight,
      notes: deathData.value.notes || '',
      dateOfDeath: deathData.value.date || new Date().toISOString(),
    })

    logHogActivity(ActivityType.HOG_DIED, currentHog.value.id, {
      hog_code: currentHog.value.code,
      cause: cause,
      notes: deathData.value.notes || '',
    })

    closeDiedModal()

    // Refresh the hogs list
    await loadHogs()
  } catch (error) {
    console.error('Error marking hog as died:', error)
    alert('Failed to mark hog as deceased. Please try again.')
  }
}

const loadHogs = async () => {
  console.log('Loading hogs...')
  try {
    loading.value = true
    error.value = null

    // Fetch ALL hogs from the store (including sold and deceased)
    console.log('Fetching all hogs from store...')
    const allHogs = await hogsStore.getAllHogs()

    if (!allHogs) {
      throw new Error('No data returned from fetchHogs')
    }

    console.log('All hogs after fetch:', allHogs)

    // Display all hogs from database
    console.log(`Found ${allHogs.length} total hogs`)

    // Only proceed if we have hogs
    if (allHogs.length > 0) {
      console.log(`Processing ${allHogs.length} hogs`)

      try {
        // Increment days for all hogs
        console.log('Incrementing days for hogs...')
        await hogsStore.incrementDaysForAllHogs()

        // Reset daily status if needed
        if (hogsStore.ensureDailyReset && typeof hogsStore.ensureDailyReset === 'function') {
          console.log('Ensuring daily reset...')
          await hogsStore.ensureDailyReset()
        } else if (
          hogsStore.resetDailyFeedingStatus &&
          typeof hogsStore.resetDailyFeedingStatus === 'function'
        ) {
          console.log('Resetting daily feeding status...')
          await hogsStore.resetDailyFeedingStatus()
        }
      } catch (updateError) {
        console.error('Error during daily updates:', updateError)
        // Don't fail the entire operation if daily updates fail
      }
    } else {
      console.log('No hogs found in the database')
      // The store will handle the empty state
    }
  } catch (err) {
    console.error('Failed to load hogs:', err)
    error.value = `Failed to load hogs: ${err.message || 'Unknown error'}`

    // The store already maintains its own error state, no need to set it here

    // If we have any cached hogs, display them
    if (hogsStore.hogs?.length > 0) {
      console.warn('Using cached hogs due to error')
    }
  } finally {
    loading.value = false
  }
}

// Initial load and setup real-time subscription
onMounted(() => {
  loadHogs()

  // Set up real-time subscription for hogs
  const unsubscribe = hogsStore.subscribeToRealtime()

  // Clean up subscription when component is unmounted
  onUnmounted(() => {
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe()
    }
  })
})

// Add event listener for visibility change to refresh data when tab becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    loadHogs()
  }
})

// Clean up event listeners and subscriptions
onUnmounted(() => {
  if (cleanup) {
    cleanup()
  }
  document.removeEventListener('visibilitychange', loadHogs)
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
    error.value = null

    // Add the new hog to the database
    const hog = await hogsStore.addHog({
      code: newHog.value.code.trim(),
      weight: Number(newHog.value.weight),
      days: Number(newHog.value.days),
    })

    if (!hog) {
      throw new Error('Failed to add hog: No data returned')
    }

    console.log('Hog added successfully:', hog)

    // Force refresh the hogs list
    await loadHogs()

    // Log the activity
    try {
      await logHogActivity(ActivityType.HOG_ADDED, hog.id, {
        code: hog.code,
        weight: hog.weight,
        days: hog.days,
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Don't fail the operation if logging fails
    }

    // Reset form and close modal
    newHog.value = { code: '', weight: 0, days: 0 }
    showAddHogModal.value = false

    // Show success message
    alert(`Hog ${hog.code} added successfully!`)
  } catch (err) {
    console.error('Error adding hog:', err)
    error.value = err.message || 'Failed to add hog. Please try again.'
    alert(error.value)
  } finally {
    loading.value = false
  }
}

function closeAddHogModal() {
  showAddHogModal.value = false
  newHog.value = { code: '', weight: 0, days: 0 }
}

function capturePrevWeight(hogId, weight) {
  prevWeightById.value[hogId] = Number(weight)
}

async function updateHogWeight(hogId, weight) {
  try {
    const hog = hogs.value.find((h) => h.id === hogId)
    if (!hog) {
      throw new Error('Hog not found')
    }

    const oldWeight = prevWeightById.value[hogId] ?? Number(hog?.weight)
    const newWeight = Number(weight)

    if (Number.isNaN(newWeight) || newWeight <= 0) {
      throw new Error('Please enter a valid weight')
    }

    if (Number(oldWeight) === Number(newWeight)) {
      showEditModal.value = false
      return
    }

    // Update the weight in the store
    await hogsStore.updateHogWeight(hogId, newWeight)

    // Log the activity
    const diff = Number((newWeight - Number(oldWeight)).toFixed(2))
    await logHogActivity({
      type: ActivityType.HOG_WEIGHT_UPDATED,
      hogId,
      details: {
        code: hog.code,
        oldWeight,
        newWeight,
        difference: diff,
      },
    })

    // Refresh the hogs list to show updated weight
    await loadHogs()

    // Close the modal
    showEditModal.value = false
  } catch (err) {
    console.error('Error updating hog weight:', err)
    error.value = err.message || 'Failed to update hog weight. Please try again.'
    alert(error.value)
  }
}

// ... rest of the functions (markFeedingComplete, etc.) remain unchanged
async function markFeedingComplete(hogId) {
  try {
    const hog = hogs.value.find((h) => h.id === hogId)
    await setFeeding(hogId, 'am', true)
    await setFeeding(hogId, 'pm', true)

    // Log the activity
    await logHogActivity(ActivityType.FEEDING_COMPLETED, hogId, {
      code: hog.code,
      weight: hog.weight,
      days: hog.days,
    })
  } catch (err) {
    console.error('Error marking feeding as complete:', err)
    error.value = 'Failed to update feeding status. Please try again.'
    alert(error.value)
  }
}

async function markFeedingIncomplete(hogId) {
  try {
    const hog = hogs.value.find((h) => h.id === hogId)
    await setFeeding(hogId, 'am', false)
    await setFeeding(hogId, 'pm', false)

    // Log the activity
    await logHogActivity(ActivityType.FEEDING_INCOMPLETE, hogId, {
      code: hog.code,
      weight: hog.weight,
      days: hog.days,
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
      const hog = hogs.value.find((h) => h.id === hogId)

      // Log the activity before deletion
      await logHogActivity(ActivityType.HOG_DELETED, hogId, {
        code: hog.code,
        weight: hog.weight,
        days: hog.days,
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

// Get status text
const getStatusText = (hog) => {
  if (hog.amFeeding && hog.pmFeeding) return 'Complete'
  if (hog.amFeeding || hog.pmFeeding) return 'IN PROGRESS'
  return 'Pending'
}

// Get status class
const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

function getStatusClass(hog) {
  if (hog.amFeeding && hog.pmFeeding) return 'status-completed'
  if (hog.amFeeding || hog.pmFeeding) return 'status-inprogress'
  return 'status-pending'
}
</script>

<style scoped>
/* ... styles remain unchanged ... */
.undo-container {
  position: relative;
  display: inline-flex;
  margin-left: 4px;
}

.undo-btn {
  background: #fff8e1;
  border: 1px solid #ffe0b2;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  color: #e65100;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.undo-btn:not(:disabled):hover {
  background: #ffe0b2;
  border-color: #ffb74d;
  transform: scale(1.1);
}

.undo-btn:not(:disabled):active {
  transform: scale(0.95);
}

.undo-btn:disabled,
.undo-btn.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #e0e0e0;
  color: #9e9e9e;
  box-shadow: none;
  transform: none !important;
}

.undo-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.undo-icon {
  width: 16px;
  height: 16px;
  color: inherit;
  transition: transform 0.2s ease;
}

/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(230, 81, 0, 0.2);
  border-radius: 50%;
  border-top-color: #e65100;
  animation: spin 0.8s linear infinite;
}

/* Tooltip */
.tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.15s ease-out;
  pointer-events: none;
}

.tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 8px;
  border-width: 4px;
  border-style: solid;
  border-color: transparent transparent #333 transparent;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin: 0 2px;
  background: white;
}

.status-yes {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.status-no {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.status-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.complete-btn {
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.completed-text {
  display: inline-block;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #4caf50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Stage indicator */
.stage {
  font-weight: 500;
  text-transform: capitalize;
}

/* Weight cell */
.weight-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-value {
  min-width: 50px;
  display: inline-block;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.7;
  transition: all 0.2s;
  padding: 2px 4px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.edit-btn:hover {
  background: #f0f0f0;
  opacity: 1;
}

.edit-btn:hover {
  opacity: 1;
}

/* Status options in modal */
.status-options {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.status-option input[type='radio'] {
  margin: 0;
}

/* Modal styles */
.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea.form-input {
  min-height: 80px;
  resize: vertical;
}

.btn-cancel,
.btn-save {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.btn-save {
  background: #4caf50;
  border: 1px solid #4caf50;
  color: white;
}

.btn-save:disabled {
  background: #a5d6a7;
  border-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save:not(:disabled):hover {
  background: #43a047;
  border-color: #43a047;
}
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
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1200px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  z-index: 100;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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

/* Table container */
.table-container {
  width: 100%;
  margin-top: 16px;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
  -webkit-overflow-scrolling: touch;
  border-radius: 8px;
  border: 1px solid #f1f3f5;
}

/* Table styles */
.table {
  min-width: 800px;
  width: 100%;
  font-size: 14px;
  background: #fff;
  margin-top: 16px;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.thead {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 14px 16px;
  font-weight: 600;
  color: #495057;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9ecef;
  border-radius: 8px 8px 0 0;
  margin: 0;
}

.thead .hog-code,
.thead .stage,
.thead .days,
.thead .feeding-header,
.thead .status-header,
.thead .weight-cell,
.thead .actions {
  font-weight: 600;
  color: #495057;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 8px;
}

.thead .hog-code {
  flex: 1;
  min-width: 120px;
  text-align: left;
}

.thead .stage {
  flex: 0.8;
  min-width: 100px;
  text-align: left;
}

.thead .days {
  flex: 0.5;
  min-width: 80px;
  text-align: left;
}

.thead .feeding-header {
  flex: 1.2;
  min-width: 140px;
  text-align: center;
}

.thead .status-header {
  flex: 0.8;
  min-width: 100px;
  text-align: center;
}

.thead .weight-cell {
  flex: 0.8;
  min-width: 100px;
  text-align: right;
  padding-right: 24px;
}

.thead .actions {
  flex: 0.6;
  min-width: 100px;
  text-align: right;
  padding-right: 8px;
}

.row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.row:hover {
  background-color: #f9f9f9;
}

.row:last-child {
  border-bottom: none;
  border-radius: 0 0 6px 6px;
}

.hog-code {
  flex: 1;
  min-width: 120px;
  padding: 0 8px;
  text-align: left;
}

.stage {
  flex: 0.8;
  min-width: 100px;
  padding: 0 8px;
  text-align: left;
}

.days {
  flex: 0.5;
  min-width: 80px;
  padding: 0 8px;
  text-align: left;
}

.feeding-status-cell {
  flex: 1.2;
  min-width: 140px;
  padding: 0 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.status-cell {
  flex: 0.8;
  min-width: 100px;
  padding: 0 8px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.weight-cell {
  flex: 0.8;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
  gap: 6px;

  .weight-content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 4px;
  }

  .weight-value {
    font-weight: 600;
    color: #2d3748;
    line-height: 1.2;
  }

  .weight-divider {
    height: 1px;
    background-color: #e2e8f0;
    width: 100%;
    margin: 2px 0;
  }

  .weight-date {
    font-size: 0.7rem;
    color: #718096;
    line-height: 1.2;
    opacity: 0.8;
  }
}

.actions {
  flex: 0.6;
  min-width: 70px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
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
.status-completed,
.status-pending {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-completed {
  color: #2f8b60;
  background: #e8f5e8;
  border: 1px solid #c8e6c9;
}

.status-inprogress {
  color: #1a56db;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  padding: 2px 12px;
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: 9999px;
}

.status-pending {
  color: #c94d4d;
  background: #fff0f0;
  border: 1px solid #ffcdd2;
}

.feeding-toggle-container {
  position: relative;
  display: inline-block;
}

.feeding-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 2px;
  position: relative;
  overflow: visible;
}

.feeding-toggle::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 100;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feeding-toggle::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent #333 transparent;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.feeding-toggle:hover::after,
.feeding-toggle:hover::before {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-4px);
}

.feeding-toggle:hover:not(.disabled) {
  background: #e8f5e9;
  border-color: #c8e6c9;
}

.feeding-toggle.fed {
  background: #e8f5e9;
  border-color: #4caf50;
}

.feeding-toggle .x-icon {
  fill: #bdbdbd;
}

.feeding-toggle.fed:hover:not(.disabled) {
  background-color: #dceddc;
}

.feeding-toggle.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.time-label {
  font-weight: 600;
  font-size: 13px;
}

.icon-wrapper {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: white;
}

.check-icon,
.x-icon {
  width: 16px;
  height: 16px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
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

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .panel {
    margin: 6px 6px;
    padding: 8px;
  }

  .panel-header {
    grid-template-columns: auto 1fr;
    gap: 10px;
  }

  .panel-illustration {
    display: none;
  }

  .title-lg {
    font-size: 18px;
  }

  .sub {
    font-size: 12px;
  }

  .stats {
    gap: 4px;
    flex-wrap: wrap;
  }

  .stat-item {
    font-size: 8px;
    padding: 2px 4px;
    border-radius: 8px;
  }

  .add-hog-btn {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .add-icon {
    font-size: 14px;
    margin-right: 4px;
  }

  .table-container {
    margin-top: 12px;
    overflow-x: auto;
    overflow-y: auto;
    max-height: calc(100vh - 320px);
    -webkit-overflow-scrolling: touch;
  }

  .table {
    min-width: 600px;
    font-size: 10px;
  }

  .thead,
  .row {
    grid-template-columns: 0.8fr 0.7fr 0.5fr 1.2fr 0.8fr 0.8fr 0.6fr;
    gap: 4px;
    padding: 4px 2px;
    font-size: 9px;
  }

  .hog-code {
    font-size: 8px;
    word-break: break-all;
  }

  .stage {
    font-size: 8px;
  }

  .days {
    font-size: 8px;
  }

  .feeding-header {
    font-size: 8px;
    text-align: center;
  }

  .status-header {
    font-size: 8px;
    text-align: center;
  }

  .weight-cell {
    font-size: 8px;
  }

  .actions {
    font-size: 8px;
  }

  .feeding-toggle-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
  }

  .feeding-toggle {
    width: 28px;
    height: 20px;
    border-radius: 4px;
  }

  .time-label {
    font-size: 6px;
  }

  .icon-wrapper {
    width: 12px;
    height: 12px;
  }

  .check-icon,
  .x-icon {
    width: 8px;
    height: 8px;
  }

  .undo-btn {
    width: 18px;
    height: 18px;
  }

  .undo-icon {
    width: 10px;
    height: 10px;
  }

  .status-cell span {
    font-size: 7px;
    padding: 1px 3px;
    border-radius: 3px;
  }

  .weight-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .weight-value {
    font-size: 8px;
  }

  .weight-date {
    font-size: 6px;
    line-height: 1;
  }

  .edit-btn {
    width: 16px;
    height: 16px;
    font-size: 8px;
    padding: 0;
  }

  .action-btn {
    width: 20px;
    height: 20px;
    font-size: 8px;
    margin: 1px;
  }

  .empty-state {
    padding: 20px;
  }

  .empty-icon {
    width: 60px;
    height: 60px;
  }

  .empty-state h3 {
    font-size: 16px;
    margin: 12px 0 8px 0;
  }

  .empty-state p {
    font-size: 12px;
  }

  .error-message {
    font-size: 11px;
  }

  .modal {
    width: 98%;
    margin: 8px;
    max-height: 90vh;
  }

  .modal-header {
    padding: 12px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .close-btn {
    font-size: 18px;
    width: 24px;
    height: 24px;
  }

  .modal-body {
    padding: 12px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 12px;
    margin-bottom: 4px;
  }

  .form-input {
    padding: 8px;
    font-size: 12px;
    border-radius: 6px;
  }

  .modal-footer {
    padding: 12px;
    gap: 8px;
  }

  .btn-cancel,
  .btn-save {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 6px;
  }

  .calculation {
    font-size: 11px;
    padding: 8px;
    border-radius: 6px;
  }

  .tooltip {
    font-size: 9px;
    padding: 2px 4px;
    margin-top: 2px;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .panel {
    margin: 10px 10px;
    padding: 12px;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 14px;
  }

  .panel-illustration {
    width: 48px;
    height: 48px;
  }

  .thead,
  .row {
    grid-template-columns: 1fr 0.8fr 0.6fr 1fr 1fr;
    gap: 7px;
    padding: 7px 5px;
    font-size: 11px;
  }

  .weight-input {
    width: 48px;
    font-size: 10px;
  }

  .action-btn {
    width: 23px;
    height: 23px;
    font-size: 10px;
  }

  .stats {
    gap: 7px;
  }

  .stat-item {
    font-size: 10px;
    padding: 3px 5px;
  }

  .modal {
    width: 94%;
    margin: 15px;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .panel {
    margin: 12px 12px;
    padding: 14px;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 16px;
  }

  .panel-illustration {
    width: 56px;
    height: 56px;
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
    width: 92%;
    margin: 20px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .panel {
    margin: 16px 16px;
    padding: 18px;
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

  .thead,
  .row {
    grid-template-columns: 1fr 0.8fr 0.6fr 1fr 1fr;
    gap: 10px;
    padding: 10px 8px;
    font-size: 13px;
  }

  .weight-input {
    width: 55px;
    font-size: 12px;
  }

  .action-btn {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }

  .stats {
    gap: 10px;
  }

  .stat-item {
    font-size: 11px;
    padding: 4px 8px;
  }

  .modal {
    width: 85%;
    margin: 30px;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .panel {
    margin: 20px 20px;
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

  .thead,
  .row {
    grid-template-columns: 1fr 0.8fr 0.6fr 1fr 1fr;
    gap: 12px;
    padding: 12px 10px;
    font-size: 14px;
  }

  .weight-input {
    width: 60px;
    font-size: 13px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .stats {
    gap: 12px;
  }

  .stat-item {
    font-size: 12px;
    padding: 5px 10px;
  }

  .modal {
    width: 80%;
    margin: 40px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .panel {
    margin: 24px 24px;
    padding: 26px;
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

  .thead,
  .row {
    grid-template-columns: 1fr 0.8fr 0.6fr 1fr 1fr;
    gap: 14px;
    padding: 14px 12px;
    font-size: 15px;
  }

  .weight-input {
    width: 65px;
    font-size: 14px;
  }

  .action-btn {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .stats {
    gap: 14px;
  }

  .stat-item {
    font-size: 13px;
    padding: 6px 12px;
  }

  .modal {
    width: 75%;
    margin: 50px;
  }
}

button {
  cursor: pointer;
}
</style>
