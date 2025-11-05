<template>
  <div class="screen">
    <div class="expenses-content">
      <section class="hero">
        <img src="/pig.jpg" alt="hero" />
        <div class="overlay">
          <div class="title">Track Expense</div>
        </div>
      </section>
      <div class="panel">
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
            <span v-if="feeds.netProfit > 0">+₱{{ feeds.netProfit.toFixed(2) }}</span>
            <span v-else-if="feeds.netProfit < 0"
              >-₱{{ Math.abs(feeds.netProfit).toFixed(2) }}</span
            >
            <span v-else>₱0.00</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="add-income-btn" @click="openIncomeModal">
            <span>+</span>
            Add Income
          </button>
          <button class="add-expense-btn" @click="openExpenseModal">
            <span>+</span>
            Add Expense
          </button>
        </div>

        <!-- Income Table -->
        <div class="table-section">
          <div class="table-header">
            <h3>Income</h3>
            <span class="count">{{ feeds.income.length }} entries</span>
          </div>
          <div class="table">
            <div class="row" v-for="i in feeds.income" :key="i.id">
              <span>{{ i.label }}</span>
              <span class="amt income">+₱{{ Number(i.amount).toFixed(2) }}</span>
            </div>
            <div v-if="!feeds.income.length" class="row">
              <span>No income yet</span><span class="amt">₱0.00</span>
            </div>
          </div>
        </div>

        <!-- Expense Table -->
        <div class="table-section">
          <div class="table-header">
            <h3>Expenses</h3>
            <span class="count">{{ feeds.expenses.length }} entries</span>
          </div>
          <div class="table">
            <div class="row" v-for="e in feeds.expenses" :key="e.id">
              <span>{{ e.label }}</span>
              <span class="amt expense">-₱{{ Number(e.amount).toFixed(2) }}</span>
            </div>
            <div v-if="!feeds.expenses.length" class="row">
              <span>No expenses yet</span><span class="amt">₱0.00</span>
            </div>
          </div>
        </div>
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
                placeholder="e.g., Pig Sales, Feed Sales"
                required
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
              />
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeIncomeModal">Cancel</button>
              <button type="submit" class="save-btn">Add Income</button>
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
              />
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeExpenseModal">Cancel</button>
              <button type="submit" class="save-btn">Add Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <BottomBar />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import BottomBar from '@/components/BottomBar.vue'
import { useFeedsStore } from '../stores/feeds'

const feeds = useFeedsStore()

// Modal state
const showIncomeModal = ref(false)
const showExpenseModal = ref(false)

// Form data
const incomeForm = reactive({
  label: '',
  amount: '',
})

const expenseForm = reactive({
  label: '',
  amount: '',
})

// Modal functions
function openIncomeModal() {
  showIncomeModal.value = true
  resetIncomeForm()
}

function closeIncomeModal() {
  showIncomeModal.value = false
  resetIncomeForm()
}

function openExpenseModal() {
  showExpenseModal.value = true
  resetExpenseForm()
}

function closeExpenseModal() {
  showExpenseModal.value = false
  resetExpenseForm()
}

function resetIncomeForm() {
  incomeForm.label = ''
  incomeForm.amount = ''
}

function resetExpenseForm() {
  expenseForm.label = ''
  expenseForm.amount = ''
}

function saveIncome() {
  feeds.addIncome({
    label: incomeForm.label,
    amount: Number(incomeForm.amount),
  })
  closeIncomeModal()
}

function saveExpense() {
  feeds.addExpense({
    label: expenseForm.label,
    amount: Number(expenseForm.amount),
  })
  closeExpenseModal()
}
</script>

<style scoped>
.screen {
  padding-bottom: 80px; /* Space for bottom bar */
}

.expenses-content {
  min-height: calc(100vh - 60px); /* Adjust based on your header height */
  padding-bottom: 20px;
}
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
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
.panel {
  margin: 0 16px 16px 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  flex: 1;
  overflow-y: auto;
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
  color: #c94d4d;
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
  background: linear-gradient(135deg, #2f8b60 0%, #4caf50 100%);
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
  background: #c94d4d;
  color: white;
}
.add-expense-btn:hover {
  background: #b03d3d;
  transform: translateY(-1px);
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
  margin-top: 20px;
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
</style>
