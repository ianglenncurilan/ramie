import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useHogsStore = defineStore('hogs', () => {
  const hogs = ref([])
  const nextHogId = ref(1)

  // Add a new hog
  function addHog(hogData) {
    const newHog = {
      id: nextHogId.value++,
      code: hogData.code || `HOG${String(nextHogId.value - 1).padStart(3, '0')}`,
      weight: hogData.weight || 0,
      days: hogData.days || 0,
      feedingCompleted: hogData.feedingCompleted || false,
      createdAt: new Date().toISOString(),
      lastFeedingDate: null,
      totalFeedingDays: 0,
    }
    hogs.value.push(newHog)
    return newHog
  }

  // Update hog data
  function updateHog(hogId, updates) {
    const hogIndex = hogs.value.findIndex((hog) => hog.id === hogId)
    if (hogIndex !== -1) {
      hogs.value[hogIndex] = { ...hogs.value[hogIndex], ...updates }
      return hogs.value[hogIndex]
    }
    return null
  }

  // Update hog weight
  function updateHogWeight(hogId, newWeight) {
    return updateHog(hogId, { weight: parseFloat(newWeight) || 0 })
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
  function markFeedingIncomplete(hogId) {
    return updateHog(hogId, {
      feedingCompleted: false,
      lastFeedingDate: null,
    })
  }

  // Mark feeding as completed (check button)
  function markFeedingComplete(hogId) {
    const hog = hogs.value.find((h) => h.id === hogId)
    if (hog) {
      const now = new Date()
      const wasCompleted = hog.feedingCompleted

      hog.feedingCompleted = true
      hog.lastFeedingDate = now.toISOString()

      // Only increment total feeding days if it wasn't already completed
      if (!wasCompleted) {
        hog.totalFeedingDays += 1
      }

      // Check if a full day has passed since last day increment
      const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
      const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

      if (daysSinceLastIncrement >= 1) {
        hog.days += 1
        hog.lastDayIncrement = now.toISOString()
      }

      return hog
    }
    return null
  }

  // Delete a hog
  function deleteHog(hogId) {
    const index = hogs.value.findIndex((hog) => hog.id === hogId)
    if (index !== -1) {
      hogs.value.splice(index, 1)
      return true
    }
    return false
  }

  // Get hog by ID
  function getHogById(hogId) {
    return hogs.value.find((hog) => hog.id === hogId)
  }

  // Get all hogs
  function getAllHogs() {
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
  function resetDailyFeedingStatus() {
    hogs.value.forEach((hog) => {
      hog.feedingCompleted = false
    })
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
  }
})
