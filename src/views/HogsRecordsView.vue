<template>
  <div class="hogs-records">
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'sold' }" @click="activeTab = 'sold'">
        Sold Hogs
      </button>
      <button class="tab" :class="{ active: activeTab === 'died' }" @click="activeTab = 'died'">
        Deceased Hogs
      </button>
    </div>

    <div class="records-list">
      <div v-if="activeTab === 'sold'" class="sold-records">
        <div v-for="record in soldRecords" :key="record.id" class="record-card">
          <div class="record-header">
            <h4>{{ record.hogName || `Hog #${record.hogId}` }}</h4>
            <span class="record-date">{{ formatDate(record.date) }}</span>
          </div>
          <div class="record-details">
            <div class="detail">
              <span class="label">Amount:</span>
              <span class="value">₱{{ record.amount.toLocaleString() }}</span>
            </div>
            <div class="detail" v-if="record.buyer">
              <span class="label">Buyer:</span>
              <span class="value">{{ record.buyer }}</span>
            </div>
            <div class="detail" v-if="record.notes">
              <span class="label">Notes:</span>
              <span class="value">{{ record.notes }}</span>
            </div>
          </div>
        </div>
        <div v-if="soldRecords.length === 0" class="empty-state">No sold hogs records found</div>
      </div>

      <div v-else class="died-records">
        <div v-for="record in diedRecords" :key="record.id" class="record-card">
          <div class="record-header">
            <h4>{{ record.hogName || `Hog #${record.hogId}` }}</h4>
            <span class="record-date">{{ formatDate(record.date) }}</span>
          </div>
          <div class="record-details">
            <div class="detail">
              <span class="label">Cause:</span>
              <span class="value">{{ record.cause || 'Unknown' }}</span>
            </div>
            <div class="detail" v-if="record.notes">
              <span class="label">Notes:</span>
              <span class="value">{{ record.notes }}</span>
            </div>
          </div>
        </div>
        <div v-if="diedRecords.length === 0" class="empty-state">
          No deceased hogs records found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('sold')

// Sample data - replace with actual data fetching from your store/API
const soldRecords = ref([
  {
    id: 1,
    hogId: 'H001',
    hogName: 'Duroc Boar #1',
    date: '2023-12-15',
    amount: 25000,
    buyer: 'Juan Dela Cruz',
    notes: 'Sold at 95kg',
  },
  {
    id: 2,
    hogId: 'H012',
    hogName: 'Large White #5',
    date: '2024-01-10',
    amount: 28000,
    buyer: 'Maria Santos',
    notes: 'Sold at 102kg',
  },
])

const diedRecords = ref([
  {
    id: 1,
    hogId: 'H045',
    hogName: 'Landrace Sow #3',
    date: '2023-11-20',
    cause: 'Disease',
    notes: 'Showed signs of illness for 3 days',
  },
  {
    id: 2,
    hogId: 'H067',
    hogName: 'Pietrain #8',
    date: '2023-12-05',
    cause: 'Injury',
    notes: 'Leg injury from pen accident',
  },
])

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style scoped>
.hogs-records {
  padding: 20px;
  max-width: 100%;
  background-color: #fff;
  min-height: 100vh;
}

.tabs {
  display: flex;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  text-transform: uppercase;
}

.tab:hover {
  background-color: #e9ecef;
  color: #495057;
}

.tab.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background-color: #fff;
  font-weight: 600;
}

.records-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.record-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
  transition: box-shadow 0.2s ease;
}

.record-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.record-header h4 {
  margin: 0;
  font-size: 15px;
  color: #212529;
  font-weight: 600;
}

.record-date {
  font-size: 13px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 400;
}

.record-details {
  display: grid;
  gap: 10px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  padding: 4px 0;
}

.label {
  color: #6c757d;
  font-weight: 400;
}

.value {
  color: #212529;
  font-weight: 500;
  text-align: right;
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
