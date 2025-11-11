import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { logStaffActivity } from '@/services/staffService'

export const useStaffStore = defineStore('staff', () => {
  const staffMembers = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed properties
  const activeStaff = computed(() => 
    staffMembers.value.filter(staff => staff.is_active === true)
  )

  const inactiveStaff = computed(() => 
    staffMembers.value.filter(staff => staff.is_active === false)
  )

  // Actions
  async function fetchStaff() {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      staffMembers.value = data || []
      console.log('Fetched staff members:', staffMembers.value)
      return data
    } catch (err) {
      console.error('Error fetching staff members:', err)
      error.value = err.message || 'Failed to fetch staff members'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addStaff(staffData) {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          ...staffData,
          is_active: true
        }])
        .select()
      
      if (insertError) throw insertError
      
      // Log the activity
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await logStaffActivity(user.id, 'staff_added', {
          staff_id: data[0].id,
          staff_name: `${staffData.first_name} ${staffData.last_name}`
        })
      }
      
      // Refresh the staff list
      await fetchStaff()
      return data[0]
    } catch (err) {
      console.error('Error adding staff member:', err)
      error.value = err.message || 'Failed to add staff member'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateStaff(id, updates) {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (updateError) throw updateError
      
      // Log the activity
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const staff = staffMembers.value.find(s => s.id === id)
        if (staff) {
          await logStaffActivity(user.id, 'staff_updated', {
            staff_id: id,
            staff_name: `${staff.first_name} ${staff.last_name}`,
            changes: Object.keys(updates)
          })
        }
      }
      
      // Update local state
      const index = staffMembers.value.findIndex(staff => staff.id === id)
      if (index !== -1) {
        staffMembers.value[index] = { ...staffMembers.value[index], ...updates }
      }
      
      return data[0]
    } catch (err) {
      console.error('Error updating staff member:', err)
      error.value = err.message || 'Failed to update staff member'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deactivateStaff(id) {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
        .select()
      
      if (updateError) throw updateError
      
      // Log the activity
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const staff = staffMembers.value.find(s => s.id === id)
        if (staff) {
          await logStaffActivity(user.id, 'staff_deactivated', {
            staff_id: id,
            staff_name: `${staff.first_name} ${staff.last_name}`
          })
        }
      }
      
      // Update local state
      const index = staffMembers.value.findIndex(staff => staff.id === id)
      if (index !== -1) {
        staffMembers.value[index].is_active = false
      }
      
      return data[0]
    } catch (err) {
      console.error('Error deactivating staff member:', err)
      error.value = err.message || 'Failed to deactivate staff member'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Setup real-time updates
  function setupRealtimeUpdates() {
    const subscription = supabase
      .channel('staff_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload) => {
          console.log('Staff change received:', payload)
          fetchStaff() // Refresh the staff list
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  return {
    staffMembers,
    activeStaff,
    inactiveStaff,
    loading,
    error,
    fetchStaff,
    addStaff,
    updateStaff,
    deactivateStaff,
    setupRealtimeUpdates
  }
})
