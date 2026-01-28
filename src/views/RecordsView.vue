<template>
  <div class="screen">
    <!-- Selection Modal -->
    <div
      v-if="showSelectionModal"
      class="selection-modal-overlay"
      @click="showSelectionModal = true"
    >
      <div class="selection-modal" @click.stop>
        <div class="selection-modal-header">
          <h3>Select Record Type</h3>
          <p>Choose the type of records you want to view</p>
        </div>
        <div class="selection-options">
          <div class="option-card" @click="navigateTo('feeds')">
            <div class="option-icon">
              <img src="/feed-icon.png" alt="Feeds" />
            </div>
            <h4>Feeds Records</h4>
            <p>View and manage feed production and usage records</p>
          </div>
          <div class="option-card" @click="navigateTo('hogs')">
            <div class="option-icon">
              <img src="/piggg.png" alt="Hogs" />
            </div>
            <h4>Hogs Records</h4>
            <p>View and manage hog sales and mortality records</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content (initially hidden until selection) -->
  <div v-if="!showSelectionModal" class="records-container">
    <div class="panel">
      <div class="panel-inner">
        <div class="header-container">
          <div class="header">
            <div class="header-left">
              <button class="back-btn" @click="$router.back()">
                <span>←</span>
              </button>
              <div class="header-titles">
                <h2>Feed Records</h2>
                <p class="page-description">Track and manage feed production and usage records</p>
              </div>
            </div>
          </div>

          <div class="filters-container">
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
          </div>

          <div class="scrollable-content">
            <div class="groups">
              <div v-for="group in groupedRecords" :key="group.key" class="group">
                <div class="group-title">{{ group.label }}</div>
                <div class="records-card">
                  <div
                    v-for="rec in group.items"
                    :key="rec.id || rec.date"
                    class="record-row"
                    @click="openRecordModal(rec)"
                  >
                    <div class="icon-box">
                      <img src="/doc.png" alt="record" />
                    </div>
                    <div class="row-content">
                      <div class="row-title">{{ typeLabel(rec) || 'Feed' }}</div>
                    </div>
                  </div>
                  <div v-if="group.items.length === 0" class="empty">No records</div>
                </div>
              </div>
              <div v-if="groupedRecords.length === 0" class="empty">
                No records yet! To add new records, navigate to Home and use the task menus (e.g.,
                Make Feeds, Hogs Tracked).
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Record Detail Modal -->
      <div v-if="showRecordModal" class="modal-overlay" @click="closeRecordModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Record Details</h3>
            <button class="close-btn" @click="closeRecordModal">×</button>
          </div>
          <div class="modal-content" v-if="selectedRecord">
            <div class="record-info">
              <div class="record-header">
                <h4>
                  {{
                    getStage(selectedRecord)
                      ? getStage(selectedRecord) + ' Feed'
                      : 'Feed Formulation'
                  }}
                </h4>
                <div class="record-meta">
                  <span class="record-date">{{ formatDateTime(recordDate(selectedRecord)) }}</span>
                </div>
              </div>

              <div class="record-summary">
                <div class="summary-item">
                  <span class="label">Total Cost:</span>
                  <span class="value cost">₱{{ (selectedRecord.totalCost || 0).toFixed(2) }}</span>
                </div>
                <div class="summary-item" v-if="typeLabel(selectedRecord)">
                  <span class="label">Feed Type:</span>
                  <span class="value">{{ typeLabel(selectedRecord) }}</span>
                </div>
                <div class="summary-item" v-if="selectedRecord.creatorName">
                  <span class="label">Created by:</span>
                  <span class="value">{{ selectedRecord.creatorName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeMount } from 'vue'
import { useFeedsStore } from '../stores/feeds'

// Date filter state
const dateFilterType = ref('month')
const specificDate = ref('')
const startWeek = ref('')
const endWeek = ref('')
const monthsAgo = ref(1)
const currentFilterDisplay = ref('')

// Initialize dates
const today = new Date()
const currentYear = today.getFullYear()

// Format date as YYYY-MM-DD
const formatDate = (date) => {
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

    case 'months-ago':
      const monthsText = monthsAgo.value === 1 ? 'month' : 'months'
      currentFilterDisplay.value = `Last ${monthsAgo.value} ${monthsText}`
      break
  }

  // Note: No need to manually trigger filtered recomputation
  // Computed properties automatically recompute when dependencies change
}

// Clear all filters
const clearFilters = () => {
  dateFilterType.value = 'month'
  specificDate.value = ''
  startWeek.value = ''
  endWeek.value = ''
  monthsAgo.value = 1
  currentFilterDisplay.value = ''
  updateDateFilter()
}

// Initialize filters
onMounted(() => {
  // Set default week values
  const { start, end } = getWeekRange(today)
  const formatWeek = (date) => {
    const year = date.getFullYear()
    const weekNum = getWeekNumber(date)
    return `${year}-W${weekNum.toString().padStart(2, '0')}`
  }

  startWeek.value = formatWeek(start)
  endWeek.value = formatWeek(end)
  specificDate.value = formatDate(today)

  updateDateFilter()
})

// Helper to get week number
function getWeekNumber(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}
import { useRouter } from 'vue-router'

const feeds = useFeedsStore()
const router = useRouter()

// Control the selection modal
const showSelectionModal = ref(true)

// Navigate based on selection
const navigateTo = (type) => {
  if (type === 'hogs') {
    router.push('/hogs-records')
  } else {
    // For feeds, just hide the modal and show the existing records view
    showSelectionModal.value = false
  }
}

// Check if coming back from hogs records
onBeforeMount(() => {
  const route = window.location.pathname
  if (route.includes('hogs-records')) {
    showSelectionModal.value = true
    // Remove hogs-records from URL
    window.history.replaceState({}, document.title, '/records')
  }
})

// Period toggle and month navigation
const selectedPeriod = ref('Month')
const exportStatus = ref('')
const now = new Date()
const monthTrack = ref(null)
const wheelLock = ref(false)

function scrollSelectedIntoView() {
  try {
    // Function kept for compatibility but no longer used without months
  } catch {}
}

onMounted(() => {
  // Defer to allow rendering
  setTimeout(scrollSelectedIntoView, 0)
})

// Helpers
function toDate(dLike) {
  const d = new Date(dLike)
  return isNaN(d.getTime()) ? new Date() : d
}
function recordDate(rec) {
  return rec?.created_at || rec?.date
}
function dateOf(rec) {
  return toDate(recordDate(rec))
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function labelForDay(d) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, yesterday))
    return `Yesterday, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

// Filter records based on selected date filter
const filtered = computed(() => {
  const recs = Array.isArray(feeds.records) ? feeds.records : []
  if (recs.length === 0) return []

  return recs.filter((record) => {
    const recordDate = dateOf(record)
    if (!recordDate) return false

    const recordTime = recordDate.getTime()

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

      case 'months-ago': {
        const cutoffDate = new Date()
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo.value)
        return recordDate >= cutoffDate
      }

      default:
        return true
    }
  })
})

const groupedRecords = computed(() => {
  const map = new Map()
  const sorted = [...filtered.value].sort((a, b) => dateOf(b) - dateOf(a))
  for (const r of sorted) {
    const d = dateOf(r)
    const key = d.toDateString()
    if (!map.has(key)) {
      map.set(key, { key, date: d, label: labelForDay(d), items: [] })
    }
    map.get(key).items.push(r)
  }
  return Array.from(map.values()).sort((a, b) => b.date - a.date)
})

// Months that have any data at all (across the whole year in view)
const monthsWithData = computed(() => {
  const set = new Set()
  const recs = Array.isArray(feeds.records) ? feeds.records : []
  for (const r of recs) {
    const m = dateOf(r).getMonth()
    set.add(m)
  }
  return set
})

const totalMonthsWithData = computed(() => monthsWithData.value.size)

function formatDateTime(dateLike) {
  if (!dateLike) return ''
  const raw = String(dateLike)
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''
  const hasTime = raw.includes('T') || /\d{2}:\d{2}/.test(raw)
  if (!hasTime) {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  }
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Modal state
const showRecordModal = ref(false)
const selectedRecord = ref(null)

// Modal functions
function openRecordModal(record) {
  selectedRecord.value = record
  showRecordModal.value = true
}

function closeRecordModal() {
  showRecordModal.value = false
  selectedRecord.value = null
}

function getStage(rec) {
  if (!rec) return ''
  let stage = rec.stage || ''
  if (!stage && typeof rec.type === 'string' && rec.type.startsWith('feed-')) {
    stage = rec.type.replace('feed-', '')
  }
  return stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : ''
}

function typeLabel(rec) {
  if (!rec) return ''
  const stage = getStage(rec)
  if (stage) return `${stage} Feed`
  return typeof rec.type === 'string' ? rec.type : ''
}

async function exportMonth() {
  try {
    const year = now.getFullYear()
    const data = filtered.value.map((r) => {
      const d = r.created_at ? new Date(r.created_at) : new Date(r.date)
      return {
        Date: d.toLocaleDateString(),
        Time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Type: typeLabel(r) || 'Feed',
        Stage: getStage(r) || '',
        'Total Cost (PHP)': Number(r.totalCost || 0),
        'Created By': r.creatorName || '',
      }
    })

    const XLSX = await import('https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs')
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Records-${year}`)
    const fname = `RAMIE_Records_${year}.xlsx`
    XLSX.writeFileXLSX(wb, fname)
    exportStatus.value = '✅ Export Successful!'
    setTimeout(() => {
      exportStatus.value = ''
    }, 3000)
  } catch (e) {
    alert('Failed to export. Please try again.')
    console.error(e)
  }
}
</script>

<style scoped>
/* Filters */
.filters-container {
  display: flex;
  gap: 1rem;
  margin: 1rem 0 1.5rem 0;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 12px;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .filter-status {
    margin-left: 0;
    justify-content: center;
    text-align: center;
  }
}
/* Selection Modal Styles */
.selection-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.886);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(3px);
}

.selection-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selection-modal-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
  background: #2f8b60;
}

.selection-modal-header h3 {
  margin: 0 0 0.5rem;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
}

.selection-modal-header p {
  margin: 0;
  color: #cdd6d6;
  font-size: 0.95rem;
}

.selection-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
}

.option-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.5s ease;
  border: 1px solid #c7c7c8;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border-color: #dee2e6;
}

.option-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.option-icon img {
  width: 50%;
  height: 50%;
  object-fit: contain;
}

.option-card h4 {
  margin: 0 0 0.5rem;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.option-card p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .selection-options {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .selection-modal-header {
    padding: 1.5rem 1rem 1rem;
  }

  .option-card {
    padding: 1.5rem 1rem;
  }
}
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  background: #2f8b60;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.records-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.header-container {
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 24px 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
  background-clip: padding-box;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  margin-top: 0;
  height: calc(100vh - 300px); /* Adjust this value based on your header height */
  -webkit-overflow-scrolling: touch;
}

/* Ensure the panel takes full height */
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
.hero {
  position: relative;
  margin: 16px;
}
.hero img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 14px;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  color: #ffffff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
  border-radius: 14px;
}
.overlay .receipt-icon {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 100px;
  height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.overlay .title {
  font-weight: 700;
  font-size: 22px;
}
.panel {
  margin: 0 auto;
  margin-top: 10px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  max-width: 1200px;
  width: 85%;
  align-self: center;
}

.panel-inner {
  padding: 18px 24px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  display: grid;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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

.page-description {
  color: #666;
  font-size: 14px;
  margin: 0 0 1rem 0;
  font-weight: 400;
}

.summary-line {
  margin: 6px 0 8px 0;
  font-size: 12px;
  color: #666;
}

.drag-indicator {
  width: 64px;
  height: 6px;
  margin: 4px auto 8px;
  background: rgba(47, 139, 96, 0.3);
  border-radius: 999px;
}

.period-toggle {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
}

.period-toggle button {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.period-toggle button.active {
  background: #fff;
  color: #2f8b60;
}

.export-wrap {
  display: flex;
  justify-content: center;
  margin: 8px 0 12px;
}

.export-btn {
  background: #2f8b60;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(47, 139, 96, 0.2);
}

.export-btn:hover {
  background: #247a52;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(47, 139, 96, 0.3);
}

.month-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.month-track {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  gap: 10px;
  justify-content: center;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 2px 2px;
  scrollbar-width: none;
  max-width: 100%;
  margin: 0 auto;
}

.month-track::-webkit-scrollbar {
  display: none;
}

.month-track::-webkit-scrollbar-thumb {
  background: transparent;
}

.month-bar .month-chip {
  background: #f0f8f4;
  color: #2f8b60;
  border: 1px solid #e0e0e0;
  padding: 8px 14px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  scroll-snap-align: center;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.month-bar .month-chip:hover {
  background: #e8f5e9;
  transform: translateY(-1px);
}

.month-bar .month-chip.active {
  background: #2f8b60;
  color: #fff;
  border: 2px solid #2f8b60;
  box-shadow: 0 2px 8px rgba(47, 139, 96, 0.25);
}

.month-bar .month-chip.disabled {
  background: #f5f5f5;
  color: #999;
  filter: grayscale(40%);
  cursor: not-allowed;
}

.month-bar .arrow {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-title {
  color: #2f8b60;
  font-weight: 700;
  margin: 8px 2px;
  font-size: 16px;
}

.records-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  width: 100%;
  border: 1px solid #e2e8f0;
}

.record-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 4px;
}

.record-row:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.record-row:last-child {
  border-bottom: 0;
}
.icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #e6eef2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-box img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: grayscale(30%);
}
.row-title {
  font-weight: 600;
}
.list {
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  margin-top: 12px;
  color: #333;
}
.item {
  display: grid;
  grid-template-columns: auto 2fr 1fr auto;
  gap: 16px;
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 6px;
  align-items: center;
}
.item:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.item:last-child {
  border-bottom: 0;
}
.item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0; /* Prevents flex item from overflowing */
}
.item-title {
  font-weight: 600;
  color: #333;
}
.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  color: #666;
}
.amount {
  color: #2f8b60;
  font-weight: 600;
}
.cost {
  color: #c94d4d;
  font-weight: 600;
  white-space: nowrap;
}
.rate {
  color: #666;
}
.ingredients {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ingredient-tag {
  background: #f0f8f4;
  color: #2f8b60;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}
.more {
  color: #999;
  font-size: 10px;
  font-style: italic;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2f8b60;
  margin-top: 5px;
}
.muted {
  color: #789;
}
.empty {
  padding: 20px;
  text-align: center;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 12px 0;
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

/* Modal Styles */
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
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: #e0e0e0;
}

.modal-content {
  padding: 0 20px 20px 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* Record Info Styles */
.record-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.record-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.record-header h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #2f8b60;
}

.record-date {
  color: #666;
  font-size: 14px;
}

.record-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.summary-item .label {
  font-weight: 600;
  color: #333;
}

.summary-item .value {
  font-weight: 700;
  color: #2f8b60;
}

.summary-item .value.cost {
  color: #c94d4d;
  font-size: 18px;
}

.ingredients-section h5 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.ingredient-item:hover {
  border-color: #2f8b60;
  box-shadow: 0 2px 4px rgba(47, 139, 96, 0.1);
}

.ingredient-name {
  font-weight: 600;
  color: #333;
  flex: 1;
}

.ingredient-details {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ingredient-details .amount {
  color: #2f8b60;
  font-weight: 600;
  font-size: 14px;
}

.ingredient-details .cost {
  color: #666;
  font-size: 12px;
}

.ingredient-details .total {
  color: #c94d4d;
  font-weight: 700;
  font-size: 14px;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .modal {
    max-height: 90vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 16px 16px 0 16px;
  }

  .modal-content {
    padding: 0 16px 16px 16px;
  }

  .record-summary {
    padding: 12px;
  }

  .ingredient-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .ingredient-details {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
