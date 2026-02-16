# Deceased Hog Workflow Implementation

## Overview
This document describes the complete implementation of the "Deceased Hog" workflow for R.A.M.I.E., which integrates three views (HogsTrackedView, CostSummaryView, and ExpensesView) through a transactional database function.

## System Architecture

### Data Flow
```
HogsTrackedView (User Action)
    ↓
RPC Function: mark_hog_as_deceased() [Transaction]
    ├─→ Update hogs table (status = 'deceased', date_of_death)
    ├─→ Create records entry (death record)
    └─→ Create expenses entry (Livestock Loss)
    ↓
State Updates (Pinia Stores)
    ├─→ hogsStore.refresh()
    └─→ feedsStore.fetchExpenses()
    ↓
View Updates (Automatic via Reactivity)
    ├─→ CostSummaryView (excludes deceased from active investment)
    └─→ ExpensesView (displays livestock loss)
```

## Implementation Components

### 1. Supabase RPC Function
**File:** `supabase/migrations/deceased_hog_workflow_function.sql`

**Function:** `mark_hog_as_deceased(p_hog_id, p_date_of_death, p_cause_of_death, p_death_notes)`

**Responsibilities:**
- Updates hog status to 'deceased' and records `date_of_death`
- Calculates total loss: `purchase_price + total_feed_cost`
- Creates death record in `records` table
- Creates expense entry in `expenses` table with category "Livestock Loss"
- All operations in a single transaction for data consistency
- Validates hog exists and is not already deceased/sold

**Database Triggers:**
- `prevent_cost_modification_after_death()` - Prevents modification of `purchase_price` or `total_feed_cost` for deceased hogs

### 2. Hogs Store (Pinia)
**File:** `src/stores/hogs.js`

**Updated Function:** `markAsDeceased(hogId, deathData)`

**Changes:**
- Now calls RPC function instead of multiple separate operations
- Refreshes all stores after completion
- Returns detailed result object with loss information
- Triggers state updates across all views

### 3. HogsTrackedView
**File:** `src/views/HogsTrackedView.vue`

**Updates:**
- `markAsDied()` - Enhanced to use RPC function and show detailed feedback
- `openEditModal()` - Added validation to prevent editing deceased/sold hogs
- `updateHogWeight()` - Added validation to prevent weight updates for deceased hogs
- Edit button disabled for deceased/sold hogs with tooltip

**User Experience:**
- Shows success message with total loss breakdown
- Prevents accidental modifications to deceased hogs
- Clear error messages for validation failures

### 4. CostSummaryView
**File:** `src/views/CostSummaryView.vue`

**Status:** Already properly configured

**Behavior:**
- Filters hogs by status: `active`, `sold`, `deceased`
- `activeInvestment` excludes deceased hogs
- `deceasedInvestment` shows total loss from deceased hogs
- Displays deceased hog count and total loss

### 5. ExpensesView
**File:** `src/views/ExpensesView.vue`

**Status:** Already properly configured

**Behavior:**
- Automatically displays livestock loss expenses
- Expense label format: "Livestock Loss - {Hog Code} ({Cause})"
- Includes purchase price and feed cost in notes
- Integrated into total expense calculations

### 6. Daily Feed Deduction
**Files:** 
- `supabase/migrations/daily_feed_deduction_function.sql`
- `src/stores/feedInventory.js`

**Status:** Already properly configured

**Behavior:**
- Filters out deceased hogs: `WHERE status = 'active'`
- Excludes deceased hogs from daily consumption calculations
- Prevents feed cost accumulation after death

## Validation & Data Integrity

### Database Level
1. **Transaction Safety:** All operations in single transaction
2. **Trigger Protection:** Cannot modify costs after death
3. **Status Validation:** Prevents marking already deceased/sold hogs

### Application Level
1. **UI Validation:** Edit buttons disabled for deceased hogs
2. **Form Validation:** Prevents weight/cost modifications
3. **Error Handling:** Clear error messages for users

## Testing Checklist

### Functional Tests
- [ ] Mark active hog as deceased
- [ ] Verify hog status changes to 'deceased'
- [ ] Verify `date_of_death` is recorded
- [ ] Verify expense entry is created with correct amount
- [ ] Verify expense appears in ExpensesView
- [ ] Verify deceased hog excluded from active investment in CostSummaryView
- [ ] Verify deceased hog excluded from daily feed deduction
- [ ] Verify cannot edit deceased hog (weight, purchase price)
- [ ] Verify cannot mark already deceased hog as deceased again
- [ ] Verify cannot mark sold hog as deceased

### Edge Cases
- [ ] Hog with zero purchase price
- [ ] Hog with zero feed cost
- [ ] Hog with both purchase price and feed cost
- [ ] Multiple hogs marked as deceased in sequence
- [ ] Network failure during transaction (should rollback)

## Database Schema Changes

### New Columns (if not exists)
- `hogs.date_of_death` or `hogs.deceased_date` - Date when hog died

### New Indexes
- `idx_hogs_date_of_death` - For querying deceased hogs by date
- `idx_hogs_status` - For filtering by status

### New Triggers
- `check_deceased_hog_cost_modification` - Prevents cost modifications

## API Reference

### RPC Function
```sql
SELECT mark_hog_as_deceased(
  p_hog_id := 123,
  p_date_of_death := '2024-01-15',
  p_cause_of_death := 'Disease',
  p_death_notes := 'Additional notes'
);
```

**Returns:**
```json
{
  "success": true,
  "hog_id": 123,
  "hog_code": "HOG001",
  "date_of_death": "2024-01-15",
  "cause_of_death": "Disease",
  "purchase_price": 5000.00,
  "total_feed_cost": 2500.00,
  "total_loss": 7500.00,
  "expense_id": 456,
  "message": "Hog HOG001 marked as deceased. Total loss: ₱7500.00..."
}
```

### Store Method
```javascript
const result = await hogsStore.markAsDeceased(hogId, {
  cause: 'Disease',
  weight: 50,
  notes: 'Additional notes',
  dateOfDeath: '2024-01-15'
});
```

## Benefits for Capstone Defense

### System Integration
- **Three Views Connected:** Demonstrates integration across tracking, cost summary, and expenses
- **Real-time Updates:** Shows reactive state management with Pinia
- **Data Consistency:** Transactional approach prevents data mismatch

### Technical Excellence
- **Database Transactions:** Ensures ACID compliance
- **Error Handling:** Comprehensive validation at multiple levels
- **User Experience:** Clear feedback and prevention of invalid operations

### Business Logic
- **Financial Accuracy:** Automatic loss calculation and expense recording
- **Inventory Management:** Prevents feed cost accumulation after death
- **Audit Trail:** Complete record of livestock losses

## Future Enhancements

1. **Reporting:** Add deceased hog reports with loss analysis
2. **Analytics:** Track mortality rates and causes
3. **Notifications:** Alert when livestock loss exceeds thresholds
4. **Recovery:** Option to reverse deceased status (with audit log)
5. **Bulk Operations:** Mark multiple hogs as deceased

## Maintenance Notes

- The RPC function handles all database operations atomically
- State updates are triggered automatically via Pinia reactivity
- No manual refresh needed - views update automatically
- Database trigger prevents accidental cost modifications

## Support

For issues or questions:
1. Check database logs for RPC function errors
2. Verify hog status in database: `SELECT * FROM hogs WHERE id = ?`
3. Check expenses table: `SELECT * FROM expenses WHERE reference_id = ? AND reference_type = 'hog'`
4. Review browser console for JavaScript errors
