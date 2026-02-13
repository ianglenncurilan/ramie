// Test utility to verify hog stage storage
import { useHogsStore } from '../stores/hogs'

export async function testHogStageStorage() {
  console.log('🧪 Testing hog stage storage...')
  
  const hogsStore = useHogsStore()
  
  try {
    // 1. Fetch current hogs
    await hogsStore.fetchHogs('all')
    console.log('📊 Current hogs:', hogsStore.hogs)
    
    // 2. Check if stages are stored
    const hogsWithoutStage = hogsStore.hogs.filter(hog => !hog.stage)
    console.log('❌ Hogs without stage:', hogsWithoutStage.length)
    
    if (hogsWithoutStage.length > 0) {
      console.log('🔧 Fixing stages for hogs without stage...')
      
      for (const hog of hogsWithoutStage) {
        const getHogStage = (days) => {
          if (days < 90) return 'Starter'
          if (days < 120) return 'Grower'
          return 'Finisher'
        }
        
        const calculatedStage = getHogStage(hog.days)
        console.log(`📝 Updating hog ${hog.code}: ${hog.days} days -> ${calculatedStage}`)
        
        await hogsStore.updateHog(hog.id, { stage: calculatedStage })
      }
    }
    
    // 3. Verify stages are now stored
    await hogsStore.fetchHogs('all')
    const hogsWithStage = hogsStore.hogs.filter(hog => hog.stage)
    console.log('✅ Hogs with stage:', hogsWithStage.length, '/', hogsStore.hogs.length)
    
    // 4. Show stage breakdown
    const stageBreakdown = {
      Starter: hogsStore.hogs.filter(hog => hog.stage === 'Starter').length,
      Grower: hogsStore.hogs.filter(hog => hog.stage === 'Grower').length,
      Finisher: hogsStore.hogs.filter(hog => hog.stage === 'Finisher').length,
    }
    console.log('📈 Stage breakdown:', stageBreakdown)
    
    return {
      success: true,
      totalHogs: hogsStore.hogs.length,
      hogsWithStage: hogsWithStage.length,
      stageBreakdown
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error.message }
  }
}
