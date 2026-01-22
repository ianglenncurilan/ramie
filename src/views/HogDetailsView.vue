<template>
  <div class="hog-details">
    <div class="header">
      <button class="back-btn" @click="$router.go(-1)"><span>←</span> Back to Records</button>
      <h2>Hog Details</h2>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <div>Loading hog details...</div>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="hog" class="hog-card">
      <div class="hog-header">
        <h3>{{ hog.code || `Hog #${hog.id?.slice(0, 8)}` }}</h3>
        <span class="status" :class="hog.status">{{ hog.status }}</span>
      </div>

      <div class="hog-details-grid">
        <div class="detail">
          <span class="label">Weight:</span>
          <span class="value">{{ hog.weight }} kg</span>
        </div>

        <div class="detail">
          <span class="label">Age (days):</span>
          <span class="value">{{ hog.days || 'N/A' }}</span>
        </div>

        <div class="detail" v-if="hog.deceased_date">
          <span class="label">Date of Death:</span>
          <span class="value">{{ formatDate(hog.deceased_date) }}</span>
        </div>

        <div class="detail" v-if="deathRecord">
          <span class="label">Cause of Death:</span>
          <span class="value">{{ deathRecord.details?.cause_of_death || 'Unknown' }}</span>
        </div>

        <div class="detail" v-if="hog.total_feeding_days">
          <span class="label">Total Feeding Days:</span>
          <span class="value">{{ hog.total_feeding_days }}</span>
        </div>

        <div class="detail" v-if="hog.last_feeding_date">
          <span class="label">Last Feeding Date:</span>
          <span class="value">{{ formatDate(hog.last_feeding_date) }}</span>
        </div>

        <div class="detail" v-if="deathRecord?.details?.notes">
          <span class="label">Notes:</span>
          <span class="value">{{ deathRecord.details.notes }}</span>
        </div>
      </div>

      <div class="feeding-history" v-if="feedingHistory.length > 0">
        <h4>Feeding History</h4>
        <div class="feeding-list">
          <div v-for="(feed, index) in feedingHistory" :key="index" class="feeding-item">
            <span class="date">{{ formatDate(feed.date) }}</span>
            <span class="type">{{ feed.type === 'am' ? 'AM' : 'PM' }} Feeding</span>
            <span class="status" :class="{ completed: feed.completed }">
              {{ feed.completed ? 'Completed' : 'Missed' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHogsStore } from '@/stores/hogs'

const route = useRoute()
const router = useRouter()
const hogsStore = useHogsStore()

const hog = ref(null)
const deathRecord = ref(null)
const feedingHistory = ref([])
const loading = ref(true)
const error = ref(null)

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    console.error('Error formatting date:', e)
    return dateString
  }
}

// Fetch hog details
const fetchHogDetails = async () => {
  try {
    loading.value = true
    error.value = null

    // Get hog details
    const hogData = await hogsStore.getHogById(route.params.id)
    if (!hogData) {
      throw new Error('Hog not found')
    }
    hog.value = hogData

    // Get death record if available
    if (hogData.status === 'deceased') {
      const records = await hogsStore.fetchRecords()
      deathRecord.value = records.find(
        (record) => record.hog_id === route.params.id && record.record_type === 'death',
      )
    }

    // Get feeding history (you'll need to implement this in your store)
    // feedingHistory.value = await hogsStore.getFeedingHistory(route.params.id)
  } catch (err) {
    console.error('Error fetching hog details:', err)
    error.value = 'Failed to load hog details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Initialize component
onMounted(() => {
  if (route.params.id) {
    fetchHogDetails()
  } else {
    error.value = 'No hog ID provided'
    loading.value = false
  }
})
</script>

<style scoped>
.hog-details {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.back-btn:hover {
  background-color: #e0e0e0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.hog-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.hog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.hog-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status.deceased {
  background-color: #ffebee;
  color: #c62828;
}

.hog-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 500;
}

.value {
  font-size: 1rem;
  color: #2c3e50;
  word-break: break-word;
}

.feeding-history {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.feeding-history h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.feeding-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feeding-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 0.9rem;
}

.feeding-item .date {
  color: #2c3e50;
  font-weight: 500;
}

.feeding-item .type {
  color: #7f8c8d;
}

.feeding-item .status {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}

.feeding-item .status.completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.feeding-item .status:not(.completed) {
  background-color: #fff3e0;
  color: #e65100;
}

@media (max-width: 768px) {
  .hog-details-grid {
    grid-template-columns: 1fr;
  }

  .hog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .status {
    align-self: flex-start;
  }
}
</style>
