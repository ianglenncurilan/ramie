<template>
  <div class="screen">
    <div class="expenses-content">
      <section class="hero">
        <img src="/pig.jpg" alt="hero" />
        <div class="overlay">
          <img class="price-icon" src="/price.png" alt="Price" />
          <div class="brand">
            <div class="title"></div>
          </div>
        </div>
      </section>
      <div class="panel">
        <div class="summary-line">Financial Summary for {{ monthYearLabel }}</div>

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
              <button
                type="button"
                class="cancel-btn"
                @click="closeIncomeModal"
                :disabled="loading"
              >
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
              <button
                type="button"
                class="cancel-btn"
                @click="closeExpenseModal"
                :disabled="loading"
              >
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFeedsStore } from '../stores/feeds'

const feeds = useFeedsStore()
const loading = ref(false)
const error = ref(null)
const showIncomeModal = ref(false)
const showExpenseModal = ref(false)
const showIncomeListModal = ref(false)
const showExpenseListModal = ref(false)

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

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style scoped>
/* ... */

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

.expenses-content {
  min-height: calc(100vh - 60px); /* Adjust based on your header height */
  padding-bottom: 20px;
}
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  min-height: 100vh;
  background: #f5f5f5;
  overflow-y: auto; /* allow scroll */
  display: flex;
  flex-direction: column;
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
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
  border-radius: 14px;
}
.overlay .price-icon {
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
.hero-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 6px 10px 6px;
}
.farm-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 18px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
.pin {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
}
.pin.on {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.location-actions {
  display: flex;
  align-items: center;
}
.loc-btn {
  background: #0bac61;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}
.loc-text {
  font-size: 12px;
  opacity: 0.9;
}
.hero-stats {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 0 6px 8px 6px;
}
.hero-stats .stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero-stats .bubble {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 999px;
  padding: 2px 10px;
  font-weight: 700;
  margin-bottom: 4px;
}
.hero-stats .label {
  font-size: 12px;
  opacity: 0.95;
}
.panel {
  margin: 0 16px 16px 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  flex: 1;
  overflow-y: auto;
}
.summary-line {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
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
}
.card.success .value {
  color: #2f8b60;
}
.card.danger .value {
  color: #c94d4d;
}
.label {
  font-size: 12px;
  color: #789;
}
.value {
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
  color: #fff;
}
.count {
  font-size: 12px;
  color: #ccc;
  background: rgba(255, 255, 255, 0.2);
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
  color: #009532;
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
