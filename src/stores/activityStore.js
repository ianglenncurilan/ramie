import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getActivities } from '@/services/activityService'

export const useActivityStore = defineStore('activity', () => {
  const activities = ref([])
  const loading = ref(false)
  const error = ref(null)
  const onlineUsers = ref(new Set())

  const fetchActivities = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await getActivities(filters)
      if (fetchError) throw fetchError
      activities.value = data || []
    } catch (err) {
      console.error('Error fetching activities:', err)
      error.value = err.message || 'Failed to load activities'
    } finally {
      loading.value = false
    }
  }

  const subscribeToActivities = () => {
    const channel = supabase
      .channel('staff_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_activities',
        },
        () => {
          fetchActivities()
        },
      )
      .subscribe()

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  }

  return {
    activities,
    loading,
    error,
    onlineUsers,
    fetchActivities,
    subscribeToActivities,
  }
})
