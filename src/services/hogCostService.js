// Hog Cost Tracking Service
// Handles calculation and tracking of hog-related costs

import { supabase } from './supabase'

// Feed ingredient prices (these should ideally come from a database table)
const FEED_PRICES = {
  starter: 25.5, // Price per kg for starter feed
  grower: 22.75, // Price per kg for grower feed
  finisher: 20.25, // Price per kg for finisher feed
}

// Get feed price per kg for a category
export const getFeedPrice = (category) => {
  return FEED_PRICES[category] || 0
}

// Calculate daily feed cost for a hog
export const calculateDailyFeedCost = (hog) => {
  const ageInDays = hog.days || 0
  let dailyKg = 0
  let category = 'starter'

  // Determine feed category and daily consumption based on age
  if (ageInDays <= 84) {
    category = 'starter'
    if (ageInDays <= 28) dailyKg = 0.35
    else if (ageInDays <= 42) dailyKg = 0.75
    else if (ageInDays <= 56) dailyKg = 1.0
    else if (ageInDays <= 70) dailyKg = 1.2
    else dailyKg = 1.4
  } else if (ageInDays <= 112) {
    category = 'grower'
    if (ageInDays <= 90) dailyKg = 1.45
    else if (ageInDays <= 98) dailyKg = 1.5
    else dailyKg = 1.7
  } else {
    category = 'finisher'
    if (ageInDays <= 120) dailyKg = 2.0
    else if (ageInDays <= 126) dailyKg = 2.1
    else if (ageInDays <= 140) dailyKg = 2.2
    else if (ageInDays <= 154) dailyKg = 2.4
    else dailyKg = 2.65
  }

  const unitPrice = getFeedPrice(category)
  return {
    category,
    dailyKg,
    unitPrice,
    dailyCost: dailyKg * unitPrice,
  }
}

// Log daily feed cost for a hog
export const logDailyFeedCost = async (hogId, date, feedData) => {
  try {
    const { data, error } = await supabase
      .from('feed_cost_log')
      .insert({
        hog_id: hogId,
        date: date,
        feed_category: feedData.category,
        amount_kg: feedData.dailyKg,
        unit_price: feedData.unitPrice,
        total_cost: feedData.dailyCost,
      })
      .select()

    if (error) throw error

    console.log(`Logged feed cost for hog ${hogId}:`, feedData)
    return data?.[0]
  } catch (error) {
    console.error('Error logging feed cost:', error)
    throw error
  }
}

// Get total cost summary for all hogs
export const getHogCostSummary = async () => {
  try {
    const { data, error } = await supabase.from('hogs').select(`
        id,
        code,
        weight,
        days,
        stage,
        status,
        purchase_price,
        total_feed_cost,
        total_cost
      `)
    // Remove status filter to get ALL hogs (active, sold, deceased)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching hog cost summary:', error)
    throw error
  }
}

// Calculate cost metrics for dashboard
export const calculateCostMetrics = (hogs) => {
  const activeHogs = hogs.filter((hog) => hog.status === 'active')
  const soldHogs = hogs.filter((hog) => hog.status === 'sold')

  const totalInvestment = hogs.reduce((sum, hog) => sum + (hog.total_cost || 0), 0)
  const totalFeedCost = hogs.reduce((sum, hog) => sum + (hog.total_feed_cost || 0), 0)
  const totalPurchaseCost = hogs.reduce((sum, hog) => sum + (hog.purchase_price || 0), 0)

  const activeInvestment = activeHogs.reduce((sum, hog) => sum + (hog.total_cost || 0), 0)
  const soldInvestment = soldHogs.reduce((sum, hog) => sum + (hog.total_cost || 0), 0)

  const costPerHead = activeHogs.length > 0 ? activeInvestment / activeHogs.length : 0

  return {
    totalInvestment,
    totalFeedCost,
    totalPurchaseCost,
    activeInvestment,
    soldInvestment,
    costPerHead,
    activeHogCount: activeHogs.length,
    soldHogCount: soldHogs.length,
    totalHogCount: hogs.length,
  }
}

// Update feed prices (admin function)
export const updateFeedPrices = async (newPrices) => {
  try {
    // This would ideally update a feed_prices table in the database
    // For now, we'll just log the update
    console.log('Updating feed prices:', newPrices)

    // Update local prices
    Object.assign(FEED_PRICES, newPrices)

    return true
  } catch (error) {
    console.error('Error updating feed prices:', error)
    throw error
  }
}

// Get feed cost history for a specific hog
export const getHogFeedCostHistory = async (hogId) => {
  try {
    const { data, error } = await supabase
      .from('feed_cost_log')
      .select('*')
      .eq('hog_id', hogId)
      .order('date', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching hog feed cost history:', error)
    throw error
  }
}
