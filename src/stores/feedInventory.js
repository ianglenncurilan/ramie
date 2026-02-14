import { defineStore } from 'pinia'
import { supabase } from '../services/supabase'
import {
  calculateTotalDailyConsumption,
  calculateDaysRemaining,
  predictDepletionDate,
  getCategoryBreakdown,
  isLowStock,
  getStockStatus,
} from '../services/feedInventoryService'
import { useFeedsStore } from './feeds'

export const useFeedInventoryStore = defineStore('feedInventory', {
  state: () => ({
    // Feed inventory data
    feedStock: {
      starter: 0,
      grower: 0,
      finisher: 0,
    },
    totalFeedStock: 0,

    // Analytics data
    dailyConsumption: 0,
    daysRemaining: Infinity,
    depletionDate: null,
    stockStatus: 'unknown',
    categoryBreakdown: {
      starter: { count: 0, dailyKg: 0 },
      grower: { count: 0, dailyKg: 0 },
      finisher: { count: 0, dailyKg: 0 },
    },

    // UI state
    loading: false,
    error: null,
    lastUpdated: null,
  }),

  getters: {
    // Get total stock across all categories
    totalStock: (state) => {
      return state.feedStock.starter + state.feedStock.grower + state.feedStock.finisher
    },

    // Check if any category is low stock
    hasLowStock: (state) => {
      return Object.values(state.feedStock).some((stock) =>
        isLowStock(calculateDaysRemaining(stock, state.dailyConsumption)),
      )
    },

    // Get stock status for each category
    stockStatusByCategory: (state) => {
      const status = {}
      Object.entries(state.feedStock).forEach(([category, stock]) => {
        const categoryConsumption = state.categoryBreakdown[category]?.dailyKg || 0
        status[category] = getStockStatus(calculateDaysRemaining(stock, categoryConsumption))
      })
      return status
    },
  },

  actions: {
    // Fetch feed inventory from database
    async fetchFeedInventory() {
      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase
          .from('feed_inventory')
          .select('*')
          .eq('id', 1)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          // Update state with database values
          this.feedStock.starter = data.starter_stock || 0
          this.feedStock.grower = data.grower_stock || 0
          this.feedStock.finisher = data.finisher_stock || 0
          this.lastUpdated = data.updated_at

          console.log('📊 Loaded feed inventory from database:', this.feedStock)
        } else {
          // Create initial record if none exists
          console.log('📝 No feed inventory record found, creating initial record')
          await this.createInitialInventory()
        }

        // Calculate analytics after loading
        await this.calculateAnalytics()
      } catch (error) {
        console.error('Error fetching feed inventory:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Create initial inventory record
    async createInitialInventory() {
      try {
        const { data, error } = await supabase
          .from('feed_inventory')
          .insert({
            id: 1,
            starter_stock: 0,
            grower_stock: 0,
            finisher_stock: 0,
          })
          .select()

        if (error) throw error

        console.log('✅ Created initial feed inventory record:', data)

        // Update local state
        this.feedStock.starter = 0
        this.feedStock.grower = 0
        this.feedStock.finisher = 0
      } catch (error) {
        console.error('Error creating initial inventory:', error)
        throw error
      }
    },

    // Update feed inventory
    async updateFeedInventory(updates) {
      this.loading = true
      this.error = null

      console.log('🔄 FeedInventoryStore.updateFeedInventory called with:', updates)
      console.log('🔄 Current stock levels:', this.feedStock)

      try {
        // First, fetch current stock levels from database
        const { data: currentStock, error: fetchError } = await supabase
          .from('feed_inventory')
          .select('*')
          .eq('id', 1)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        // Calculate new stock levels
        const newStock = {
          starter: (currentStock?.starter_stock || 0) + (updates.starter || 0),
          grower: (currentStock?.grower_stock || 0) + (updates.grower || 0),
          finisher: (currentStock?.finisher_stock || 0) + (updates.finisher || 0),
        }

        console.log('📊 Calculated new stock levels:', newStock)

        // Update database
        const { data, error } = await supabase
          .from('feed_inventory')
          .upsert({
            id: 1,
            starter_stock: newStock.starter,
            grower_stock: newStock.grower,
            finisher_stock: newStock.finisher,
            updated_at: new Date().toISOString(),
          })
          .select()

        if (error) throw error

        console.log('✅ Database updated successfully:', data)

        // Update local state
        this.feedStock.starter = newStock.starter
        this.feedStock.grower = newStock.grower
        this.feedStock.finisher = newStock.finisher

        console.log('✅ Updated local stock levels:', this.feedStock)
        this.lastUpdated = new Date().toISOString()

        // Create feed inventory record (like feed calculators do)
        await this.createFeedInventoryRecord(updates)

        // Notify other components of the update
        window.dispatchEvent(
          new CustomEvent('feedInventoryUpdated', {
            detail: { updated: true, stock: this.feedStock },
          }),
        )

        // Also set localStorage for cross-tab communication
        localStorage.setItem('feed-inventory-updated', Date.now())

        // Recalculate analytics
        await this.calculateAnalytics()

        return data
      } catch (error) {
        console.error('Error updating feed inventory:', error)
        this.error = error.message

        // Provide specific guidance for RLS errors
        if (error.message.includes('row-level security policy')) {
          this.error =
            'Permission denied: You need to update the feed inventory table permissions. Run the fix-feed-inventory-permissions.sql script in Supabase SQL Editor.'
        }

        throw error
      } finally {
        this.loading = false
      }
    },

    // Create feed inventory record (similar to feed calculators)
    async createFeedInventoryRecord(updates) {
      const feedsStore = useFeedsStore()

      try {
        // Create a record for each category that was updated
        for (const [category, amount] of Object.entries(updates)) {
          if (amount > 0) {
            const record = {
              stage: category.charAt(0).toUpperCase() + category.slice(1), // starter -> Starter
              items: [
                {
                  id: `${category}-feed-${Date.now()}`,
                  label: `${category.charAt(0).toUpperCase() + category.slice(1)} Feed Stock`,
                  amountKg: amount,
                  costPerKg: 0, // Stock additions don't have cost
                },
              ],
              totalKg: amount,
              totalCost: 0, // Stock additions don't have cost
              date: new Date().toISOString(),
              inventoryDeductions: [],
            }

            console.log(`📋 Creating feed inventory record for ${category}:`, record)
            await feedsStore.addRecord(record)
          }
        }
      } catch (error) {
        console.error('Error creating feed inventory record:', error)
      }
    },

    // Calculate analytics based on current hogs and inventory
    async calculateAnalytics() {
      try {
        // Import hogs store dynamically to avoid circular dependency
        const { useHogsStore } = await import('./hogs')
        const hogsStore = useHogsStore()

        // Get hogs from the hogs store instead of fetching directly
        // Use the same criteria as getStats() for consistency
        const activeHogs = hogsStore.hogs.filter(
          (hog) => hog.status !== 'sold' && hog.status !== 'deceased',
        )

        // Calculate consumption and analytics
        this.dailyConsumption = calculateTotalDailyConsumption(activeHogs)
        this.categoryBreakdown = getCategoryBreakdown(activeHogs)
        this.daysRemaining = calculateDaysRemaining(this.totalStock, this.dailyConsumption)
        this.depletionDate = predictDepletionDate(this.totalStock, this.dailyConsumption)
        this.stockStatus = getStockStatus(this.daysRemaining)
      } catch (error) {
        console.error('Error calculating analytics:', error)
        this.error = error.message
      }
    },

    // Daily cron job - deduct feed based on consumption
    async performDailyDeduction() {
      console.log('🔄 Performing daily feed deduction...')

      try {
        // Import hogs store dynamically to avoid circular dependency
        const { useHogsStore } = await import('./hogs')
        const { logDailyFeedCost, calculateDailyFeedCost } = await import(
          '../services/hogCostService.js'
        )
        const hogsStore = useHogsStore()

        // Get active hogs (exclude sold and deceased)
        const activeHogs = hogsStore.hogs.filter(
          (hog) => hog.status !== 'sold' && hog.status !== 'deceased',
        )

        console.log(
          '🐷 Active hogs for deduction:',
          activeHogs.length,
          activeHogs.map((h) => ({ id: h.id, status: h.status, days: h.days })),
        )

        const breakdown = getCategoryBreakdown(activeHogs)
        console.log('📊 Category breakdown:', breakdown)

        // Calculate deductions for each category
        const deductions = {
          starter: -breakdown.starter.dailyKg,
          grower: -breakdown.grower.dailyKg,
          finisher: -breakdown.finisher.dailyKg,
        }

        // Log feed costs for each active hog
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        for (const hog of activeHogs) {
          const feedData = calculateDailyFeedCost(hog)
          await logDailyFeedCost(hog.id, today, feedData)
        }

        // Update inventory with deductions
        await this.updateFeedInventory(deductions)

        console.log('✅ Daily deduction completed:', {
          starter: deductions.starter,
          grower: deductions.grower,
          finisher: deductions.finisher,
        })

        return true
      } catch (error) {
        console.error('❌ Daily deduction failed:', error)
        this.error = error.message
        return false
      }
    },

    // Manual stock adjustment
    async adjustStock(category, amount) {
      console.log(`🔧 Manual stock adjustment: ${category} + ${amount}kg`)

      try {
        const updates = { [category]: amount }
        await this.updateFeedInventory(updates)

        console.log(`✅ Manual adjustment completed: ${category} adjusted by ${amount}kg`)
      } catch (error) {
        console.error('Error adjusting stock:', error)
        this.error = error.message
      }
    },

    // Reset error state
    clearError() {
      this.error = null
    },
  },
})
