<template>
  <div class="screen">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
      <div class="overlay">
        <div class="title">Olivier Ecovillage</div>
      </div>
    </section>
    <div class="panel">
      <h3>Records</h3>
      <div class="list">
        <div class="item" v-for="rec in feeds.records" :key="rec.id" @click="openRecordModal(rec)">
          <span class="dot"></span>
          <div class="item-content">
            <div class="item-title">Feed: {{ rec.stage }} — {{ rec.items.length }} ingredients</div>
            <div class="item-details">
              <span class="amount">{{
                rec.totalAmount ? rec.totalAmount.toFixed(1) + 'kg' : 'N/A'
              }}</span>
              <span class="cost">₱{{ rec.totalCost ? rec.totalCost.toFixed(2) : '0.00' }}</span>
            </div>
            <div class="ingredients">
              <span v-for="(item, idx) in rec.items.slice(0, 3)" :key="idx" class="ingredient-tag">
                {{ item.amountKg }}kg {{ item.label.split('(')[0].trim() }}
              </span>
              <span v-if="rec.items.length > 3" class="more">+{{ rec.items.length - 3 }} more</span>
            </div>
          </div>
          <span class="muted">{{ formatDateTime(rec.date) }}</span>
        </div>
        <div v-if="!feeds.records.length" class="empty">No records yet</div>
      </div>
    </div>
    <nav class="bottombar">
      <button
        @click="$router.push({ name: 'dashboard' })"
        :class="{ active: $route.name === 'dashboard' }"
      >
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button
        @click="$router.push({ name: 'records' })"
        :class="{ active: $route.name === 'records' }"
      >
        <img src="/record.png" alt="Records" />
      </button>
      <button
        @click="$router.push({ name: 'expenses' })"
        :class="{ active: $route.name === 'expenses' }"
      >
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button
        @click="$router.push({ name: 'profile' })"
        :class="{ active: $route.name === 'profile' }"
      >
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>

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
              <h4>{{ selectedRecord.stage }} Feed Formulation</h4>
              <span class="record-date">{{ formatDateTime(selectedRecord.date) }}</span>
            </div>

            <div class="record-summary">
              <div class="summary-item">
                <span class="label">Total Amount:</span>
                <span class="value">{{
                  selectedRecord.totalAmount ? selectedRecord.totalAmount.toFixed(1) + 'kg' : 'N/A'
                }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Total Cost:</span>
                <span class="value cost"
                  >₱{{
                    selectedRecord.totalCost ? selectedRecord.totalCost.toFixed(2) : '0.00'
                  }}</span
                >
              </div>
            </div>

            <div class="ingredients-section">
              <h5>Ingredients ({{ selectedRecord.items.length }})</h5>
              <div class="ingredients-list">
                <div v-for="(item, idx) in selectedRecord.items" :key="idx" class="ingredient-item">
                  <div class="ingredient-name">{{ item.label }}</div>
                  <div class="ingredient-details">
                    <span class="amount">{{ item.amountKg }}kg</span>
                    <span class="total">₱{{ (item.amountKg * item.costPerKg).toFixed(2) }}</span>
                  </div>
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
import { ref } from 'vue'
import { useFeedsStore } from '../stores/feeds'

const feeds = useFeedsStore()

function formatDateTime(dateLike) {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''
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
</script>

<style scoped>
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
.list {
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  margin-top: 12px;
  color: #333;
}
.item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 4px;
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
  gap: 6px;
}
.item-title {
  font-weight: 600;
  color: #333;
}
.item-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
.amount {
  color: #2f8b60;
  font-weight: 600;
}
.cost {
  color: #c94d4d;
  font-weight: 600;
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
  padding: 12px;
  text-align: center;
  color: #789;
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
