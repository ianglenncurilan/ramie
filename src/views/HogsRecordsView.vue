<template>
  <div class="hogs-records">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
      <div class="overlay">
        <div class="brand">
          <div class="title"></div>
        </div>
      </div>
    </section>
    <div class="header">
      <h2>Hog Records</h2>
      <button class="back-btn" @click="$router.go(-1)"><span>←</span> Back</button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'sale' }" @click="activeTab = 'sale'">
        Sold Hogs
      </button>
      <button class="tab" :class="{ active: activeTab === 'death' }" @click="activeTab = 'death'">
        Deceased Hogs
      </button>
    </div>

    <div class="records-list">
      <div v-if="loading" class="loading">Loading records...</div>

      <template v-else>
        <!-- Sales Records -->
        <div v-if="activeTab === 'sale'" class="sold-records">
          <div v-if="soldRecords.length === 0" class="empty-state">No sold hogs records found</div>

          <div v-for="record in soldRecords" :key="record.id" class="record-card">
            <div class="record-header">
              <h4>{{ getHogName(record.hog_id) || `Hog #${record.hog_id?.slice(0, 8)}` }}</h4>
              <span class="record-date">{{ formatDate(record.event_date) }}</span>
            </div>
            <div class="record-details">
              <div class="detail">
                <span class="label">Sale Price:</span>
                <span class="value"
                  >₱{{ Number(record.details?.sale_price || 0).toLocaleString() }}</span
                >
              </div>
              <div class="detail">
                <span class="label">Weight at Sale:</span>
                <span class="value">{{ record.details?.weight || 'N/A' }} kg</span>
              </div>
              <div class="detail" v-if="record.details?.buyer">
                <span class="label">Buyer:</span>
                <span class="value">{{ record.details.buyer }}</span>
              </div>
              <div class="detail" v-if="record.details?.notes">
                <span class="label">Notes:</span>
                <span class="value">{{ record.details.notes }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Death Records -->
        <div v-else class="died-records">
          <div v-if="deathRecords.length === 0" class="empty-state">
            No deceased hogs records found
          </div>

          <div v-for="record in deathRecords" :key="record.id" class="record-card">
            <div class="record-header">
              <h4>{{ getHogName(record.hog_id) || `Hog #${record.hog_id?.slice(0, 8)}` }}</h4>
              <span class="record-date">{{ formatDate(record.event_date) }}</span>
            </div>
            <div class="record-details">
              <div class="detail">
                <span class="label">Cause of Death:</span>
                <span class="value">{{ record.details?.cause_of_death || 'Unknown' }}</span>
              </div>
              <div class="detail" v-if="record.details?.weight">
                <span class="label">Weight at Death:</span>
                <span class="value">{{ record.details.weight }} kg</span>
              </div>
              <div class="detail" v-if="record.details?.notes">
                <span class="label">Notes:</span>
                <span class="value">{{ record.details.notes }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHogsStore } from '@/stores/hogs'

const router = useRouter()
const hogsStore = useHogsStore()
const activeTab = ref('sale')
const loading = ref(false)

// Fetch records when component mounts
onMounted(async () => {
  await fetchRecords()
})

// Fetch records from the store
async function fetchRecords() {
  try {
    loading.value = true
    await hogsStore.fetchRecords()
  } catch (error) {
    console.error('Error fetching records:', error)
  } finally {
    loading.value = false
  }
}

// Get hog name by ID
function getHogName(hogId) {
  const hog = hogsStore.hogs.find((h) => h.id === hogId)
  return hog?.code || null
}

// Filter records by type
const soldRecords = computed(() => {
  return hogsStore.records.filter((record) => record.record_type === 'sale')
})

const deathRecords = computed(() => {
  return hogsStore.records.filter((record) => record.record_type === 'death')
})

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  } catch (e) {
    console.error('Error formatting date:', e)
    return dateString
  }
}
</script>

<style scoped>
.hogs-records {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px 20px;
}

.hero {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 2rem;
}


.brand {
  text-align: center;
}

.brand .title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  background-color: #e0e0e0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.tab {
  padding: 8px 24px;
  border: none;
  background: transparent;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  margin-bottom: -1px;
}

.tab:hover {
  color: #333;
  border-bottom-color: #ddd;
}

.tab.active {
  color: #2f8b60;
  border-bottom: 2px solid #2f8b60;
  font-weight: 600;
}

.records-list {
  margin-top: 16px;
}

.record-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 18px 20px;
  margin-bottom: 16px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.record-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background-color: #2f8b60;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.record-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
}

.record-date {
  font-size: 13px;
  color: #7f8c8d;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.record-details {
  display: grid;
  gap: 10px;
}

.detail {
  display: flex;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.label {
  font-weight: 500;
  color: #7f8c8d;
  min-width: 120px;
}

.value {
  color: #2c3e50;
  flex: 1;
  word-break: break-word;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-size: 14px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #e9ecef;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hogs-records {
    padding: 15px;
  }

  .records-list {
    grid-template-columns: 1fr;
  }

  .tab {
    padding: 10px;
    font-size: 13px;
  }
}
</style>
