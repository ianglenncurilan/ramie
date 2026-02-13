// Cron Service for Automated Feed Inventory Management
// Handles daily feed deduction and other scheduled tasks

class CronService {
  constructor() {
    this.feedInventory = null
    this.isRunning = false
    this.intervalId = null
  }

  // Initialize the service (call after Pinia is ready)
  async initialize() {
    if (this.feedInventory) return // Already initialized

    try {
      // Import and initialize the store after Pinia is ready
      const { useFeedInventoryStore } = await import('../stores/feedInventory')
      this.feedInventory = useFeedInventoryStore()
      console.log('✅ Cron service initialized with feed inventory store')
    } catch (error) {
      console.error('❌ Failed to initialize cron service:', error)
    }
  }

  // Start the cron service
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Cron service already running')
      return
    }

    // Initialize the store before starting
    await this.initialize()

    if (!this.feedInventory) {
      console.error('❌ Cannot start cron service: feed inventory store not available')
      return
    }

    console.log('🚀 Starting feed inventory cron service...')
    this.isRunning = true

    // Schedule to run every day at 11:59 PM (23:59)
    this.scheduleNextRun()
  }

  // Stop the cron service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('⏹️ Feed inventory cron service stopped')
  }

  // Schedule the next run
  scheduleNextRun() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 0, 0) // 11:59 PM

    const timeUntilRun = tomorrow.getTime() - now.getTime()

    console.log(`⏰ Next daily deduction scheduled for: ${tomorrow.toLocaleString()}`)

    // Set timeout for next run
    setTimeout(() => {
      this.performDailyDeduction()
      // Schedule next run after completing this one
      this.scheduleNextRun()
    }, timeUntilRun)
  }

  // Perform the daily feed deduction
  async performDailyDeduction() {
    console.log('🔄 Performing daily feed inventory deduction...')

    try {
      const success = await this.feedInventory.performDailyDeduction()

      if (success) {
        console.log('✅ Daily feed deduction completed successfully')

        // Show browser notification if supported
        this.showNotification(
          'Feed Inventory Updated',
          'Daily feed consumption has been deducted from inventory.',
        )
      } else {
        console.error('❌ Daily feed deduction failed')
        this.showNotification(
          'Feed Inventory Error',
          'Failed to perform daily feed deduction. Please check the system.',
          'error',
        )
      }
    } catch (error) {
      console.error('💥 Critical error in daily deduction:', error)
      this.showNotification(
        'Critical Error',
        'Feed inventory system encountered a critical error.',
        'error',
      )
    }
  }

  // Show browser notification
  showNotification(title, message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: type === 'error' ? '/error-icon.png' : '/success-icon.png',
        tag: 'feed-inventory',
      })

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000)
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        console.log(`Notification permission: ${permission}`)
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.getNextRunTime(),
    }
  }

  // Calculate next run time
  getNextRunTime() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 0, 0)
    return tomorrow
  }

  // Manual trigger for testing
  async triggerManualDeduction() {
    console.log('🔧 Manual trigger of daily deduction')
    await this.performDailyDeduction()
  }
}

// Create singleton instance
const cronService = new CronService()

export default cronService
