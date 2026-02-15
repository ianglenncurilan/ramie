import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useFeedsStore } from './feeds'
import { useFeedInventoryStore } from './feedInventory'

export const useFeedFormulationsStore = defineStore('feedFormulations', () => {
  const formulations = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all feed formulations
  async function fetchFormulations() {
    try {
      loading.value = true
      const { data, error: fetchError } = await supabase
        .from('feed_formulations')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      formulations.value = data || []
      return data
    } catch (err) {
      console.error('Error fetching feed formulations:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Save a new feed formulation
  async function saveFormulation(formulation) {
    const feedsStore = useFeedsStore()
    const feedInventoryStore = useFeedInventoryStore()

    try {
      loading.value = true

      // Get current user's UUID
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Insert feed formulation directly (no inventory_id needed with simple approach)
      const { data, error: saveError } = await supabase
        .from('feed_formulations')
        .insert([
          {
            feed_type: formulation.feedType,
            name: formulation.name,
            ingredients: formulation.ingredients,
            total_kg: formulation.totalKg,
            total_cost: formulation.totalCost,
            cost_per_kg: formulation.costPerKg,
            notes: formulation.notes,
            created_by: user.id, // Use the authenticated user's UUID
          },
        ])
        .select()

      if (saveError) throw saveError

      console.log('✅ Feed formulation saved successfully:', data[0])

      // The trigger will automatically update the feed inventory
      // But we'll also refresh the inventory to ensure UI is updated
      if (data && data[0]) {
        console.log(
          `📦 Feed formulation saved for ${formulation.feedType}, refreshing inventory...`,
        )

        // Refresh inventory to get the updated values
        await feedInventoryStore.fetchFeedInventory()

        // Create expense record
        await feedsStore.addExpense({
          label: `Feed Formulation: ${formulation.name}`,
          amount: formulation.totalCost,
          date: new Date().toISOString(),
          reference_id: data[0].id,
          reference_type: 'feed_formulation',
        })

        console.log(`✅ Feed inventory updated and expense recorded!`)
      }

      // Add to local state
      if (data && data.length > 0) {
        formulations.value.unshift(data[0])
      }

      return data?.[0]
    } catch (err) {
      console.error('Error saving feed formulation:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update an existing feed formulation
  async function updateFormulation(id, updates) {
    try {
      loading.value = true
      const { data, error: updateError } = await supabase
        .from('feed_formulations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()

      if (updateError) throw updateError

      // Update local state
      if (data && data.length > 0) {
        const index = formulations.value.findIndex((f) => f.id === id)
        if (index !== -1) {
          formulations.value[index] = { ...formulations.value[index], ...updates }
        }
      }

      return data?.[0]
    } catch (err) {
      console.error('Error updating feed formulation:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a feed formulation
  async function deleteFormulation(id) {
    try {
      loading.value = true
      const { error: deleteError } = await supabase.from('feed_formulations').delete().eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      formulations.value = formulations.value.filter((f) => f.id !== id)

      return true
    } catch (err) {
      console.error('Error deleting feed formulation:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get formulations by feed type
  const getFormulationsByType = (feedType) => {
    return formulations.value.filter((f) => f.feed_type === feedType)
  }

  // Get a single formulation by ID
  const getFormulationById = (id) => {
    return formulations.value.find((f) => f.id === id)
  }

  return {
    formulations,
    loading,
    error,
    fetchFormulations,
    saveFormulation,
    updateFormulation,
    deleteFormulation,
    getFormulationsByType,
    getFormulationById,
  }
})
