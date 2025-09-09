import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFeedsStore = defineStore('feeds', () => {
  const records = ref([]) // { id, date, stage, items:[{id,label,amountKg,costPerKg}], totalCostPerKg }
  const expenses = ref([]) // { id, date, label, amount }

  function addRecord(record) {
    records.value.unshift({
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      ...record,
    })
  }

  function addExpense(entry) {
    expenses.value.unshift({
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      ...entry,
    })
  }

  const totalExpense = computed(() =>
    expenses.value.reduce((s, e) => s + (Number(e.amount) || 0), 0),
  )

  return { records, expenses, addRecord, addExpense, totalExpense }
})
