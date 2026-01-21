import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import { logStaffActivity } from '@/services/staffService'

export const useHogsStore = defineStore('hogs', () => {
  const hogs = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all hogs from the database
  async function fetchHogs() {
    try {
      loading.value = true
      const { data, error: fetchError } = await supabase
        .from('hogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Transform the data to match our frontend structure
      hogs.value = (data || []).map((hog) => ({
        id: hog.id,
        code: hog.code,
        weight: hog.weight || 0,
        days: hog.days || 0,
        feedingCompleted: hog.feeding_completed || false,
        createdAt: hog.created_at,
        updated_at: hog.updated_at,
        lastFeedingDate: hog.last_feeding_date,
        totalFeedingDays: hog.total_feeding_days || 0,
        lastDayIncrement: hog.last_day_increment,
      }))

      return hogs.value
    } catch (err) {
      console.error('Error fetching hogs:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add a new hog to the database
  async function addHog(hogData) {
    try {
      loading.value = true

      // Generate a default code if not provided
      const hogCode = hogData.code || `HOG${Date.now().toString().slice(-4)}`
      const now = new Date().toISOString()

      const { data, error: insertError } = await supabase
        .from('hogs')
        .insert([
          {
            code: hogCode,
            weight: hogData.weight || 0,
            days: hogData.days || 0,
            feeding_completed: false,
            created_at: now,
            last_feeding_date: null,
            total_feeding_days: 0,
            last_day_increment: now,
          },
        ])
        .select()

      if (insertError) throw insertError

      if (data && data.length > 0) {
        const newHog = {
          id: data[0].id,
          code: data[0].code,
          weight: data[0].weight,
          days: data[0].days,
          feedingCompleted: data[0].feeding_completed,
          createdAt: data[0].created_at,
          lastFeedingDate: data[0].last_feeding_date,
          totalFeedingDays: data[0].total_feeding_days,
          lastDayIncrement: data[0].last_day_increment,
        }

        hogs.value.unshift(newHog)
        return newHog
      }

      return null
    } catch (err) {
      console.error('Error adding hog:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update AM/PM feeding status
  async function updateFeedingStatus(hogId, { am, pm }) {
    try {
      loading.value = true

      // Update the database
      const { data, error } = await supabase
        .from('hogs')
        .update({
          am_feeding: am,
          pm_feeding: pm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hogId)
        .select()

      if (error) throw error

      // Update local state
      const hog = hogs.value.find((h) => h.id === hogId)
      if (hog) {
        hog.amFeeding = am
        hog.pmFeeding = pm
      }

      return data?.[0] || null
    } catch (err) {
      console.error('Error updating feeding status:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update hog data in the database
  async function updateHog(hogId, updates) {
    try {
      loading.value = true

      // Prepare the data to update in the database
      const dbUpdates = {}

      // Map frontend field names to database column names
      if ('feedingCompleted' in updates) dbUpdates.feeding_completed = updates.feedingCompleted
      if ('lastFeedingDate' in updates) dbUpdates.last_feeding_date = updates.lastFeedingDate
      if ('totalFeedingDays' in updates) dbUpdates.total_feeding_days = updates.totalFeedingDays
      if ('lastDayIncrement' in updates) dbUpdates.last_day_increment = updates.lastDayIncrement
      if ('weight' in updates) dbUpdates.weight = updates.weight
      if ('days' in updates) dbUpdates.days = updates.days
      if ('amFeeding' in updates) dbUpdates.am_feeding = updates.amFeeding
      if ('pmFeeding' in updates) dbUpdates.pm_feeding = updates.pmFeeding

      // Always update the updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString()

      const { data, error: updateError } = await supabase
        .from('hogs')
        .update(dbUpdates)
        .eq('id', hogId)
        .select()

      if (updateError) throw updateError

      // Update local state
      const hogIndex = hogs.value.findIndex((hog) => hog.id === hogId)
      if (hogIndex !== -1 && data && data[0]) {
        hogs.value[hogIndex] = {
          ...hogs.value[hogIndex],
          ...updates,
          lastFeedingDate: data[0].last_feeding_date,
          lastDayIncrement: data[0].last_day_increment,
          updated_at: data[0].updated_at,
        }
        return hogs.value[hogIndex]
      }

      return null
    } catch (err) {
      console.error('Error updating hog:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update hog weight
  function updateHogWeight(hogId, newWeight) {
    return updateHog(hogId, {
      weight: parseFloat(newWeight) || 0,
      updated_at: new Date().toISOString(),
    })
  }

  // Toggle feeding status
  function toggleFeedingStatus(hogId) {
    const hog = hogs.value.find((h) => h.id === hogId)
    if (hog) {
      const wasCompleted = hog.feedingCompleted
      const now = new Date()

      // If marking as completed and it wasn't completed before
      if (!wasCompleted) {
        hog.feedingCompleted = true
        hog.lastFeedingDate = now.toISOString()
        hog.totalFeedingDays += 1

        // Check if a full day has passed since last day increment
        const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
        const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

        if (daysSinceLastIncrement >= 1) {
          hog.days += 1
          hog.lastDayIncrement = now.toISOString()
        }
      } else {
        // If marking as not completed
        hog.feedingCompleted = false
      }

      return hog
    }
    return null
  }

  // Mark feeding as not completed (X button)
  async function markFeedingIncomplete(hogId) {
    try {
      loading.value = true
      const hog = hogs.value.find((h) => h.id === hogId)
      if (!hog) throw new Error('Hog not found')

      const updates = {
        feedingCompleted: false,
        lastFeedingDate: null,
      }

      const updatedHog = await updateHog(hogId, updates)

      if (!updatedHog) throw new Error('Failed to update hog')

      // Log the activity
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await logStaffActivity(user.id, 'hog_feeding_undone', {
          hog_id: hogId,
          hog_code: hog.code,
          feed_date: new Date().toISOString(),
          days: hog.days,
        })
      }

      return updatedHog
    } catch (err) {
      console.error('Error in markFeedingIncomplete:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mark feeding as completed (check button)
  async function markFeedingComplete(hogId) {
    try {
      loading.value = true
      const hog = hogs.value.find((h) => h.id === hogId)
      if (!hog) throw new Error('Hog not found')

      const now = new Date()
      const wasCompleted = hog.feedingCompleted
      const updates = {
        feedingCompleted: true,
        lastFeedingDate: now.toISOString(),
      }

      // Only increment total feeding days if it wasn't already completed
      if (!wasCompleted) {
        updates.totalFeedingDays = (hog.totalFeedingDays || 0) + 1
      }

      // Check if a full day has passed since last day increment
      const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
      const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

      if (daysSinceLastIncrement >= 1) {
        updates.days = (hog.days || 0) + 1
        updates.lastDayIncrement = now.toISOString()
      }

      // Update the database and local state
      const updatedHog = await updateHog(hogId, updates)

      if (!updatedHog) throw new Error('Failed to update hog')

      // Log the activity if this is a new feeding
      if (!wasCompleted) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await logStaffActivity(user.id, 'hog_fed', {
            hog_id: hogId,
            hog_code: hog.code,
            feed_date: now.toISOString(),
            days: updates.days || hog.days,
          })
        }
      }

      return updatedHog
    } catch (err) {
      console.error('Error in markFeedingComplete:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a hog from the database
  async function deleteHog(hogId) {
    try {
      loading.value = true

      const { error: deleteError } = await supabase.from('hogs').delete().eq('id', hogId)

      if (deleteError) throw deleteError

      // Update local state
      const index = hogs.value.findIndex((hog) => hog.id === hogId)
      if (index !== -1) {
        hogs.value.splice(index, 1)
        return true
      }

      return false
    } catch (err) {
      console.error('Error deleting hog:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get hog by ID
  function getHogById(hogId) {
    return hogs.value.find((hog) => hog.id === hogId)
  }

  // Get all hogs, fetching from the database if needed
  async function getAllHogs() {
    if (hogs.value.length === 0) {
      await fetchHogs()
    }
    return hogs.value
  }

  // Get hogs by feeding status
  function getHogsByFeedingStatus(completed) {
    return hogs.value.filter((hog) => hog.feedingCompleted === completed)
  }

  // Get hogs that need feeding (not completed today)
  function getHogsNeedingFeeding() {
    const today = new Date().toDateString()
    return hogs.value.filter((hog) => {
      if (!hog.feedingCompleted) return true
      if (!hog.lastFeedingDate) return true
      return new Date(hog.lastFeedingDate).toDateString() !== today
    })
  }

  // Auto-increment days for all hogs (call this daily)
  function incrementDaysForAllHogs() {
    const now = new Date()
    hogs.value.forEach((hog) => {
      const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
      const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

      if (daysSinceLastIncrement >= 1) {
        hog.days += daysSinceLastIncrement
        hog.lastDayIncrement = now.toISOString()
      }
    })
  }

  // Reset all feeding statuses (call this daily to reset for new day)
  async function resetDailyFeedingStatus() {
    const today = new Date().toDateString()
    const toReset = hogs.value.filter(
      (hog) =>
        hog.feedingCompleted &&
        (!hog.lastFeedingDate || new Date(hog.lastFeedingDate).toDateString() !== today),
    )
    if (toReset.length === 0) return
    const ids = toReset.map((h) => h.id)
    const { data, error: updateError } = await supabase
      .from('hogs')
      .update({ feeding_completed: false })
      .in('id', ids)
      .select('id')
    if (!updateError) {
      const resetSet = new Set((data || []).map((d) => d.id))
      hogs.value = hogs.value.map((h) =>
        resetSet.has(h.id) ? { ...h, feedingCompleted: false } : h,
      )
    }
  }

  // Ensure daily reset (checks and applies once per load)
  async function ensureDailyReset() {
    await resetDailyFeedingStatus()
  }

  // Realtime subscription for hogs table
  function subscribeToRealtime() {
    const channel = supabase
      .channel('hogs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hogs' }, () => {
        fetchHogs()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  // Get statistics
  function getStats() {
    const totalHogs = hogs.value.length
    const completedToday = hogs.value.filter((hog) => hog.feedingCompleted).length
    const averageWeight =
      totalHogs > 0 ? hogs.value.reduce((sum, hog) => sum + hog.weight, 0) / totalHogs : 0
    const averageDays =
      totalHogs > 0 ? hogs.value.reduce((sum, hog) => sum + hog.days, 0) / totalHogs : 0

    return {
      totalHogs,
      completedToday,
      pendingFeeding: totalHogs - completedToday,
      averageWeight: Math.round(averageWeight * 10) / 10,
      averageDays: Math.round(averageDays),
    }
  }

  return {
    hogs,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    updateFeedingStatus,
    addHog,
    updateHog,
    updateHogWeight,
    toggleFeedingStatus,
    markFeedingIncomplete,
    markFeedingComplete,
    deleteHog,
    getHogById,
    getAllHogs,
    getHogsByFeedingStatus,
    getHogsNeedingFeeding,
    incrementDaysForAllHogs,
    resetDailyFeedingStatus,
    getStats,
    fetchHogs,
    resetDailyFeedingStatus,
    ensureDailyReset,
    subscribeToRealtime,
  }
})
