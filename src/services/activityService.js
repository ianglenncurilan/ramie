import { supabase } from '@/services/supabase'

export const ActivityType = {
  HOG_ADDED: 'hog_added',
  HOG_UPDATED: 'hog_updated',
  HOG_DELETED: 'hog_deleted',
  HOG_FED: 'hog_fed',
  HOG_WEIGHT_UPDATED: 'hog_weight_updated',
  HOG_SOLD: 'hog_sold',
  HOG_DIED: 'hog_died',
  FEEDING_COMPLETED: 'feeding_completed',
  FEEDING_INCOMPLETE: 'feeding_incomplete',
  FEEDING_UNDONE: 'feeding_undone',
}

export const logActivity = async (activity) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('No authenticated user found')
    }

    const { data, error } = await supabase
      .from('staff_activities')
      .insert([
        {
          staff_member_id: user.id,
          activity_type: activity.type,
          details: activity.details || {},
          reference_type: activity.referenceType,
          reference_id: activity.referenceId,
        },
      ])
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error logging activity:', error)
    throw error
  }
}

export const getActivities = async (filters = {}) => {
  try {
    console.log('Fetching activities with filters:', filters)

    let query = supabase
      .from('staff_activities')
      .select(
        `
        *,
        users!staff_activities_staff_member_id_fkey(id, full_name, email)
      `,
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.type) {
      query = query.eq('activity_type', filters.type)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    // Debug log the raw response
    console.log('Raw activities data:', data)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching activities:', error)
    throw error
  }
}
