import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

export const useFeedsStore = defineStore('feeds', () => {
  const records = ref([]) // { id, date, stage, items:[{id,label,amountKg,costPerKg}], totalCostPerKg }
  const expenses = ref([]) // { id, date, label, amount }
  const income = ref([]) // { id, date, label, amount }
  const loading = ref(false)
  const error = ref(null)

  // Fetch all expenses
  async function fetchExpenses() {
    try {
      loading.value = true
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      expenses.value = data || []
      return data
    } catch (err) {
      console.error('Error fetching expenses:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add a new expense
  async function addExpense(entry) {
    try {
      loading.value = true
      const { data, error: addError } = await supabase
        .from('expenses')
        .insert([
          {
            label: entry.label,
            amount: Number(entry.amount),
            date: entry.date || new Date().toISOString(),
            reference_id: entry.reference_id || null,
            reference_type: entry.reference_type || null,
            notes: entry.notes || '',
          },
        ])
        .select()

      if (addError) throw addError

      // Update local state
      if (data && data.length > 0) {
        expenses.value.unshift(data[0])
      }

      return data?.[0]
    } catch (err) {
      console.error('Error adding expense:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete an expense
  async function deleteExpense(id) {
    try {
      loading.value = true
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id)

      if (deleteError) throw deleteError

      // Update local state
      expenses.value = expenses.value.filter((expense) => expense.id !== id)

      return true
    } catch (err) {
      console.error('Error deleting expense:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch all records
  async function fetchRecords() {
    try {
      loading.value = true
      const { data, error: fetchError } = await supabase
        .from('records')
        .select('*')
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      records.value = data || []
      return data
    } catch (err) {
      console.error('Error fetching records:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add a new record
  async function addRecord(record) {
    try {
      loading.value = true
      const { data, error: addError } = await supabase
        .from('records')
        .insert([
          {
            date: record.date || new Date().toISOString(),
            type: record.type,
            description: record.description,
            amount: record.amount,
            unit: record.unit,
            cost_per_unit: record.cost_per_unit,
            total_cost: record.total_cost,
            reference_id: record.reference_id || null,
            reference_type: record.reference_type || null,
            notes: record.notes || '',
          },
        ])
        .select()

      if (addError) throw addError

      // Update local state
      if (data && data.length > 0) {
        records.value.unshift(data[0])
        return data[0]
      }

      return null
    } catch (err) {
      console.error('Error adding record:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add income
  async function addIncome(entry) {
    try {
      loading.value = true
      const { data, error: addError } = await supabase
        .from('income')
        .insert([
          {
            label: entry.label,
            amount: Number(entry.amount),
            date: entry.date || new Date().toISOString(),
            reference_id: entry.reference_id || null,
            reference_type: entry.reference_type || null,
            notes: entry.notes || '',
          },
        ])
        .select()

      if (addError) throw addError

      // Update local state
      if (data && data.length > 0) {
        income.value.unshift(data[0])
        return data[0]
      }

      return null
    } catch (err) {
      console.error('Error adding income:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const totalExpense = computed(() =>
    expenses.value.reduce((s, e) => s + (Number(e.amount) || 0), 0),
  )

  const totalIncome = computed(() => income.value.reduce((s, i) => s + (Number(i.amount) || 0), 0))

  const netProfit = computed(() => totalIncome.value - totalExpense.value)

  // Initialize store
  onMounted(async () => {
    await fetchExpenses()
    await fetchRecords()
  })

  return {
    records,
    expenses,
    income,
    loading,
    error,
    addRecord,
    addExpense,
    deleteExpense,
    addIncome,
    fetchExpenses,
    totalExpense,
    totalIncome,
    netProfit,
  }
})
