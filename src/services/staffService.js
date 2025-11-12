import { supabase } from './supabase'

export const logStaffActivity = async (userId, activityType, details = {}) => {
  try {
    const { data, error } = await supabase
      .from('staff_activities')
      .insert([
        {
          staff_member_id: userId,
          activity_type: activityType,
          details: details,
        },
      ])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error logging staff activity:', error)
    throw error
  }
}

export const getStaffActivities = async (limit = 100, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('staff_activities')
      .select(`
        *,
        users:staff_member_id (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching staff activities:', error)
    throw error
  }
}

export const getStaffMembers = async (filters = {}) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply filters if any
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.role) {
      query = query.eq('role', filters.role)
    }
    if (filters.search) {
      query = query.ilike('full_name', `%${filters.search}%`)
    }

    // Add pagination
    const page = filters.page || 1
    const pageSize = filters.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await query.range(start, end)
    
    if (error) throw error
    
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  } catch (error) {
    console.error('Error fetching staff members:', error)
    throw error
  }
}

export const getStaffById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error fetching staff member with ID ${id}:`, error)
    throw error
  }
}

export const createStaffMember = async (staffData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        ...staffData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating staff member:', error)
    throw error
  }
}

export const updateStaffMember = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error(`Error updating staff member ${id}:`, error)
    throw error
  }
}

export const deleteStaffMember = async (id) => {
  try {
    // In a real app, you might want to soft delete instead
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error deleting staff member ${id}:`, error)
    throw error
  }
}

// Track staff login/logout
export const trackStaffLogin = async (userId) => {
  try {
    // Update last login time
    await supabase
      .from('profiles')
      .update({ 
        last_login: new Date().toISOString(),
        is_online: true
      })
      .eq('id', userId)

    // Log the login activity
    await logStaffActivity(userId, 'login')
  } catch (error) {
    console.error('Error tracking staff login:', error)
    // Don't throw to avoid blocking login flow
  }
}

export const trackStaffLogout = async (userId) => {
  try {
    // Update online status
    await supabase
      .from('profiles')
      .update({ 
        is_online: false,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId)

    // Log the logout activity
    await logStaffActivity(userId, 'logout')
  } catch (error) {
    console.error('Error tracking staff logout:', error)
  }
}
