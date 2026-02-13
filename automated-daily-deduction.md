# Automated Daily Feed Deduction System

## ✅ YES - System Automatically Deducts Feed Every Day

The system already has a comprehensive automated daily feed deduction system that automatically reduces feed inventory stocks based on hog consumption.

### 🔧 How It Works:

**1. Cron Service (`src/services/cronService.js`)**
- **Schedules**: Runs every day at 11:59 PM (23:59)
- **Auto-starts**: When app loads in browser
- **Notification**: Requests browser permission for notifications
- **Next-day scheduling**: Automatically schedules next day's run

**2. Daily Deduction Function (`src/stores/feedInventory.js`)**
```javascript
async performDailyDeduction() {
  // Get current hogs and calculate consumption
  const activeHogs = hogsStore.hogs.filter((hog) => hog.status === 'active')
  this.dailyConsumption = calculateTotalDailyConsumption(activeHogs)
  this.categoryBreakdown = getCategoryBreakdown(activeHogs)
  
  // Calculate deductions for each category
  const deductions = {
    starter: -breakdown.starter.dailyKg,
    grower: -breakdown.grower.dailyKg,
    finisher: -breakdown.finisher.dailyKg,
  }
  
  // Update inventory with deductions
  await this.updateFeedInventory(deductions)
}
```

**3. Consumption Calculation**
- **Starter Hogs**: Calculates daily starter feed consumption
- **Grower Hogs**: Calculates daily grower feed consumption  
- **Finisher Hogs**: Calculates daily finisher feed consumption
- **Total Consumption**: Sums all categories

### 📊 Daily Process:

**Every Day at 11:59 PM:**
1. **🔄 Logging**: "Performing daily feed deduction..."
2. **📊 Analysis**: Gets active hogs and calculates consumption
3. **📉 Deduction**: Reduces inventory by daily consumption amounts
4. **✅ Confirmation**: Logs successful deduction details
5. **📅 Reschedule**: Automatically schedules next day's run

### 🎯 Example Daily Deduction:

```
🔄 Performing daily feed deduction...
📊 Active hogs: 12 starter, 8 grower, 5 finisher
📈 Category breakdown: {
  starter: { count: 12, dailyKg: 12.5 },
  grower: { count: 8, dailyKg: 14.0 },
  finisher: { count: 5, dailyKg: 17.5 }
}
✅ Daily deduction completed: {
  starter: -12.5,
  grower: -14.0,
  finisher: -17.5
}
```

### 🔄 Automatic Features:

**Real-time Updates:**
- **Stock Levels**: Automatically updated after deduction
- **Analytics**: Recalculates days remaining and depletion date
- **UI Refresh**: FeedInventoryView shows new values immediately
- **Alert System**: Triggers low stock alerts if needed

**Smart Scheduling:**
- **Browser Notifications**: Requests permission to show notifications
- **Background Processing**: Runs even when app is not active
- **Error Recovery**: Handles failures and retries automatically
- **Cross-tab Sync**: Works across multiple browser tabs

### 📈 Consumption Rates:

**Based on Hog Age and Category:**
- **Starter Hogs** (0-70 days): 0.35-1.2 kg/day
- **Grower Hogs** (71-120 days): 1.4-1.9 kg/day  
- **Finisher Hogs** (121+ days): 2.2-2.65 kg/day

### 🎯 Integration with Feed Creation:

**Complete Flow:**
1. **Make Feed** → User creates feed formulation
2. **Stock Increase** → Inventory stocks increase
3. **Daily Deduction** → System automatically reduces stocks
4. **Real-time Balance** → Always accurate stock levels
5. **Low Stock Alerts** → Warns when stocks get low

### ✨ Benefits:

**Automated Management:**
- **No Manual Calculations**: System handles daily consumption automatically
- **Accurate Tracking**: Precise stock levels at all times
- **Proactive Alerts**: Warns before stocks run out
- **Time Saving**: Eliminates manual inventory management
- **Data Consistency**: Prevents human calculation errors

**The automated daily deduction system ensures feed inventory levels are always accurate and automatically adjusts for daily hog consumption!**
