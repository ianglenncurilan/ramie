import { logActivity } from '@/services/activityService'
import { ActivityType } from '@/services/activityService'

export const useActivityLogger = () => {
  const logHogActivity = async (type, hogId, details = {}) => {
    try {
      await logActivity({
        type,
        details,
        referenceType: 'hog',
        referenceId: hogId
      })
    } catch (error) {
      console.error('Failed to log hog activity:', error)
    }
  }

  const logFeedActivity = async (type, feedId, details = {}) => {
    try {
      await logActivity({
        type,
        details,
        referenceType: 'feed',
        referenceId: feedId
      })
    } catch (error) {
      console.error('Failed to log feed activity:', error)
    }
  }

  return {
    logHogActivity,
    logFeedActivity,
    ActivityType
  }
}
