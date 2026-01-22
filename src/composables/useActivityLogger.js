import { logActivity } from '@/services/activityService'
import { ActivityType } from '@/services/activityService'
import { useAlertModal } from './useAlertModal'

export const useActivityLogger = () => {
  const { showError } = useAlertModal()

  const logHogActivity = async (type, hogId, details = {}) => {
    try {
      await logActivity({
        type,
        details,
        referenceType: 'hog',
        referenceId: hogId,
      })
    } catch (error) {
      console.error('Failed to log hog activity:', error)
      showError('Failed to log hog activity.')
    }
  }

  const logFeedActivity = async (type, feedId, details = {}) => {
    try {
      await logActivity({
        type,
        details,
        referenceType: 'feed',
        referenceId: feedId,
      })
    } catch (error) {
      console.error('Failed to log feed activity:', error)
      showError('Failed to log feed activity.')
    }
  }

  return {
    logHogActivity,
    logFeedActivity,
    ActivityType,
  }
}
