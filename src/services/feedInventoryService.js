// Feed Inventory & Growth Analytics Service
// Handles automatic feed consumption calculations and inventory management

// Feed consumption rates by age (days)
const FEED_CONSUMPTION_RATES = {
  28: { days: 28, dailyKg: 0.35, category: 'starter' }, // 4 weeks = 28 days
  42: { days: 42, dailyKg: 0.75, category: 'starter' }, // 6 weeks = 42 days
  56: { days: 56, dailyKg: 1.0, category: 'starter' }, // 8 weeks = 56 days
  70: { days: 70, dailyKg: 1.2, category: 'starter' }, // 10 weeks = 70 days
  84: { days: 84, dailyKg: 1.4, category: 'starter' }, // 12 weeks = 84 days
  85: { days: 85, dailyKg: 1.45, category: 'grower' }, // 85 days - start of grower
  90: { days: 90, dailyKg: 1.5, category: 'grower' }, // 90 days
  98: { days: 98, dailyKg: 1.7, category: 'grower' }, // 14 weeks = 98 days
  112: { days: 112, dailyKg: 1.9, category: 'grower' }, // 16 weeks = 112 days
  113: { days: 113, dailyKg: 2.0, category: 'finisher' }, // 113 days - start of finisher
  120: { days: 120, dailyKg: 2.1, category: 'finisher' }, // 120 days
  126: { days: 126, dailyKg: 2.2, category: 'finisher' }, // 18 weeks = 126 days
  140: { days: 140, dailyKg: 2.4, category: 'finisher' }, // 20 weeks = 140 days
  154: { days: 154, dailyKg: 2.65, category: 'finisher' }, // 22 weeks = 154 days
}

// Get consumption rate for a given age in days
export const getConsumptionRate = (ageDays) => {
  // Find the closest age bracket
  const ages = Object.keys(FEED_CONSUMPTION_RATES)
    .map(Number)
    .sort((a, b) => a - b)

  for (let i = 0; i < ages.length; i++) {
    if (ageDays <= ages[i]) {
      return FEED_CONSUMPTION_RATES[ages[i]]
    }
  }

  // If age is beyond the defined range, use the highest rate
  const oldestAge = Math.max(...ages)
  return FEED_CONSUMPTION_RATES[oldestAge]
}

// Calculate total daily consumption for all active hogs
export const calculateTotalDailyConsumption = (hogs) => {
  return hogs.reduce((total, hog) => {
    if (hog.status !== 'active') return total

    const ageInDays = hog.days || 0
    const rate = getConsumptionRate(ageInDays)

    return total + rate.dailyKg
  }, 0)
}

// Calculate days of feed remaining
export const calculateDaysRemaining = (currentStock, dailyConsumption) => {
  if (dailyConsumption <= 0) return Infinity
  return Math.floor(currentStock / dailyConsumption)
}

// Predict depletion date
export const predictDepletionDate = (currentStock, dailyConsumption) => {
  const daysRemaining = calculateDaysRemaining(currentStock, dailyConsumption)
  const depletionDate = new Date()
  depletionDate.setDate(depletionDate.getDate() + daysRemaining)
  return depletionDate
}

// Get feed category breakdown
export const getCategoryBreakdown = (hogs) => {
  const breakdown = {
    starter: { count: 0, dailyKg: 0 },
    grower: { count: 0, dailyKg: 0 },
    finisher: { count: 0, dailyKg: 0 },
  }

  hogs.forEach((hog) => {
    // Use the same criteria as hogs store getStats() for consistency
    if (hog.status === 'sold' || hog.status === 'deceased') return

    const ageInDays = hog.days || 0
    const rate = getConsumptionRate(ageInDays)

    breakdown[rate.category].count++
    breakdown[rate.category].dailyKg += rate.dailyKg
  })

  return breakdown
}

// Check if stock is low
export const isLowStock = (daysRemaining) => {
  return daysRemaining <= 7
}

// Get stock status level
export const getStockStatus = (daysRemaining) => {
  if (daysRemaining === Infinity) return 'unknown'
  if (daysRemaining <= 3) return 'critical'
  if (daysRemaining <= 7) return 'low'
  if (daysRemaining <= 14) return 'moderate'
  return 'good'
}
