import { supabase } from './supabase'

export const logStaffActivity = async (userId, activityType, details = {}) => {
  try {
    const { data, error } = await supabase
      .from('staff_activities')
      .insert([
        { 
          user_id: userId, 
          activity_type: activityType,
          details: details
        }
      ])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error logging staff activity:', error)
    throw error
  }
}

export const getStaffActivities = async () => {
  try {
    const { data, error } = await supabase
      .from('staff_activities')
      .select(`
        *,
        profiles:user_id (id, full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching staff activities:', error)
    return []
  }
}

export const getStaffMembers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching staff members:', error)
    return []
  }
}
