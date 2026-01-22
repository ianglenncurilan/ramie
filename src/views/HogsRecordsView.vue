<template>
  <div class="hogs-records">
    <div class="header">
      <div class="header-left">
        <button class="back-btn" @click="$router.go(-1)">
          <span>←</span>
        </button>
        <h2>Hog Records</h2>
      </div>
      <div class="header-actions">
        <button class="btn export-btn" @click="exportToCSV">
          <span>📊 Export to CSV</span>
        </button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'sale' }" @click="changeTab('sale')">
        Sold Hogs ({{ soldRecords.length }})
      </button>
      <button class="tab" :class="{ active: activeTab === 'death' }" @click="changeTab('death')">
        Deceased Hogs ({{ deathRecords.length }})
      </button>
    </div>

    <!-- Search and Filters -->
    <div class="filters-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="
            activeTab === 'sale' ? 'Search by hog code or buyer...' : 'Search by hog code...'
          "
          @input="applyFilters"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="date-range">
        <div class="date-input">
          <label>From:</label>
          <input type="date" v-model="dateRange.start" @change="applyFilters" />
        </div>
        <div class="date-input">
          <label>To:</label>
          <input type="date" v-model="dateRange.end" @change="applyFilters" />
        </div>
        <button class="btn clear-btn" @click="resetDateRange">Clear</button>
      </div>

      <div class="sort-options">
        <label>Sort by:</label>
        <select v-model="sortBy" @change="applySorting">
          <option value="date-desc">Date (Newest First)</option>
          <option value="date-asc">Date (Oldest First)</option>
          <option v-if="activeTab === 'sale'" value="price-desc">Price (High to Low)</option>
          <option v-if="activeTab === 'sale'" value="price-asc">Price (Low to High)</option>
          <option value="weight-desc">Weight (High to Low)</option>
          <option value="weight-asc">Weight (Low to High)</option>
        </select>
      </div>
    </div>

    <div class="records-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <div>Loading records...</div>
      </div>

      <template v-else>
        <!-- Sales Records -->
        <div v-if="activeTab === 'sale'" class="sold-records">
          <div class="records-summary">
            Showing {{ filteredRecords.length }} of {{ soldRecords.length }} records
            <span v-if="hasActiveFilters" class="active-filters"> (with active filters) </span>
          </div>
          <div v-if="filteredRecords.length === 0" class="empty-state">
            <div v-if="hasActiveFilters">
              No records match your search criteria. Try adjusting your filters.
              <button class="btn clear-filters" @click="resetFilters">Clear all filters</button>
            </div>
            <div v-else>No sold hogs records found</div>
          </div>

          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="record-card"
            :class="{ 'tracked-hog': record.is_tracked }"
          >
            <div class="record-header">
              <h4>{{ getHogName(record.hog_id) || `Hog #${record.hog_id?.slice(0, 8)}` }}</h4>
              <span class="record-date">{{ formatDate(record.event_date) }}</span>
            </div>
            <div v-if="record.hog_details" class="hog-details">
              <div class="detail">
                <span class="label">Breed:</span>
                <span class="value">{{ record.hog_details.breed || 'N/A' }}</span>
              </div>
              <div class="detail">
                <span class="label">Gender:</span>
                <span class="value">{{ record.hog_details.gender || 'N/A' }}</span>
              </div>
              <div class="detail">
                <span class="label">Birth Date:</span>
                <span class="value">{{ formatDate(record.hog_details.birth_date) || 'N/A' }}</span>
              </div>
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
          <div class="records-summary">
            Showing {{ filteredRecords.length }} of {{ deathRecords.length }} records
            <span v-if="hasActiveFilters" class="active-filters"> (with active filters) </span>
          </div>
          <div v-if="filteredRecords.length === 0" class="empty-state">
            <div v-if="hasActiveFilters">
              No records match your search criteria. Try adjusting your filters.
              <button class="btn clear-filters" @click="resetFilters">Clear all filters</button>
            </div>
            <div v-else>No deceased hogs records found</div>
          </div>

          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="record-card"
            :class="{ 'tracked-hog': record.is_tracked }"
          >
            <div class="record-header">
              <h4>
                {{
                  getHogName(record.hog_id) ||
                  (record.hog_id ? `Hog #${String(record.hog_id).slice(0, 8)}` : 'Unknown Hog')
                }}
              </h4>
              <span class="record-date">{{ formatDate(record.event_date) }}</span>
            </div>
            <div v-if="record.hog_details" class="hog-details">
              <div class="detail">
                <span class="label">Breed:</span>
                <span class="value">{{ record.hog_details.breed || 'N/A' }}</span>
              </div>
              <div class="detail">
                <span class="label">Gender:</span>
                <span class="value">{{ record.hog_details.gender || 'N/A' }}</span>
              </div>
              <div class="detail">
                <span class="label">Birth Date:</span>
                <span class="value">{{ formatDate(record.hog_details.birth_date) || 'N/A' }}</span>
              </div>
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

      <!-- Pagination -->
      <div v-if="filteredRecords.length > itemsPerPage" class="pagination">
        <button :disabled="currentPage === 1" @click="currentPage--" class="pagination-btn">
          &laquo; Previous
        </button>
        <span class="page-info"> Page {{ currentPage }} of {{ totalPages }} </span>
        <button :disabled="currentPage >= totalPages" @click="currentPage++" class="pagination-btn">
          Next &raquo;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHogsStore } from '@/stores/hogs'

const router = useRouter()
const hogsStore = useHogsStore()
const activeTab = ref('sale')
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('date-desc')
const currentPage = ref(1)
const itemsPerPage = 10

// Date range for filtering
const dateRange = ref({
  start: '',
  end: '',
})

// Watch for tab changes
watch(activeTab, () => {
  currentPage.value = 1
  applyFilters()
})

// Fetch records when component mounts
onMounted(async () => {
  try {
    await fetchRecords()
    // Set default date range to last 30 days
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    dateRange.value.end = today.toISOString().split('T')[0]
    dateRange.value.start = thirtyDaysAgo.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error initializing records view:', error)
  }
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

// Filter and sort records
const soldRecords = computed(() => {
  return [...hogsStore.records]
    .filter((record) => record.record_type === 'sale')
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
})

const deathRecords = computed(() => {
  return [...hogsStore.records]
    .filter((record) => record.record_type === 'death')
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
})

// Current records based on active tab
const currentRecords = computed(() => {
  return activeTab.value === 'sale' ? soldRecords.value : deathRecords.value
})

// Apply search and filter criteria
const filteredRecords = computed(() => {
  let result = [...currentRecords.value]

  // Apply search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((record) => {
      const hogName = getHogName(record.hog_id)?.toLowerCase() || ''
      const buyerName = (record.details?.buyer || '').toLowerCase()
      return hogName.includes(query) || buyerName.includes(query)
    })
  }

  // Apply date range filter
  if (dateRange.value.start || dateRange.value.end) {
    const startDate = dateRange.value.start ? new Date(dateRange.value.start) : null
    const endDate = dateRange.value.end ? new Date(dateRange.value.end) : null

    if (startDate || endDate) {
      result = result.filter((record) => {
        const recordDate = new Date(record.event_date)
        // Reset time part for date comparison
        const recordDateOnly = new Date(
          recordDate.getFullYear(),
          recordDate.getMonth(),
          recordDate.getDate(),
        )
        const startDateOnly = startDate
          ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          : null
        const endDateOnly = endDate
          ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1)
          : null // Add 1 day to include the end date

        return (
          (!startDateOnly || recordDateOnly >= startDateOnly) &&
          (!endDateOnly || recordDateOnly <= endDateOnly)
        )
      })
    }
  }

  // Apply sorting
  return sortRecords(result, sortBy.value)
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || dateRange.value.start !== '' || dateRange.value.end !== ''
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / itemsPerPage)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRecords.value.slice(start, end)
})

// Apply sorting to records
function sortRecords(records, sortOption) {
  const [field, direction] = sortOption.split('-')
  return [...records].sort((a, b) => {
    let comparison = 0

    switch (field) {
      case 'date':
        comparison = new Date(a.event_date) - new Date(b.event_date)
        break
      case 'price':
        comparison = (a.details?.sale_price || 0) - (b.details?.sale_price || 0)
        break
      case 'weight':
        comparison = (a.details?.weight || 0) - (b.details?.weight || 0)
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })
}

// Apply filters and reset pagination
function applyFilters() {
  currentPage.value = 1
}

// Reset all filters
function resetFilters() {
  searchQuery.value = ''
  resetDateRange()
  sortBy.value = 'date-desc'
  currentPage.value = 1
}

// Reset date range
function resetDateRange() {
  dateRange.value = { start: '', end: '' }
}

// Apply sorting
function applySorting() {
  currentPage.value = 1
}

// Change tab and reset filters
function changeTab(tab) {
  if (activeTab.value !== tab) {
    activeTab.value = tab
    resetFilters()
  }
}

// Export records to CSV
function exportToCSV() {
  try {
    const headers =
      activeTab.value === 'sale'
        ? ['Hog ID', 'Hog Name', 'Sale Date', 'Sale Price', 'Weight (kg)', 'Buyer', 'Notes']
        : ['Hog ID', 'Hog Name', 'Date of Death', 'Cause of Death', 'Weight (kg)', 'Notes']

    const data = filteredRecords.value.map((record) => {
      if (activeTab.value === 'sale') {
        return [
          record.hog_id ? String(record.hog_id).slice(0, 8) : 'N/A',
          getHogName(record.hog_id) || 'N/A',
          formatDate(record.event_date),
          record.details?.sale_price
            ? `₱${Number(record.details.sale_price).toLocaleString()}`
            : 'N/A',
          record.details?.weight || 'N/A',
          record.details?.buyer || 'N/A',
          record.details?.notes || 'N/A',
        ]
      } else {
        return [
          record.hog_id ? String(record.hog_id).slice(0, 8) : 'N/A',
          getHogName(record.hog_id) || 'N/A',
          formatDate(record.event_date),
          record.details?.cause_of_death || 'Unknown',
          record.details?.weight || 'N/A',
          record.details?.notes || 'N/A',
        ]
      }
    })

    // Add headers to the data
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        row.map((field) => `"${String(field || '').replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const today = new Date()
    const timestamp = today.toISOString().split('T')[0]
    const filename = `${activeTab.value === 'sale' ? 'sold' : 'deceased'}_hogs_${timestamp}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    alert('Failed to export records. Please try again.')
  }
}

// Format date for display
function formatDate(dateString) {
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

// Navigate to hog details view
function viewHogDetails(hogId) {
  if (!hogId) return
  router.push({ name: 'hog-details', params: { id: hogId } })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');

* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.tracked-hog {
  background-color: #e8f5e9;
  border-left: 4px solid #2e7d32;
}

.tracked-hog .record-header h4 {
  color: #2e7d32;
}

.hog-details {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border-left: 3px solid #90caf9;
}

:root {
  --primary-color: #2f8b60;
  --primary-light: #a5d6a7;
  --primary-dark: #1b5e20;
  --secondary-color: #f5f5f5;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --border-radius: 8px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --transition: all 0.3s ease;
}
.hogs-records {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
  color: var(--text-primary);
  line-height: 1.6;
}

.hero {
  position: relative;
  height: 250px;
  overflow: hidden;
  border-radius: var(--border-radius);
  margin: 1.5rem 0 2.5rem;
  box-shadow: var(--box-shadow);
  transition: var(--transition);
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
  margin: 1.5rem 0 2rem;
  padding: 0 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.export-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: var(--transition);
}

.export-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.clear-btn,
.clear-filters {
  background-color: #f5f5f5;
  color: #333;
}

.clear-btn:hover,
.clear-filters:hover {
  background-color: #e0e0e0;
}

.clear-filters {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  padding: 0.3rem 0.8rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
  padding: 0;
  margin: 0;
  color: #555;
}

.back-btn:hover {
  background-color: #e0e0e0;
  color: #333;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn span {
  font-size: 1.1em;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.filters-container {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.date-range {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.date-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input label {
  font-size: 0.9rem;
  color: #555;
}

.date-input input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-options label {
  font-size: 0.9rem;
  color: #555;
}

.sort-options select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.tabs {
  display: flex;
  margin: 2rem 0 2.5rem;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  padding: 0.8rem 2rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  position: relative;
  margin-right: 0.25rem;
}

.tab:hover {
  color: var(--primary-color);
  background: rgba(47, 139, 96, 0.05);
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 700;
}

.records-list {
  margin-top: 16px;
}

.records-summary {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background-color: #f0f7ff;
  border-radius: 4px;
  color: #1976d2;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.active-filters {
  font-size: 0.85rem;
  color: #666;
  font-weight: normal;
}

.record-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  transition: var(--transition);
  border-left: 4px solid var(--primary-color);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.record-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(47, 139, 96, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
  z-index: 0;
  transition: var(--transition);
  opacity: 0;
}

.record-card:hover::before {
  opacity: 1;
}

.record-card.clickable {
  cursor: pointer;
}

.record-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-left-color: #2f8b60;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.record-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--primary-dark);
  font-weight: 600;
  letter-spacing: 0.3px;
}

.record-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.03);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 500;
  transition: var(--transition);
}

.record-card:hover .record-date {
  background: rgba(47, 139, 96, 0.1);
  color: var(--primary-color);
}

.record-details {
  display: grid;
  gap: 10px;
}

.record-details {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.8rem;
  padding-top: 0.5rem;
}

.detail {
  display: flex;
  gap: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
  align-items: flex-start;
}

.label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 140px;
  flex-shrink: 0;
  position: relative;
  padding-left: 0.5rem;
}

.label::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary-color);
}

.value {
  color: var(--text-primary);
  flex: 1;
  word-break: break-word;
  font-weight: 500;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
  background: #f9f9f9;
  border-radius: var(--border-radius);
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  border: 1px dashed #e0e0e0;
  transition: var(--transition);
}

.empty-state:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background-color: #e0e0e0;
}

.page-info {
  margin: 0 1rem;
  font-size: 0.9rem;
  color: #555;
}

@media (max-width: 768px) {
  .filters-container {
    padding: 1rem;
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
