# Feed Inventory Alert System

## Overview
Added intelligent alert prompts that warn users when feed stocks are low and guide them to make more feed.

## Features

### 🔔 Alert Triggers
- **Low Stock**: When any feed category (starter/grower/finisher) has low stock levels
- **Critical Stock**: When any feed category has critically low stock levels
- **Days Remaining**: When overall feed stocks will run out in less than 7 days

### 🎯 Alert Actions
- **Make Feed Button**: Direct navigation to the appropriate feed calculator
- **Dismiss Button**: Close the alert temporarily
- **Auto-check**: Alerts automatically check when stock levels change

### 📨 Alert Messages
**Category-specific alerts:**
```
⚠️ Low Starter feed stock! Current stock: 25.5kg. You need to make more Starter feed to avoid running out.
```

**Overall alerts:**
```
⚠️ Feed stocks will run out in 5 days! Consider making more feed soon.
```

## Implementation Details

### State Management
```javascript
// Alert state
const showAlert = ref(false)
const alertMessage = ref('')
const alertCategory = ref('')
```

### Alert Logic
```javascript
const checkLowStockAlerts = () => {
  const categories = ['starter', 'grower', 'finisher']
  
  for (const category of categories) {
    const stock = feedInventory.feedStock[category]
    const status = feedInventory.stockStatusByCategory[category]
    
    // Alert if stock is low or critical
    if (status === 'low' || status === 'critical') {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
      alertMessage.value = `⚠️ Low ${categoryName} feed stock! Current stock: ${stock.toFixed(1)}kg. You need to make more ${categoryName} feed to avoid running out.`
      alertCategory.value = category
      showAlert.value = true
      return
    }
  }
  
  // Also check overall days remaining
  if (feedInventory.daysRemaining < 7) {
    alertMessage.value = `⚠️ Feed stocks will run out in ${Math.floor(feedInventory.daysRemaining)} days! Consider making more feed soon.`
    alertCategory.value = 'overall'
    showAlert.value = true
  }
}
```

### Navigation
```javascript
const goToFeedCalculator = (category) => {
  const routeName = category.charAt(0).toUpperCase() + category.slice(1) + 'FeedCalculator'
  router.push({ name: routeName })
  dismissAlert()
}
```

### UI Components
- **Alert Prompt**: Red gradient background with slide-in animation
- **Action Buttons**: Green "Make Feed" button and gray "Dismiss" button
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Slide-in effect and hover states

## When Alerts Appear

### Automatic Triggers
- **On Page Load**: Checks stock levels when FeedInventoryView loads
- **Stock Changes**: Triggers when feed inventory is updated
- **Real-time**: Monitors stock level changes via watchers

### Alert Priority
1. **Critical/Low Stock** (highest priority)
2. **Days Remaining < 7** (medium priority)
3. Only one alert shown at a time

## User Experience

### Flow
1. **Alert Appears** → User sees warning about low stock
2. **Action Choice** → User can "Make Feed" or "Dismiss"
3. **Direct Navigation** → "Make Feed" goes to appropriate calculator
4. **Stock Update** → After making feed, alert automatically disappears

### Visual Design
- **Red Gradient**: Indicates urgency
- **Clear Icons**: 🚨 for alerts, ⚠️ for warnings
- **Action-oriented**: Primary action is "Make Feed"
- **Non-intrusive**: Can be dismissed if not needed

## Benefits

### Proactive Management
- **Early Warnings**: Users know before stocks run out
- **Guided Actions**: Direct path to solution
- **Reduced Downtime**: Prevents feed shortages

### User Friendly
- **Clear Messages**: Specific information about what's needed
- **Easy Actions**: One-click navigation to solution
- **Flexible**: Can be dismissed if not convenient

The alert system ensures users never run out of feed unexpectedly and provides clear guidance on what to do next!
