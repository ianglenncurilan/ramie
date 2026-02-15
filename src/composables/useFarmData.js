/**
 * useFarmData Composable
 * 
 * Provides shared state management between FeedInventoryView and CostSummaryView
 * Ensures both views stay synchronized when data changes
 * 
 * Features:
 * - Centralized data fetching
 * - Real-time synchronization via Supabase Realtime
 * - Global refresh function
 * - Syncing state management
 */

import { ref, computed } from 'vue'
import { useFeedInventoryStore } from '../stores/feedInventory'
import { useHogsStore } from '../stores/hogs'
import { supabase } from '../services/supabase'
import { getHogCostSummary } from '../services/hogCostService'

// Global syncing state
const isSyncing = ref(false)
const lastSyncTime = ref(null)
const syncError = ref(null)

// Shared data refs
const feedInventoryData = ref(null)
const hogCostData = ref([])

/**
 * Composable function for farm data management
 */
export function useFarmData() {
  const feedInventory = useFeedInventoryStore()
  const hogsStore = useHogsStore()

  /**
   * Refresh all farm data (inventory + costs)
   * This is the main function to call when you need to sync data
   */
  const refreshAllData = async (showLoading = true) => {
    if (showLoading) {
      isSyncing.value = true
      syncError.value = null
    }

    try {
      console.log('🔄 Refreshing all farm data...')

      // Fetch all data in parallel for better performance
      const [inventoryResult, hogsResult, costResult] = await Promise.allSettled([
        feedInventory.fetchFeedInventory(),
        hogsStore.fetchHogs('all'),
        getHogCostSummary(),
      ])

      // Handle inventory result
      if (inventoryResult.status === 'fulfilled') {
        feedInventoryData.value = {
          stock: feedInventory.feedStock,
          totalCost: feedInventory.totalCost,
          lastUpdated: feedInventory.lastUpdated,
        }
      } else {
        console.error('Error fetching inventory:', inventoryResult.reason)
      }

      // Handle hogs result
      if (hogsResult.status === 'fulfilled') {
        // Recalculate analytics after hogs are loaded
        await feedInventory.calculateAnalytics()
      } else {
        console.error('Error fetching hogs:', hogsResult.reason)
      }

      // Handle cost data result
      if (costResult.status === 'fulfilled') {
        hogCostData.value = costResult.value || []
      } else {
        console.error('Error fetching cost data:', costResult.reason)
      }

      lastSyncTime.value = new Date()
      console.log('✅ All farm data refreshed successfully')

      // Dispatch custom event for cross-component communication
      window.dispatchEvent(
        new CustomEvent('farmDataRefreshed', {
          detail: {
            timestamp: lastSyncTime.value,
            inventory: feedInventoryData.value,
            costs: hogCostData.value,
          },
        }),
      )

      return {
        success: true,
        inventory: feedInventoryData.value,
        costs: hogCostData.value,
      }
    } catch (error) {
      console.error('❌ Error refreshing farm data:', error)
      syncError.value = error.message || 'Failed to refresh data'
      throw error
    } finally {
      if (showLoading) {
        isSyncing.value = false
      }
    }
  }

  /**
   * Manually trigger daily feed deduction
   */
  const triggerDailyDeduction = async () => {
    isSyncing.value = true
    syncError.value = null

    try {
      console.log('🔄 Triggering daily feed deduction...')

      // Call the database function
      const { data, error } = await supabase.rpc('process_daily_feed_deduction')

      if (error) throw error

      console.log('✅ Daily deduction result:', data)

      // Refresh all data after deduction
      await refreshAllData(false)

      return {
        success: data?.success || false,
        message: data?.message || 'Daily deduction completed',
        data,
      }
    } catch (error) {
      console.error('❌ Error triggering daily deduction:', error)
      syncError.value = error.message || 'Failed to process daily deduction'
      throw error
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * Initialize real-time subscriptions
   */
  const setupRealtimeSubscriptions = () => {
    console.log('📡 Setting up real-time subscriptions...')

    // Subscribe to feed_inventory changes
    const inventoryChannel = supabase
      .channel('feed-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_inventory',
        },
        (payload) => {
          console.log('📊 Feed inventory changed:', payload)
          // Refresh inventory data when it changes
          feedInventory.fetchFeedInventory()
        },
      )
      .subscribe()

    // Subscribe to hogs changes
    const hogsChannel = supabase
      .channel('hogs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hogs',
        },
        (payload) => {
          console.log('🐷 Hogs changed:', payload)
          // Refresh hogs and recalculate analytics
          hogsStore.fetchHogs('all').then(() => {
            feedInventory.calculateAnalytics()
          })
        },
      )
      .subscribe()

    // Subscribe to feed_cost_log changes (for cost summary)
    const costLogChannel = supabase
      .channel('feed-cost-log-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_cost_log',
        },
        (payload) => {
          console.log('💰 Feed cost log changed:', payload)
          // Refresh cost data
          getHogCostSummary().then((data) => {
            hogCostData.value = data || []
            window.dispatchEvent(
              new CustomEvent('costDataUpdated', {
                detail: { data: hogCostData.value },
              }),
            )
          })
        },
      )
      .subscribe()

    // Subscribe to hog_daily_consumption changes
    const dailyConsumptionChannel = supabase
      .channel('hog-daily-consumption-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hog_daily_consumption',
        },
        (payload) => {
          console.log('📝 Daily consumption changed:', payload)
          // Refresh all data when daily consumption is logged
          refreshAllData(false)
        },
      )
      .subscribe()

    // Return cleanup function
    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...')
      supabase.removeChannel(inventoryChannel)
      supabase.removeChannel(hogsChannel)
      supabase.removeChannel(costLogChannel)
      supabase.removeChannel(dailyConsumptionChannel)
    }
  }

  return {
    // State
    isSyncing: computed(() => isSyncing.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    syncError: computed(() => syncError.value),
    feedInventoryData: computed(() => feedInventoryData.value),
    hogCostData: computed(() => hogCostData.value),

    // Methods
    refreshAllData,
    triggerDailyDeduction,
    setupRealtimeSubscriptions,
  }
}

// Export global state for direct access if needed
export { isSyncing, lastSyncTime, syncError }
