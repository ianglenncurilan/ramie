import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { logActivity } from '@/services/activityService'

export const useFeedsStore = defineStore('feeds', () => {
  const records = ref([]) // { id, date, stage, items:[{id,label,amountKg,costPerKg}], totalCostPerKg }
  const expenses = ref([]) // { id, date, label, amount }
  const income = ref([]) // { id, date, label, amount }
  const loading = ref(false)
  const error = ref(null)

  // Fetch all expenses and income
  async function fetchExpenses() {
    try {
      console.log('fetchExpenses called')
      loading.value = true
      // Fetch all entries from expenses table
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (fetchError) {
        console.error('Error fetching expenses:', fetchError)
        throw fetchError
      }

      console.log('Fetched expenses data:', data)

      // Separate expenses and income based on type
      if (data) {
        const expenseItems = data.filter((entry) => !entry.type || entry.type !== 'income')
        const incomeItems = data.filter((entry) => entry.type === 'income')

        console.log(
          `Separated into ${expenseItems.length} expenses and ${incomeItems.length} income items`,
        )

        expenses.value = expenseItems
        income.value = incomeItems
      } else {
        console.log('No data returned from expenses table')
        expenses.value = []
        income.value = []
      }

      console.log('Current income array:', income.value)
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
            type: 'expense', // Explicitly mark as expense
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
        // Add to expenses array and sort by date
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

      // Fetch creator names in batch
      const creatorIds = Array.from(new Set((data || []).map((r) => r.created_by).filter(Boolean)))
      let creatorsMap = {}
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', creatorIds)
        creatorsMap = (usersData || []).reduce((acc, u) => {
          acc[u.id] = u.full_name || u.email || u.id
          return acc
        }, {})
      }

      // Map DB rows to UI shape expected by RecordsView
      const mapped = (data || []).map((row) => {
        const items = Array.isArray(row.ingredients) ? row.ingredients : []
        const totalAmount = items.reduce((s, it) => s + (Number(it.amountKg) || 0), 0)
        // Derive stage from type like `feed-starter` or keep as provided
        let stage = row.stage || ''
        if (!stage && typeof row.type === 'string' && row.type.startsWith('feed-')) {
          stage = row.type.replace('feed-', '')
          stage = stage.charAt(0).toUpperCase() + stage.slice(1)
        }
        return {
          id: row.id,
          date: row.date || row.created_at,
          created_at: row.created_at,
          created_by: row.created_by || null,
          creatorName: row.created_by ? creatorsMap[row.created_by] || null : null,
          stage,
          type: row.type,
          items,
          totalAmount,
          totalCost: Number(row.total_cost) || 0,
        }
      })

      records.value = mapped
      return mapped
    } catch (err) {
      console.error('Error fetching records:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add a new record (supports feed formulations with items)
  async function addRecord(record) {
    try {
      loading.value = true

      // If this looks like a feed formulation, save to DB accordingly
      const isFeedFormulation = Array.isArray(record.items)

      // Determine current user for created_by
      const { data: auth } = await supabase.auth.getUser()
      const currentUserId = auth?.user?.id || null
      let currentUserName = null
      if (currentUserId) {
        const { data: me } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', currentUserId)
          .single()
        currentUserName = me?.full_name || me?.email || null
      }

      const insertPayload = isFeedFormulation
        ? {
            date: record.date || new Date().toISOString(),
            type:
              record.type || (record.stage ? `feed-${String(record.stage).toLowerCase()}` : 'feed'),
            ingredients: record.items || [],
            total_cost: Number(record.totalCost) || 0,
            notes: record.notes || '',
            created_by: currentUserId,
          }
        : {
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
            created_by: currentUserId,
          }

      const { data, error: addError } = await supabase
        .from('records')
        .insert([insertPayload])
        .select()

      if (addError) throw addError

      // Update local state (map to UI shape right away)
      if (data && data.length > 0) {
        const row = data[0]
        const items = Array.isArray(row.ingredients) ? row.ingredients : []
        const totalAmount = items.reduce((s, it) => s + (Number(it.amountKg) || 0), 0)
        let stage = record.stage || ''
        if (!stage && typeof row.type === 'string' && row.type.startsWith('feed-')) {
          stage = row.type.replace('feed-', '')
          stage = stage.charAt(0).toUpperCase() + stage.slice(1)
        }
        const pushed = {
          id: row.id,
          date: row.date || row.created_at,
          created_at: row.created_at,
          created_by: row.created_by || currentUserId,
          creatorName: currentUserName,
          stage,
          type: row.type,
          items,
          totalAmount,
          totalCost: Number(row.total_cost) || Number(record.totalCost) || 0,
        }
        records.value.unshift(pushed)

        // Log activity for feed creation
        if (isFeedFormulation) {
          await logActivity({
            type: 'feed_formulated',
            referenceType: 'records',
            referenceId: row.id,
            details: {
              stage,
              items_count: items.length,
              total_amount: totalAmount,
              total_cost: pushed.totalCost,
            },
          })
        }
        return pushed
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

  // Add income (stored in expenses table with type 'income')
  async function addIncome(entry) {
    try {
      console.log('addIncome called with:', entry)
      loading.value = true
      const incomeEntry = {
        label: entry.label,
        amount: Number(entry.amount),
        type: 'income', // Mark as income
        date: entry.date || new Date().toISOString(),
        reference_id: entry.reference_id || null,
        reference_type: entry.reference_type || null,
        notes: entry.notes || '',
      }
      console.log('Inserting income entry:', incomeEntry)

      const { data, error: addError } = await supabase
        .from('expenses')
        .insert([incomeEntry])
        .select()

      if (addError) {
        console.error('Error inserting income:', addError)
        throw addError
      }

      console.log('Income insertion successful, data:', data)

      // Update local state
      if (data && data.length > 0) {
        // Add to income array and sort by date
        income.value.unshift(data[0])
        console.log('Updated local income array, new length:', income.value.length)
        return data[0]
      }

      console.warn('No data returned from income insertion')
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
    fetchRecords,
    totalExpense,
    totalIncome,
    netProfit,
  }
})
