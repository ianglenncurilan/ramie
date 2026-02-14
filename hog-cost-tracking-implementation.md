# Hog Cost Tracking System Implementation

## Overview
This document outlines the complete implementation of a comprehensive hog cost tracking system for RAMIE, allowing users to calculate and monitor their total investment in hogs including purchase costs and feed consumption.

## Database Schema Changes

### New Fields in `hogs` table:
- `purchase_price` (DECIMAL(10,2)) - Initial purchase price of each hog
- `total_feed_cost` (DECIMAL(10,2)) - Cumulative cost of feed consumed
- `total_cost` (DECIMAL(10,2)) - Generated column: purchase_price + total_feed_cost

### New Table: `feed_cost_log`
- `id` - Primary key
- `hog_id` - Foreign key to hogs table
- `date` - Date of feed consumption
- `feed_category` - starter/grower/finisher
- `amount_kg` - Amount consumed in kg
- `unit_price` - Price per kg for that feed category
- `total_cost` - Daily feed cost (amount_kg × unit_price)

## Service Layer

### `hogCostService.js`
- **Feed Prices**: Configurable prices per feed category
- **Daily Cost Calculation**: Calculates feed cost based on hog age and consumption rates
- **Cost Logging**: Records daily feed costs to database
- **Cost Metrics**: Provides summary statistics for dashboard
- **Cost History**: Retrieves feed cost history for individual hogs

### Feed Price Structure (PHP/kg):
- Starter: ₱25.50
- Grower: ₱22.75  
- Finisher: ₱20.25

## Integration Points

### 1. Daily Feed Deduction Process
- Modified `performDailyDeduction()` in `feedInventory.js`
- Now logs feed costs for each active hog during daily inventory deduction
- Automatically updates `total_feed_cost` via database trigger

### 2. Hog Creation Process
- Updated `HogsTrackedView.vue` to include purchase price field
- Modified `hogs.js` store to handle purchase price
- Added validation for negative purchase prices

### 3. Cost Summary Dashboard
- New `CostSummaryView.vue` provides comprehensive cost analysis
- Displays total investment, feed costs, purchase costs, and cost per head
- Shows breakdown by active vs sold hogs
- Individual hog cost details with status indicators

## Key Features

### Cost Calculation Formula
```
Total Expense = Initial Purchase Price + Σ(Daily Feed Consumption × Price per kg of Feed)
```

### Dashboard Metrics
- **Total Investment**: Sum of all costs for all hogs
- **Total Feed Cost**: Cumulative feed expenses
- **Total Purchase Cost**: Sum of initial hog purchases
- **Cost per Active Hog**: Average investment per active animal
- **Active vs Sold Breakdown**: Cost distribution by hog status

### Individual Hog Tracking
- Purchase price at acquisition
- Cumulative feed consumption cost
- Total investment per animal
- Feed cost history by date

## Database Triggers

### Automatic Cost Updates
- `trigger_update_hog_feed_cost` automatically updates `total_feed_cost` 
- Trigger fires when new entries are added to `feed_cost_log`
- Ensures data consistency without manual calculations

## Navigation Integration

### Bottom Bar Menu
- Added "Costs" menu item for admin users
- Routes to `/cost-summary` with admin-only access
- Uses budget icon for visual consistency

## Usage Instructions

### 1. Database Migration
Run the migration to add cost tracking fields:
```sql
-- See: supabase/migrations/add_hog_cost_tracking.sql
```

### 2. Adding New Hogs
- Enter purchase price when adding new hogs
- System automatically starts tracking feed costs
- Daily deductions include cost logging

### 3. Viewing Cost Summary
- Access via "Costs" in bottom bar menu (admin only)
- View comprehensive cost breakdown
- Monitor individual hog investments
- Track profitability metrics

## Benefits

1. **Complete Cost Visibility**: Track all expenses related to hog production
2. **Profitability Analysis**: Compare costs against potential sale prices
3. **Feed Cost Optimization**: Monitor feed expenses by category and individual hogs
4. **Investment Tracking**: Understand total capital deployed in hog operations
5. **Data-Driven Decisions**: Make informed decisions based on actual cost data

## Future Enhancements

1. **Feed Price Management**: Dynamic feed price updates from suppliers
2. **Profitability Projections**: Break-even analysis and profit forecasting
3. **Cost Alerts**: Notifications when costs exceed thresholds
4. **Cost Reporting**: Exportable cost reports for accounting
5. **Feed Efficiency Metrics**: Cost per kg weight gain analysis

## Files Modified/Created

### New Files:
- `src/services/hogCostService.js` - Cost calculation and logging service
- `src/views/CostSummaryView.vue` - Cost dashboard interface
- `supabase/migrations/add_hog_cost_tracking.sql` - Database schema updates

### Modified Files:
- `src/stores/feedInventory.js` - Added cost logging to daily deduction
- `src/stores/hogs.js` - Added purchase price handling
- `src/views/HogsTrackedView.vue` - Added purchase price input
- `src/components/BottomBar.vue` - Added Costs menu item
- `src/router/index.js` - Added cost summary route

This implementation provides a solid foundation for comprehensive cost tracking and profitability analysis in the RAMIE hog management system.
