// Test script to verify feed category breakdown logic
import { getConsumptionRate, getCategoryBreakdown } from './src/services/feedInventoryService.js'

// Test data: hogs with different ages
const testHogs = [
  { id: 1, code: 'H001', days: 30, status: 'active' },  // Should be starter
  { id: 2, code: 'H002', days: 60, status: 'active' },  // Should be starter  
  { id: 3, code: 'H003', days: 90, status: 'active' },  // Should be grower
  { id: 4, code: 'H004', days: 110, status: 'active' }, // Should be grower
  { id: 5, code: 'H005', days: 130, status: 'active' }, // Should be finisher
  { id: 6, code: 'H006', days: 150, status: 'active' }, // Should be finisher
  { id: 7, code: 'H007', days: 45, status: 'inactive' }, // Should be ignored
]

console.log('Testing individual consumption rates:')
testHogs.forEach(hog => {
  const rate = getConsumptionRate(hog.days)
  console.log(`Hog ${hog.code} (${hog.days} days): ${rate.category} - ${rate.dailyKg}kg/day`)
})

console.log('\nTesting category breakdown:')
const breakdown = getCategoryBreakdown(testHogs)
console.log('Category breakdown:', JSON.stringify(breakdown, null, 2))

console.log('\nExpected results:')
console.log('Starter: 2 hogs')
console.log('Grower: 2 hogs') 
console.log('Finisher: 2 hogs')
