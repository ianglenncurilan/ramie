import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFeedsStore = defineStore('feeds', () => {
  const records = ref([]) // { id, date, stage, items:[{id,label,amountKg,costPerKg}], totalCostPerKg }
  const expenses = ref([]) // { id, date, label, amount }
  const income = ref([]) // { id, date, label, amount }

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

  function addIncome(entry) {
    income.value.unshift({
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      ...entry,
    })
  }

  const totalExpense = computed(() =>
    expenses.value.reduce((s, e) => s + (Number(e.amount) || 0), 0),
  )

  const totalIncome = computed(() => income.value.reduce((s, i) => s + (Number(i.amount) || 0), 0))

  const netProfit = computed(() => totalIncome.value - totalExpense.value)

  return {
    records,
    expenses,
    income,
    addRecord,
    addExpense,
    addIncome,
    totalExpense,
    totalIncome,
    netProfit,
  }
})
