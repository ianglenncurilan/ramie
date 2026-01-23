<template>
  <div class="screen">
    <div class="panel">
      <div class="panel-inner">
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
          <button
            class="tab"
            :class="{ active: activeTab === 'death' }"
            @click="changeTab('death')"
          >
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

          <div class="filter-group">
            <label for="date-filter-type">Filter by:</label>
            <select id="date-filter-type" v-model="dateFilterType" @change="updateDateFilter">
              <option value="specific">Specific Date</option>
              <option value="week">This Week</option>
              <option value="week-range">Week Range</option>
              <option value="month">Month</option>
              <option value="months-ago">Last X Months</option>
            </select>
          </div>

          <!-- Specific Date -->
          <div class="filter-group" v-if="dateFilterType === 'specific'">
            <label for="specific-date">Date:</label>
            <input
              type="date"
              id="specific-date"
              v-model="specificDate"
              @change="updateDateFilter"
            />
          </div>

          <!-- Week Range -->
          <div class="filter-group" v-if="dateFilterType === 'week-range'">
            <label for="start-week">From:</label>
            <input type="week" id="start-week" v-model="startWeek" @change="updateDateFilter" />
            <label for="end-week">To:</label>
            <input
              type="week"
              id="end-week"
              v-model="endWeek"
              @change="updateDateFilter"
              :min="startWeek"
            />
          </div>

          <!-- Month Selector -->
          <div class="filter-group" v-if="dateFilterType === 'month'">
            <label for="month">Month:</label>
            <select id="month" v-model="selectedMonth" @change="updateDateFilter">
              <option v-for="month in months" :key="month.value" :value="month.value">
                {{ month.label }}
              </option>
            </select>
          </div>

          <!-- Last X Months -->
          <div class="filter-group" v-if="dateFilterType === 'months-ago'">
            <label for="months-ago">Last</label>
            <input
              type="number"
              id="months-ago"
              v-model.number="monthsAgo"
              min="1"
              max="24"
              @change="updateDateFilter"
            />
            <span>months</span>
          </div>

          <!-- Current Filter Display -->
          <div class="filter-status" v-if="currentFilterDisplay">
            {{ currentFilterDisplay }}
            <button class="clear-filter" @click="clearFilters">×</button>
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

          <!-- Date Range Picker -->
          <div class="date-range-picker">
            <div class="date-input">
              <label>From:</label>
              <input type="date" v-model="dateRange.start" @change="applyFilters" />
            </div>
            <div class="date-input">
              <label>To:</label>
              <input
                type="date"
                v-model="dateRange.end"
                @change="applyFilters"
                :min="dateRange.start"
              />
            </div>
            <button
              class="clear-date-range"
              @click="clearDateRange"
              :disabled="!dateRange.start && !dateRange.end"
            >
              Clear
            </button>
          </div>

          <!-- Total Amount -->
          <div class="total-amount" v-if="activeTab === 'sale' && filteredRecords.length > 0">
            <span>Total Sales: </span>
            <strong>₱{{ formatNumber(totalSales) }}</strong>
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
                    <span class="value">{{
                      formatDate(record.hog_details.birth_date) || 'N/A'
                    }}</span>
                  </div>
                </div>
                <div class="record-details">
                  <div class="detail">
                    <span class="label">Sale Price:</span>
                    <span class="value"
                      >₱{{
                        Number(
                          record.sale_price ?? record.details?.sale_price ?? 0,
                        ).toLocaleString()
                      }}</span
                    >
                  </div>
                  <div class="detail">
                    <span class="label">Weight at Sale:</span>
                    <span class="value"
                      >{{ record.amount ?? record.details?.weight ?? 'N/A' }} kg</span
                    >
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
                    <span class="value">{{
                      formatDate(record.hog_details.birth_date) || 'N/A'
                    }}</span>
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
            <button
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
              class="pagination-btn"
            >
              Next &raquo;
            </button>
          </div>
        </div>
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

// Date filter state (matching RecordsView)
const dateFilterType = ref('month')
const specificDate = ref('')
const startWeek = ref('')
const endWeek = ref('')
const monthsAgo = ref(1)
const currentFilterDisplay = ref('')

// Initialize dates
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = today.getMonth()

// Months array
const months = [
  { value: 0, label: 'Jan' },
  { value: 1, label: 'Feb' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Apr' },
  { value: 4, label: 'May' },
  { value: 5, label: 'Jun' },
  { value: 6, label: 'Jul' },
  { value: 7, label: 'Aug' },
  { value: 8, label: 'Sep' },
  { value: 9, label: 'Oct' },
  { value: 10, label: 'Nov' },
  { value: 11, label: 'Dec' },
]

const selectedMonth = ref(currentMonth)

// Watch for tab changes
watch(activeTab, () => {
  currentPage.value = 1
  applyFilters()
})

// Format date as YYYY-MM-DD
const formatDateInput = (date) => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Get start and end of week for a date
const getWeekRange = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const start = new Date(d.setDate(diff))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

// Helper to get week number
function getWeekNumber(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

// Update date filter based on selected type
const updateDateFilter = () => {
  const now = new Date()

  switch (dateFilterType.value) {
    case 'specific':
      if (specificDate.value) {
        const date = new Date(specificDate.value)
        currentFilterDisplay.value = `Showing records for ${date.toLocaleDateString()}`
      }
      break

    case 'week':
      const { start, end } = getWeekRange(now)
      currentFilterDisplay.value = `This week (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`
      break

    case 'week-range':
      if (startWeek.value && endWeek.value) {
        const startDate = new Date(startWeek.value)
        const endDate = new Date(endWeek.value)
        currentFilterDisplay.value = `Week range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
      }
      break

    case 'month':
      const monthName = months[selectedMonth.value].label
      currentFilterDisplay.value = `Month: ${monthName} ${currentYear}`
      break

    case 'months-ago':
      const monthsText = monthsAgo.value === 1 ? 'month' : 'months'
      currentFilterDisplay.value = `Last ${monthsAgo.value} ${monthsText}`
      break
  }

  applyFilters()
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  dateFilterType.value = 'month'
  specificDate.value = ''
  startWeek.value = ''
  endWeek.value = ''
  monthsAgo.value = 1
  selectedMonth.value = currentMonth
  currentFilterDisplay.value = ''
  sortBy.value = 'date-desc'
  currentPage.value = 1
  updateDateFilter()
}

// Check if same day
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Fetch records when component mounts
onMounted(async () => {
  try {
    await fetchRecords()
    // Set default week values
    const { start, end } = getWeekRange(today)
    const formatWeek = (date) => {
      const year = date.getFullYear()
      const weekNum = getWeekNumber(date)
      return `${year}-W${weekNum.toString().padStart(2, '0')}`
    }

    startWeek.value = formatWeek(start)
    endWeek.value = formatWeek(end)
    specificDate.value = formatDateInput(today)

    updateDateFilter()
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

  // Apply date filter based on selected type
  result = result.filter((record) => {
    const recordDate = new Date(record.event_date)
    if (!recordDate) return false

    switch (dateFilterType.value) {
      case 'specific':
        if (!specificDate.value) return true
        const selectedDate = new Date(specificDate.value)
        return isSameDay(recordDate, selectedDate)

      case 'week': {
        const { start, end } = getWeekRange(new Date())
        return recordDate >= start && recordDate <= end
      }

      case 'week-range':
        if (!startWeek.value || !endWeek.value) return true
        const startDate = new Date(startWeek.value)
        const endDate = new Date(endWeek.value)
        endDate.setDate(endDate.getDate() + 6) // End of week
        return recordDate >= startDate && recordDate <= endDate

      case 'month':
        return (
          recordDate.getMonth() === selectedMonth.value && recordDate.getFullYear() === currentYear
        )

      case 'months-ago': {
        const cutoffDate = new Date()
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo.value)
        return recordDate >= cutoffDate
      }

      default:
        return true
    }
  })

  // Apply sorting
  return sortRecords(result, sortBy.value)
})

// Calculate total sales from filtered records
const totalSales = computed(() => {
  if (activeTab.value !== 'sale') return 0

  return filteredRecords.value.reduce((total, record) => {
    const amount = record.sale_price || record.details?.sale_price || 0
    return total + Number(amount)
  }, 0)
})

// Format number with commas
const formatNumber = (num) => {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value !== '' ||
    dateFilterType.value !== 'month' ||
    (dateFilterType.value === 'month' && selectedMonth.value !== currentMonth) ||
    (dateFilterType.value === 'specific' && specificDate.value !== '') ||
    (dateFilterType.value === 'week-range' && (startWeek.value !== '' || endWeek.value !== '')) ||
    (dateFilterType.value === 'months-ago' && monthsAgo.value !== 1) ||
    dateRange.value.start !== '' ||
    dateRange.value.end !== ''
  )
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
        comparison =
          Number(a.sale_price ?? a.details?.sale_price ?? 0) -
          Number(b.sale_price ?? b.details?.sale_price ?? 0)
        break
      case 'weight':
        comparison =
          Number(a.amount ?? a.details?.weight ?? 0) - Number(b.amount ?? b.details?.weight ?? 0)
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })
}

// Apply filters and reset pagination
function applyFilters() {
  currentPage.value = 1
}

// Reset all filters (keep name for template + tab switching)
function resetFilters() {
  clearFilters()
  dateRange.value = { start: '', end: '' }
}

// Clear date range
const clearDateRange = () => {
  dateRange.value = { start: '', end: '' }
  applyFilters()
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
          (record.sale_price ?? record.details?.sale_price)
            ? `₱${Number(record.sale_price ?? record.details?.sale_price).toLocaleString()}`
            : 'N/A',
          (record.amount ?? record.details?.weight) || 'N/A',
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
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.screen {
  height: 100vh;
  background: #2f8b60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel {
  margin: 16px 16px 100px 16px;
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  max-width: 1200px;
  width: calc(100% - 32px);
  align-self: center;
}

.panel-inner {
  display: grid;
  gap: 20px;
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
  background: rgba(47, 139, 96, 0.05);
  border-radius: 8px;
  border-left: 3px solid #2f8b60;
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
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #2f8b60;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 12px;
  background: #f0f0f0;
  color: #333;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.export-btn {
  background-color: #2f8b60;
  color: white;
  padding: 0.7rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(47, 139, 96, 0.2);
}

.export-btn:hover {
  background-color: #247a52;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(47, 139, 96, 0.3);
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
  transition: all 0.2s ease;
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
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.search-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.2);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.filter-group label {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.filter-group select,
.filter-group input[type='date'],
.filter-group input[type='week'],
.filter-group input[type='number'] {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: white;
  transition: all 0.2s ease;
}

.filter-group input[type='number'] {
  width: 60px;
  text-align: center;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.2);
}

.filter-status {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: #e8f5e9;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #c8e6c9;
}

.clear-filter {
  background: none;
  border: none;
  color: #2e7d32;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.clear-filter:hover {
  opacity: 1;
  color: #1b5e20;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-options label {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.sort-options select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.sort-options select:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.2);
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  position: relative;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #2f8b60;
  border-bottom-color: #2f8b60;
}

.records-list {
  margin-top: 16px;
}

.records-summary {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background-color: #e8f5e9;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #c8e6c9;
}

.active-filters {
  font-size: 0.85rem;
  color: #666;
  font-weight: normal;
}

.record-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #2f8b60;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #2f8b60 0%, #247a52 100%);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(47, 139, 96, 0.2);
  color: white;
  position: relative;
  z-index: 1;
}

.record-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.3px;
}

.record-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.record-card:hover .record-date {
  background: rgba(255, 255, 255, 0.3);
  color: white;
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
  color: #7f8c8d;
  min-width: 140px;
  flex-shrink: 0;
  position: relative;
  padding-left: 0.5rem;
}

.label::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #2f8b60;
  font-weight: 700;
}

.value {
  color: #2c3e50;
  flex: 1;
  word-break: break-word;
  font-weight: 500;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 2rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  border: 1px dashed #e0e0e0;
  transition: all 0.2s ease;
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

/* Date Range Picker */
.date-range-picker {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.date-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.clear-date-range {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.clear-date-range:hover {
  background: #f0f0f0;
  color: #333;
}

.clear-date-range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: none;
}

/* Total Amount */
.total-amount {
  margin-left: auto;
  padding: 0.6rem 1.2rem;
  background: #e8f5e9;
  border-radius: 20px;
  font-size: 0.95rem;
  color: #2e7d32;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #c8e6c9;
}

.total-amount strong {
  font-size: 1.1em;
  color: #1b5e20;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .date-range-picker {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .date-input {
    width: 100%;
  }

  .date-input input {
    flex: 1;
  }

  .total-amount {
    margin-left: 0;
    justify-content: center;
    text-align: center;
    font-size: 13px;
  }
  
}


.header {
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.header-actions {
  width: 100%;
}

.export-btn {
  width: 100%;
  justify-content: center;
}
</style>
