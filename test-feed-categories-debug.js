// Test script to debug feed category issues
// Import the functions we need to test

// Test data with various ages
const testHogs = [
  { id: 1, code: 'TEST001', days: 30, status: 'active' },  // Should be starter
  { id: 2, code: 'TEST002', days: 60, status: 'active' },  // Should be starter  
  { id: 3, code: 'TEST003', days: 84, status: 'active' },  // Should be starter
  { id: 4, code: 'TEST004', days: 85, status: 'active' },  // Should be grower
  { id: 5, code: 'TEST005', days: 90, status: 'active' },  // Should be grower
  { id: 6, code: 'TEST006', days: 112, status: 'active' }, // Should be grower
  { id: 7, code: 'TEST007', days: 113, status: 'active' }, // Should be finisher
  { id: 8, code: 'TEST008', days: 150, status: 'active' }, // Should be finisher
  { id: 9, code: 'TEST009', days: 200, status: 'active' }, // Should be finisher
]

// Feed consumption rates (copied from service)
const FEED_CONSUMPTION_RATES = {
  28: { days: 28, dailyKg: 0.35, category: 'starter' },
  42: { days: 42, dailyKg: 0.75, category: 'starter' },
  56: { days: 56, dailyKg: 1.0, category: 'starter' },
  70: { days: 70, dailyKg: 1.2, category: 'starter' },
  84: { days: 84, dailyKg: 1.4, category: 'starter' },
  85: { days: 85, dailyKg: 1.45, category: 'grower' },
  90: { days: 90, dailyKg: 1.5, category: 'grower' },
  98: { days: 98, dailyKg: 1.7, category: 'grower' },
  112: { days: 112, dailyKg: 1.9, category: 'grower' },
  113: { days: 113, dailyKg: 2.0, category: 'finisher' },
  120: { days: 120, dailyKg: 2.1, category: 'finisher' },
  126: { days: 126, dailyKg: 2.2, category: 'finisher' },
  140: { days: 140, dailyKg: 2.4, category: 'finisher' },
  154: { days: 154, dailyKg: 2.65, category: 'finisher' },
}

const getConsumptionRate = (ageDays) => {
  const ages = Object.keys(FEED_CONSUMPTION_RATES)
    .map(Number)
    .sort((a, b) => a - b)

  for (let i = 0; i < ages.length; i++) {
    if (ageDays <= ages[i]) {
      return FEED_CONSUMPTION_RATES[ages[i]]
    }
  }

  const oldestAge = Math.max(...ages)
  return FEED_CONSUMPTION_RATES[oldestAge]
}

const getCategoryBreakdown = (hogs) => {
  const breakdown = {
    starter: { count: 0, dailyKg: 0 },
    grower: { count: 0, dailyKg: 0 },
    finisher: { count: 0, dailyKg: 0 },
  }

  hogs.forEach((hog) => {
    if (hog.status !== 'active') return

    const ageInDays = hog.days || 0
    const rate = getConsumptionRate(ageInDays)

    console.log(`Hog ${hog.code} (${ageInDays} days): ${rate.category} - ${rate.dailyKg}kg/day`)

    breakdown[rate.category].count++
    breakdown[rate.category].dailyKg += rate.dailyKg
  })

  return breakdown
}

console.log('=== Testing Feed Category Breakdown ===')
console.log('Test hogs:', testHogs.length)
console.log('')

const breakdown = getCategoryBreakdown(testHogs)

console.log('')
console.log('=== Results ===')
console.log('Starter:', breakdown.starter)
console.log('Grower:', breakdown.grower) 
console.log('Finisher:', breakdown.finisher)

console.log('')
console.log('=== Expected Results ===')
console.log('Starter: 3 hogs (30, 60, 84 days)')
console.log('Grower: 4 hogs (85, 90, 98, 112 days)')
console.log('Finisher: 2 hogs (113, 150 days)')
