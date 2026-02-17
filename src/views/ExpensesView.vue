<template>
  <div class="screen">
    <div class="panel">
      <div class="panel-inner">
        <div class="header">
          <div class="header-left">
            <button class="back-btn" @click="$router.go(-1)">
              <span>←</span>
            </button>
            <div>
              <h2>Expenses</h2>
              <div class="summary-line">Financial Summary</div>
            </div>
          </div>
        </div>
        <!-- Export Section -->
        <div class="export-section">
          <div class="export-header">
            <h3>Export Records</h3>
            <span class="export-description">Download financial data to Excel</span>
          </div>
          <div class="export-controls">
            <select v-model="exportFilter" class="export-filter">
              <option value="weekly">Current Week</option>
              <option value="monthly">Current Month</option>
              <option value="specific-date">Specific Date</option>
              <option value="specific-week">Specific Week</option>
              <option value="date-range">Date Range</option>
            </select>

            <!-- Date inputs for specific filters -->
            <div v-if="exportFilter === 'specific-date'" class="date-input-group">
              <input
                type="date"
                v-model="specificDate"
                class="date-input"
                :max="new Date().toISOString().split('T')[0]"
              />
            </div>

            <div v-if="exportFilter === 'specific-week'" class="date-input-group">
              <input
                type="week"
                v-model="specificWeek"
                class="date-input"
                :max="getWeekString(new Date())"
              />
            </div>

            <div v-if="exportFilter === 'date-range'" class="date-range-group">
              <input
                type="date"
                v-model="dateRangeStart"
                class="date-input"
                placeholder="Start date"
                :max="dateRangeEnd || new Date().toISOString().split('T')[0]"
              />
              <span class="date-separator">to</span>
              <input
                type="date"
                v-model="dateRangeEnd"
                class="date-input"
                placeholder="End date"
                :min="dateRangeStart"
                :max="new Date().toISOString().split('T')[0]"
              />
            </div>

            <button class="export-btn" @click="exportToExcel" :disabled="loading || !canExport">
              <span v-if="loading">Exporting...</span>
              <span v-else>Export to Excel</span>
            </button>
          </div>
        </div>
        <div class="cards">
          <div class="card success">
            <div class="label">Income</div>
            <div class="value">+₱{{ feeds.totalIncome.toFixed(2) }}</div>
          </div>
          <div class="card danger">
            <div class="label">Expense</div>
            <div class="value">-₱{{ feeds.totalExpense.toFixed(2) }}</div>
          </div>
        </div>

        <!-- Net Profit/Loss Indicator -->
        <div
          class="net-profit-card"
          :class="{
            profit: feeds.netProfit > 0,
            loss: feeds.netProfit < 0,
            neutral: feeds.netProfit === 0,
          }"
        >
          <div class="net-label">Net Profit/Loss</div>
          <div class="net-value">
            <span v-if="feeds.netProfit > 0">+₱{{ feeds.netProfit.toFixed(2) }} 🟢</span>
            <span v-else-if="feeds.netProfit < 0"
              >-₱{{ Math.abs(feeds.netProfit).toFixed(2) }} 🔴</span
            >
            <span v-else>₱0.00 🟡</span>
          </div>
          <div class="net-message">{{ netStatusMessage }}</div>
        </div>

        <div class="view-sections-grid">
          <!-- Income -->
          <div class="table-section">
            <div class="table-header">
              <h3>Income</h3>
              <span class="count" v-if="feeds.income.length === 0">Income: No entries yet!</span>
              <span class="count" v-else>Income: {{ feeds.income.length }} Transactions</span>
            </div>
            <div class="view-btn-wrap">
              <button class="view-btn view-income-btn" @click="openIncomeList()">
                View Income
              </button>
            </div>
          </div>

          <!-- Expenses -->
          <div class="table-section">
            <div class="table-header">
              <h3>Expenses</h3>
              <span class="count" v-if="feeds.expenses.length === 0"
                >Expenses: No entries yet!</span
              >
              <span class="count" v-else>Expenses: {{ feeds.expenses.length }} Transactions</span>
            </div>
            <div class="view-btn-wrap">
              <button class="view-btn view-expense-btn" @click="openExpenseList()">
                View Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !error" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="close-error">×</button>
    </div>

    <!-- Income Modal -->
    <div v-if="showIncomeModal" class="modal-overlay" @click="closeIncomeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Income</h3>
          <button class="close-btn" @click="closeIncomeModal">×</button>
        </div>
        <form @submit.prevent="saveIncome" class="modal-form">
          <div class="form-group">
            <label>Income Source</label>
            <input
              v-model="incomeForm.label"
              type="text"
              placeholder="e.g., Product Sales, Services"
              required
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label>Amount (₱)</label>
            <input
              v-model="incomeForm.amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="incomeForm.date" type="date" required :disabled="loading" />
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeIncomeModal" :disabled="loading">
              Cancel
            </button>
            <button type="submit" class="save-btn" :disabled="loading">
              {{ loading ? 'Saving...' : 'Add Income' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Expense Modal -->
    <div v-if="showExpenseModal" class="modal-overlay" @click="closeExpenseModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Expense</h3>
          <button class="close-btn" @click="closeExpenseModal">×</button>
        </div>
        <form @submit.prevent="saveExpense" class="modal-form">
          <div class="form-group">
            <label>Expense Description</label>
            <input
              v-model="expenseForm.label"
              type="text"
              placeholder="e.g., Feed Purchase, Veterinary"
              required
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label>Amount (₱)</label>
            <input
              v-model="expenseForm.amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="expenseForm.date" type="date" required :disabled="loading" />
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeExpenseModal" :disabled="loading">
              Cancel
            </button>
            <button type="submit" class="save-btn" :disabled="loading">
              {{ loading ? 'Saving...' : 'Add Expense' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Income List Modal -->
    <div v-if="showIncomeListModal" class="modal-overlay" @click="closeIncomeList">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Income Records</h3>
          <button class="close-btn" @click="closeIncomeList">×</button>
        </div>
        <div class="modal-form">
          <div class="table">
            <div class="row header">
              <span>Description</span>
              <span>Date</span>
              <span class="amt">Amount</span>
            </div>
            <div class="row" v-for="income in feeds.income" :key="income.id">
              <span>{{ income.label }}</span>
              <span>{{ formatDate(income.date) }}</span>
              <span class="amt">+₱{{ Number(income.amount).toFixed(2) }}</span>
            </div>
            <div v-if="!feeds.income.length" class="row">
              <span>No income records yet</span>
            </div>
            <div class="row total" v-if="feeds.income.length">
              <span>Total Income:</span>
              <span></span>
              <span class="amt">+₱{{ feeds.totalIncome.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Expense List Modal -->
    <div v-if="showExpenseListModal" class="modal-overlay" @click="closeExpenseList">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Expense Records</h3>
          <button class="close-btn" @click="closeExpenseList">×</button>
        </div>
        <div class="modal-form">
          <div class="table">
            <div class="row header">
              <span>Description</span>
              <span>Date</span>
              <span class="amt">Amount</span>
            </div>
            <div class="row" v-for="expense in feeds.expenses" :key="expense.id">
              <span>{{ expense.label }}</span>
              <span>{{ formatDate(expense.date) }}</span>
              <span class="amt expense">-₱{{ Number(expense.amount).toFixed(2) }}</span>
            </div>
            <div v-if="!feeds.expenses.length" class="row">
              <span>No expense records yet</span>
            </div>
            <div class="row total" v-if="feeds.expenses.length">
              <span>Total Expenses:</span>
              <span></span>
              <span class="amt expense">-₱{{ feeds.totalExpense.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFeedsStore } from '../stores/feeds'
import { supabase } from '../services/supabase'

// Note: Install xlsx library with: npm install xlsx
// Then uncomment this line: import * as XLSX from 'xlsx'

const feeds = useFeedsStore()
const loading = ref(false)
const error = ref(null)
const showIncomeModal = ref(false)
const showExpenseModal = ref(false)
const showIncomeListModal = ref(false)
const showExpenseListModal = ref(false)
const exportFilter = ref('weekly')

// New filtering variables
const specificDate = ref('')
const specificWeek = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

// Computed property to validate export button
const canExport = computed(() => {
  if (exportFilter.value === 'weekly' || exportFilter.value === 'monthly') {
    return true
  }
  if (exportFilter.value === 'specific-date') {
    return specificDate.value !== ''
  }
  if (exportFilter.value === 'specific-week') {
    return specificWeek.value !== ''
  }
  if (exportFilter.value === 'date-range') {
    return dateRangeStart.value !== '' && dateRangeEnd.value !== ''
  }
  return false
})

// Helper function to get week string for input max
const getWeekString = (date) => {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

// Helper function to get ISO week number
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Form data
const incomeForm = ref({
  label: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
})

const expenseForm = ref({
  label: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
})

// Computed
const monthYearLabel = computed(() => {
  const date = new Date()
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
})

const netStatusMessage = computed(() => {
  if (feeds.netProfit > 0) return 'Your farm is profitable! 🎉'
  if (feeds.netProfit < 0) return 'Your expenses exceed your income 💸'
  return 'Your income and expenses are balanced ⚖️'
})

// Methods
const openIncomeModal = () => {
  incomeForm.value = {
    label: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  }
  showIncomeModal.value = true
}

const closeIncomeModal = () => {
  showIncomeModal.value = false
}

const openExpenseModal = () => {
  expenseForm.value = {
    label: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  }
  showExpenseModal.value = true
}

const closeExpenseModal = () => {
  showExpenseModal.value = false
}

const openIncomeList = async () => {
  try {
    loading.value = true
    await feeds.fetchExpenses() // This will load both expenses and income data
    showIncomeListModal.value = true
  } catch (err) {
    error.value = 'Failed to load income records: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const closeIncomeList = () => {
  showIncomeListModal.value = false
}

const openExpenseList = async () => {
  try {
    loading.value = true
    await feeds.fetchExpenses() // This will load both expenses and income data
    showExpenseListModal.value = true
  } catch (err) {
    error.value = 'Failed to load expense records: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const closeExpenseList = () => {
  showExpenseListModal.value = false
}

const saveIncome = async () => {
  try {
    loading.value = true
    await feeds.addIncome(incomeForm.value)
    closeIncomeModal()
  } catch (err) {
    error.value = 'Failed to save income: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const saveExpense = async () => {
  try {
    loading.value = true
    await feeds.addExpense(expenseForm.value)
    closeExpenseModal()
  } catch (err) {
    error.value = 'Failed to save expense: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

// Export to Excel functions
const getDateRange = (filter) => {
  const now = new Date()

  if (filter === 'weekly') {
    // Current week (Sunday to Saturday)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return {
      start: startOfWeek.toISOString(),
      end: endOfWeek.toISOString(),
      label: `Current Week (${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()})`,
    }
  }

  if (filter === 'monthly') {
    // Current month (1st to last day)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    return {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString(),
      label: now.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
    }
  }

  if (filter === 'specific-date') {
    // Specific date (full day)
    const date = new Date(specificDate.value + 'T00:00:00')
    const endOfDay = new Date(specificDate.value + 'T23:59:59')

    return {
      start: date.toISOString(),
      end: endOfDay.toISOString(),
      label: date.toLocaleDateString(),
    }
  }

  if (filter === 'specific-week') {
    // Specific week from week input
    const [year, week] = specificWeek.value.split('-W').map(Number)
    const startDate = getWeekDate(year, week, 1) // Monday
    const endDate = getWeekDate(year, week, 7) // Sunday

    return {
      start: new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0,
        0,
        0,
      ).toISOString(),
      end: new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
      ).toISOString(),
      label: `Week ${week} of ${year}`,
    }
  }

  if (filter === 'date-range') {
    // Custom date range
    const startDate = new Date(dateRangeStart.value + 'T00:00:00')
    const endDate = new Date(dateRangeEnd.value + 'T23:59:59')

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    }
  }

  // Default fallback
  return {
    start: new Date().toISOString(),
    end: new Date().toISOString(),
    label: 'Unknown Period',
  }
}

// Helper function to get date from week number
const getWeekDate = (year, week, day) => {
  const firstDayOfYear = new Date(year, 0, 1)
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + day
  return new Date(year, 0, 1 + daysOffset)
}

const fetchRecordsForExport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching records for export:', err)
    throw err
  }
}

const exportToExcel = async () => {
  try {
    loading.value = true
    error.value = null

    // Get date range based on filter
    const dateRange = getDateRange(exportFilter.value)
    console.log(`Exporting ${exportFilter.value} records:`, dateRange)

    // Fetch records from Supabase
    const records = await fetchRecordsForExport(dateRange.start, dateRange.end)

    if (records.length === 0) {
      error.value = `No records found for ${dateRange.label}`
      return
    }

    // Separate income and expenses
    const incomeRecords = records.filter((record) => record.type === 'income')
    const expenseRecords = records.filter((record) => record.type !== 'income')

    // Create workbook with separate sheets
    const workbook = createExcelWorkbook(incomeRecords, expenseRecords, dateRange.label)

    // Download the Excel file
    downloadExcelFile(workbook, `Financial_Report_${dateRange.label.replace(/\s+/g, '_')}.xlsx`)

    console.log(`✅ Exported ${records.length} records for ${dateRange.label}`)
  } catch (err) {
    console.error('Export error:', err)
    error.value = 'Failed to export records: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const createExcelWorkbook = (incomeRecords, expenseRecords, periodLabel) => {
  // This is a simplified version without xlsx library
  // After installing xlsx, replace this with proper Excel generation

  const workbook = {
    sheets: {
      Income: formatIncomeSheet(incomeRecords),
      Expenses: formatExpenseSheet(expenseRecords),
      Summary: formatSummarySheet(incomeRecords, expenseRecords, periodLabel),
    },
  }

  return workbook
}

const formatIncomeSheet = (records) => {
  return {
    headers: ['Date', 'Description', 'Amount'],
    data: records.map((record) => [
      new Date(record.date).toLocaleDateString(),
      record.label || 'N/A',
      Number(record.amount).toFixed(2),
    ]),
  }
}

const formatExpenseSheet = (records) => {
  return {
    headers: ['Date', 'Description', 'Amount'],
    data: records.map((record) => [
      new Date(record.date).toLocaleDateString(),
      record.label || 'N/A',
      Number(record.amount).toFixed(2),
    ]),
  }
}

const formatSummarySheet = (incomeRecords, expenseRecords, periodLabel) => {
  const totalIncome = incomeRecords.reduce((sum, record) => sum + Number(record.amount), 0)
  const totalExpenses = expenseRecords.reduce((sum, record) => sum + Number(record.amount), 0)
  const netProfit = totalIncome - totalExpenses

  return {
    headers: ['Metric', 'Amount'],
    data: [
      ['Total Income', totalIncome.toFixed(2)],
      ['Total Expenses', totalExpenses.toFixed(2)],
      ['Net Profit/Loss', netProfit.toFixed(2)],
      ['Status', netProfit >= 0 ? 'Profitable' : 'Loss'],
    ],
  }
}

const downloadExcelFile = (workbook, filename) => {
  try {
    // Try to use XLSX library if available
    if (typeof XLSX !== 'undefined') {
      // Create proper Excel workbook with multiple sheets
      const wb = XLSX.utils.book_new()

      // Add Income sheet
      const incomeWS = XLSX.utils.aoa_to_sheet([
        workbook.sheets.Income.headers,
        ...workbook.sheets.Income.data,
      ])
      XLSX.utils.book_append_sheet(wb, incomeWS, 'Income')

      // Add Expenses sheet
      const expenseWS = XLSX.utils.aoa_to_sheet([
        workbook.sheets.Expenses.headers,
        ...workbook.sheets.Expenses.data,
      ])
      XLSX.utils.book_append_sheet(wb, expenseWS, 'Expenses')

      // Add Summary sheet
      const summaryWS = XLSX.utils.aoa_to_sheet([
        workbook.sheets.Summary.headers,
        ...workbook.sheets.Summary.data,
      ])
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary')

      // Apply formatting to make headers bold and adjust column widths
      const formatSheet = (ws) => {
        // Make first row (headers) bold
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              font: { bold: true },
              alignment: { horizontal: 'center' },
            }
          }
        }

        // Set column widths
        ws['!cols'] = [
          { width: 20 }, // Date column (A)
          { width: 40 }, // Description column (B)
          { width: 20 }, // Amount column (C)
        ]
      }

      // Special formatting for Summary sheet (2 columns)
      const formatSummarySheet = (ws) => {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              font: { bold: true },
              alignment: { horizontal: 'center' },
            }
          }
        }

        // Set column widths for Summary (2 columns)
        ws['!cols'] = [
          { width: 25 }, // Metric column (A)
          { width: 25 }, // Amount column (B)
        ]
      }

      formatSheet(incomeWS)
      formatSheet(expenseWS)
      formatSummarySheet(summaryWS)

      // Download the Excel file
      XLSX.writeFile(wb, filename)
    } else {
      // Fallback to CSV if XLSX is not available
      console.warn('XLSX library not available, falling back to CSV')
      const csvContent = generateCSV(workbook)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', filename.replace('.xlsx', '.csv'))
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error generating Excel file:', error)
    // Fallback to CSV
    const csvContent = generateCSV(workbook)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename.replace('.xlsx', '.csv'))
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const generateCSV = (workbook) => {
  let csvContent = ''

  // Income section
  csvContent += 'INCOME RECORDS\n'
  csvContent += workbook.sheets.Income.headers.join(',') + '\n'
  workbook.sheets.Income.data.forEach((row) => {
    csvContent += row.join(',') + '\n'
  })

  csvContent += '\nEXPENSE RECORDS\n'
  csvContent += workbook.sheets.Expenses.headers.join(',') + '\n'
  workbook.sheets.Expenses.data.forEach((row) => {
    csvContent += row.join(',') + '\n'
  })

  csvContent += '\nSUMMARY\n'
  csvContent += workbook.sheets.Summary.headers.join(',') + '\n'
  workbook.sheets.Summary.data.forEach((row) => {
    csvContent += row.join(',') + '\n'
  })

  return csvContent
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style scoped>
/* Export Section Styles */
.export-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.export-header {
  margin-bottom: 16px;
}

.export-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.export-description {
  font-size: 13px;
  color: #666;
  display: block;
}

.export-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  color: #333;
  transition: border-color 0.2s ease;
  min-width: 140px;
}

.date-input:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 3px rgba(47, 139, 96, 0.1);
}

.date-separator {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.export-filter {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.export-filter:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 3px rgba(47, 139, 96, 0.1);
}

.export-btn {
  background: #2f8b60;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(47, 139, 96, 0.2);
}

.export-btn:hover:not(:disabled) {
  background: #247a52;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(47, 139, 96, 0.3);
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Existing styles... */

.save-btn {
  background-color: #4caf50;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #43a047;
}

.save-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.screen {
  height: 100vh;
  background: #f4f4f4;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel {
  margin: 16px auto 100px auto;
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 90px);
  min-height: 1060px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  max-width: 1200px;
  width: 85%;
  align-self: center;
}

.panel-inner {
  display: grid;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.summary-line {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  background: #fff;
  color: #333;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.card.success .value {
  color: #2f8b60;
}
.card.danger .value {
  color: #c94d4d;
}
.card .label {
  font-size: 12px;
  color: #789;
  margin-bottom: 8px;
}
.card .value {
  font-weight: 700;
  font-size: 18px;
}
.table {
  background: #fff;
  border-radius: 12px;
  margin-top: 12px;
  color: #333; /* Ensure labels are visible on white background */
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}
.row:last-child {
  border-bottom: 0;
}
.amt {
  color: #2f8b60;
}
.amt.income {
  color: #2f8b60;
  font-weight: 600;
}
.amt.expense {
  color: #4dc96a;
  font-weight: 600;
}

/* Net Profit/Loss Card */
.net-profit-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  text-align: center;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}
.net-profit-card.profit {
  border-color: #2f8b60;
  background: #f0f8f4;
}
.net-profit-card.loss {
  border-color: #c94d4d;
  background: #fdf2f2;
}
.net-profit-card.neutral {
  border-color: #666;
  background: #f8f9fa;
}
.net-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.net-value {
  font-weight: 700;
  font-size: 20px;
}
.net-message {
  margin-top: 6px;
  font-size: 12px;
  color: #333;
}
.net-profit-card.profit .net-value {
  color: #2f8b60;
}
.net-profit-card.loss .net-value {
  color: #c94d4d;
}
.net-profit-card.neutral .net-value {
  color: #666;
}

/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
  margin-bottom: 24px;
}

.add-income-btn,
.add-expense-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.add-income-btn {
  background: #0bac61;
  color: white;
  box-shadow: 0 4px 12px rgba(47, 139, 96, 0.3);
  border: 2px solid #2f8b60;
  font-weight: 700;
  font-size: 16px;
}
.add-income-btn:hover {
  background: linear-gradient(135deg, #247a52 0%, #45a049 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(47, 139, 96, 0.4);
}
.add-income-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(47, 139, 96, 0.3);
}
.add-expense-btn {
  background: #009532;
  color: white;
}
.add-expense-btn:hover {
  filter: brightness(0.95);
}
.add-income-btn span {
  font-size: 20px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

.add-expense-btn span {
  font-size: 18px;
  font-weight: bold;
}

/* Table Sections */
.table-section {
  margin-top: 24px;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2f8b60;
}
.count {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 6px;
}

.view-btn-wrap {
  margin-top: 12px;
}
.view-btn {
  width: 100%;
  padding: 20px 18px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
}
.view-income-btn {
  background: #0bac61;
  color: #fff;
}
.view-expense-btn {
  background: #009532;
  color: #fff;
}
.view-btn:hover {
  filter: brightness(0.95);
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
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}

.modal .table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.modal .row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.modal .row.header {
  font-weight: 600;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.modal .row.total {
  font-weight: 600;
  background-color: #f8f9fa;
  border-top: 2px solid #dee2e6;
}

.modal .amt {
  text-align: right;
  font-weight: 500;
}

.modal .amt.expense {
  color: #db0000;
}

.modal .close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0 10px;
  line-height: 1;
}

.modal .close-btn:hover {
  color: #333;
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

/* Form Styles */
.modal-form {
  padding: 0 20px 20px 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}
.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-group input:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.1);
}

/* Form Actions */
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
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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

/* PIN Verification Styles */
/* Removed PIN styles */

/* Mobile responsiveness for action buttons */
@media (max-width: 480px) {
  .action-buttons {
    gap: 8px;
    margin-top: 12px;
  }

  .add-income-btn,
  .add-expense-btn {
    padding: 10px 12px;
    font-size: 14px;
  }

  .add-income-btn span {
    width: 24px;
    height: 24px;
    font-size: 16px;
  }

  .add-income-btn {
    box-shadow: 0 3px 8px rgba(47, 139, 96, 0.3);
  }

  .add-income-btn:hover {
    box-shadow: 0 4px 12px rgba(47, 139, 96, 0.4);
  }
}

/* View sections grid */
.view-sections-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 8px;
}
@media (min-width: 768px) {
  .view-sections-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: 16px;
  }
}
</style>
