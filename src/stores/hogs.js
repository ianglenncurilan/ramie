import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import { logStaffActivity } from '@/services/staffService'
import { useRouter } from 'vue-router'
import { useFeedsStore } from './feeds'

export const useHogsStore = defineStore('hogs', () => {
  const hogs = ref([])
  const records = ref([])
  const loading = ref(false)
  const error = ref(null)
  const router = useRouter()

  // Fetch all hogs from the database with retry logic
  async function fetchHogs(status = 'active', retryCount = 0) {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second

    try {
      console.log(`[${new Date().toISOString()}] Fetching hogs with status: ${status}`)
      loading.value = true
      error.value = null

      // Build the query
      let query = supabase
        .from('hogs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Only filter by status if it's not 'all'
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      // Execute the query with a timeout
      const { data, error: fetchError, count } = await query

      if (fetchError) {
        console.error('Error fetching hogs:', fetchError)
        throw fetchError
      }

      console.log(`Fetched ${data?.length || 0} hogs from database`)

      // Transform the data to match our frontend structure
      const transformedHogs = (data || []).map((hog) => ({
        id: hog.id,
        code: hog.code || 'N/A',
        weight: Number(hog.weight) || 0,
        days: Number(hog.days) || 0,
        amFeeding: Boolean(hog.am_feeding),
        pmFeeding: Boolean(hog.pm_feeding),
        feedingCompleted: Boolean(hog.feeding_completed),
        status: hog.status || 'active',
        createdAt: hog.created_at,
        updated_at: hog.updated_at,
        lastFeedingDate: hog.last_feeding_date,
        totalFeedingDays: Number(hog.total_feeding_days) || 0,
        lastDayIncrement: hog.last_day_increment,
      }))

      console.log('Transformed hogs:', transformedHogs)

      // Always update the local state, even if empty array
      hogs.value = transformedHogs

      // Log the first hog for debugging
      if (transformedHogs.length > 0) {
        console.log('First hog details:', JSON.stringify(transformedHogs[0], null, 2))
      }

      return transformedHogs
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch hogs'
      console.error('Error fetching hogs:', errorMessage, err)
      error.value = errorMessage

      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount)
        console.warn(`Retrying fetchHogs in ${delay}ms (${retryCount + 1}/${MAX_RETRIES})...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return fetchHogs(status, retryCount + 1)
      }

      // If we have cached data, return it instead of empty array
      if (hogs.value.length > 0) {
        console.warn('Using cached hogs data due to fetch error')
        return hogs.value
      }

      // Log the error to the server if possible
      try {
        await logStaffActivity({
          activity_type: 'error',
          details: `Failed to fetch hogs after ${MAX_RETRIES} retries: ${errorMessage}`,
          reference_type: 'hogs',
        })
      } catch (logErr) {
        console.error('Failed to log error:', logErr)
      }

      // Return empty array to prevent UI errors
      return []
    } finally {
      loading.value = false
    }
  }

  // Add a new hog to the database
  async function addHog(hogData) {
    try {
      loading.value = true
      error.value = null

      // Validate required fields
      if (!hogData.code?.trim()) {
        throw new Error('Hog code is required')
      }

      // Check if hog with same code already exists
      const { data: existingHogs } = await supabase
        .from('hogs')
        .select('id')
        .eq('code', hogData.code.trim())
        .limit(1)

      if (existingHogs && existingHogs.length > 0) {
        throw new Error('A hog with this code already exists')
      }

      const now = new Date().toISOString()
      const hogCode = hogData.code.trim()

      console.log('Adding new hog to database:', {
        code: hogCode,
        weight: Number(hogData.weight) || 0,
        days: Number(hogData.days) || 0,
        status: 'active',
        created_at: now,
        updated_at: now,
      })

      const { data, error: insertError } = await supabase
        .from('hogs')
        .insert([
          {
            code: hogCode,
            weight: Number(hogData.weight) || 0,
            days: Number(hogData.days) || 0,
            am_feeding: false,
            pm_feeding: false,
            feeding_completed: false,
            status: 'active',
            created_at: now,
            updated_at: now,
            last_feeding_date: null,
            total_feeding_days: 0,
            last_day_increment: now,
          },
        ])
        .select()

      if (insertError) {
        console.error('Database error when adding hog:', insertError)
        throw new Error(insertError.message || 'Failed to add hog to database')
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after adding hog')
      }

      // Fetch the newly added hog to get all fields including defaults
      const { data: addedHog, error: fetchError } = await supabase
        .from('hogs')
        .select('*')
        .eq('id', data[0].id)
        .single()

      if (fetchError || !addedHog) {
        console.error('Error fetching added hog:', fetchError)
        throw new Error('Failed to verify hog was added')
      }

      // Transform to match frontend structure
      const newHog = {
        id: addedHog.id,
        code: addedHog.code,
        weight: Number(addedHog.weight) || 0,
        days: Number(addedHog.days) || 0,
        amFeeding: Boolean(addedHog.am_feeding),
        pmFeeding: Boolean(addedHog.pm_feeding),
        feedingCompleted: Boolean(addedHog.feeding_completed),
        status: addedHog.status || 'active',
        createdAt: addedHog.created_at,
        updated_at: addedHog.updated_at,
        lastFeedingDate: addedHog.last_feeding_date,
        totalFeedingDays: Number(addedHog.total_feeding_days) || 0,
        lastDayIncrement: addedHog.last_day_increment,
      }

      console.log('Successfully added hog:', newHog)

      // Update local state
      hogs.value = [newHog, ...hogs.value]

      // Create an activity log
      try {
        await logStaffActivity({
          activity_type: 'hog_added',
          details: `Added hog ${newHog.code} (${newHog.weight}kg)`,
          reference_id: newHog.id,
          reference_type: 'hog',
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
        // Don't fail the operation if logging fails
      }

      return newHog
    } catch (err) {
      console.error('Error adding hog:', err)
      error.value = err.message || 'Failed to add hog'

      // If we have a database error, try to provide more context
      if (err.code) {
        console.error('Database error code:', err.code)
        console.error('Database error details:', err.details)
        console.error('Database error hint:', err.hint)
      }

      throw err
    } finally {
      loading.value = false

      // Force refresh the hogs list to ensure consistency
      try {
        await fetchHogs()
      } catch (fetchErr) {
        console.error('Error refreshing hogs after add:', fetchErr)
      }
    }
  }

  // Update AM/PM feeding status
  async function updateFeedingStatus(hogId, { am, pm }) {
    try {
      loading.value = true

      // Update the database
      const { data, error } = await supabase
        .from('hogs')
        .update({
          am_feeding: am,
          pm_feeding: pm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hogId)
        .select()

      if (error) throw error

      // Update local state
      const hog = hogs.value.find((h) => h.id === hogId)
      if (hog) {
        hog.amFeeding = am
        hog.pmFeeding = pm
      }

      return data?.[0] || null
    } catch (err) {
      console.error('Error updating feeding status:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Set feeding status for a specific time of day (AM/PM)
  async function setFeedingTime(hogId, timeOfDay, isFed) {
    try {
      // Validate timeOfDay
      if (!['am', 'pm'].includes(timeOfDay)) {
        throw new Error("Invalid time of day. Must be 'am' or 'pm'.")
      }

      loading.value = true

      // Prepare the database update
      const dbUpdate = {}
      dbUpdate[`${timeOfDay}_feeding`] = isFed
      dbUpdate.updated_at = new Date().toISOString()

      // Update the database
      const { data, error: updateError } = await supabase
        .from('hogs')
        .update(dbUpdate)
        .eq('id', hogId)
        .select()

      if (updateError) throw updateError

      // Update local state reactively
      const hogIndex = hogs.value.findIndex((h) => h.id === hogId)
      if (hogIndex !== -1) {
        // Create a new object to ensure reactivity
        const updatedHog = {
          ...hogs.value[hogIndex],
        }
        updatedHog[`${timeOfDay}Feeding`] = isFed
        // Replace the old object with the new one
        hogs.value.splice(hogIndex, 1, updatedHog)
      }

      return data?.[0] || null
    } catch (err) {
      console.error(`Error setting ${timeOfDay} feeding status:`, err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update hog data in the database
  async function updateHog(hogId, updates, updateTimestamp = true) {
    try {
      loading.value = true

      // Only update timestamp if explicitly requested
      if (updateTimestamp) {
        updates.updated_at = new Date().toISOString()
      }

      // Prepare the data to update in the database
      const dbUpdates = {}

      // Map frontend field names to database column names
      if ('feedingCompleted' in updates) dbUpdates.feeding_completed = updates.feedingCompleted
      if ('lastFeedingDate' in updates) dbUpdates.last_feeding_date = updates.lastFeedingDate
      if ('totalFeedingDays' in updates) dbUpdates.total_feeding_days = updates.totalFeedingDays
      if ('lastDayIncrement' in updates) dbUpdates.last_day_increment = updates.lastDayIncrement
      if ('weight' in updates) dbUpdates.weight = updates.weight
      if ('days' in updates) dbUpdates.days = updates.days
      if ('amFeeding' in updates) dbUpdates.am_feeding = updates.amFeeding
      if ('pmFeeding' in updates) dbUpdates.pm_feeding = updates.pmFeeding

      // Always update the updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString()

      const { data, error: updateError } = await supabase
        .from('hogs')
        .update(dbUpdates)
        .eq('id', hogId)
        .select()

      if (updateError) throw updateError

      // Update local state
      const hogIndex = hogs.value.findIndex((hog) => hog.id === hogId)
      if (hogIndex !== -1 && data && data[0]) {
        hogs.value[hogIndex] = {
          ...hogs.value[hogIndex],
          ...updates,
          lastFeedingDate: data[0].last_feeding_date,
          lastDayIncrement: data[0].last_day_increment,
          updated_at: data[0].updated_at,
        }
        return hogs.value[hogIndex]
      }

      return null
    } catch (err) {
      console.error('Error updating hog:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update hog weight
  function updateHogWeight(hogId, newWeight) {
    return updateHog(
      hogId,
      {
        weight: parseFloat(newWeight) || 0,
      },
      true,
    ) // Pass true to update the timestamp
  }

  // Toggle feeding status
  function toggleFeedingStatus(hogId) {
    const hog = hogs.value.find((h) => h.id === hogId)
    if (hog) {
      const wasCompleted = hog.feedingCompleted
      const now = new Date()

      // If marking as completed and it wasn't completed before
      if (!wasCompleted) {
        hog.feedingCompleted = true
        hog.lastFeedingDate = now.toISOString()
        hog.totalFeedingDays += 1

        // Check if a full day has passed since last day increment
        const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
        const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

        if (daysSinceLastIncrement >= 1) {
          hog.days += 1
          hog.lastDayIncrement = now.toISOString()
        }
      } else {
        // If marking as not completed
        hog.feedingCompleted = false
      }

      return hog
    }
    return null
  }

  // Mark feeding as not completed (X button)
  async function markFeedingIncomplete(hogId) {
    try {
      loading.value = true
      const hog = hogs.value.find((h) => h.id === hogId)
      if (!hog) throw new Error('Hog not found')

      const updates = {
        feedingCompleted: false,
        lastFeedingDate: null,
      }

      const updatedHog = await updateHog(hogId, updates)

      if (!updatedHog) throw new Error('Failed to update hog')

      // Log the activity
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await logStaffActivity(user.id, 'hog_feeding_undone', {
          hog_id: hogId,
          hog_code: hog.code,
          feed_date: new Date().toISOString(),
          days: hog.days,
        })
      }

      return updatedHog
    } catch (err) {
      console.error('Error in markFeedingIncomplete:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mark feeding as completed (check button)
  async function markFeedingComplete(hogId) {
    try {
      loading.value = true
      const hog = hogs.value.find((h) => h.id === hogId)
      if (!hog) throw new Error('Hog not found')

      const now = new Date()
      const wasCompleted = hog.feedingCompleted
      const updates = {
        feedingCompleted: true,
        lastFeedingDate: now.toISOString(),
      }

      // Only increment total feeding days if it wasn't already completed
      if (!wasCompleted) {
        updates.totalFeedingDays = (hog.totalFeedingDays || 0) + 1
      }

      // Check if a full day has passed since last day increment
      const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
      const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

      if (daysSinceLastIncrement >= 1) {
        updates.days = (hog.days || 0) + 1
        updates.lastDayIncrement = now.toISOString()
      }

      // Update the database and local state
      const updatedHog = await updateHog(hogId, updates, false) // Don't update timestamp for feeding changes

      if (!updatedHog) throw new Error('Failed to update hog')

      // Log the activity if this is a new feeding
      if (!wasCompleted) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await logStaffActivity(user.id, 'hog_fed', {
            hog_id: hogId,
            hog_code: hog.code,
            feed_date: now.toISOString(),
            days: updates.days || hog.days,
          })
        }
      }

      return updatedHog
    } catch (err) {
      console.error('Error in markFeedingComplete:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a hog from the database
  async function deleteHog(hogId) {
    try {
      loading.value = true

      // Instead of deleting, mark as inactive
      const { error: updateError } = await supabase
        .from('hogs')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', hogId)

      if (updateError) throw updateError

      // Remove from local state
      hogs.value = hogs.value.filter((hog) => hog.id !== hogId)
      return true
    } catch (err) {
      console.error('Error deleting hog:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get hog by ID
  function getHogById(hogId) {
    return hogs.value.find((hog) => hog.id === hogId)
  }

  // Get all hogs, fetching from the database if needed
  async function getAllHogs() {
    if (hogs.value.length === 0) {
      await fetchHogs()
    }
    return hogs.value
  }

  // Get hogs by feeding status
  function getHogsByFeedingStatus(completed) {
    return hogs.value.filter((hog) => hog.feedingCompleted === completed)
  }

  // Get hogs that need feeding (not completed today)
  function getHogsNeedingFeeding() {
    const today = new Date().toDateString()
    return hogs.value.filter((hog) => {
      if (!hog.feedingCompleted) return true
      if (!hog.lastFeedingDate) return true
      return new Date(hog.lastFeedingDate).toDateString() !== today
    })
  }

  // Auto-increment days for all hogs (call this daily)
  function incrementDaysForAllHogs() {
    const now = new Date()
    hogs.value.forEach((hog) => {
      const lastDayIncrement = new Date(hog.lastDayIncrement || hog.createdAt)
      const daysSinceLastIncrement = Math.floor((now - lastDayIncrement) / (1000 * 60 * 60 * 24))

      if (daysSinceLastIncrement >= 1) {
        hog.days += daysSinceLastIncrement
        hog.lastDayIncrement = now.toISOString()
      }
    })
  }

  // Reset all feeding statuses (call this daily to reset for new day)
  async function resetDailyFeedingStatus() {
    const today = new Date().toDateString()
    const toReset = hogs.value.filter(
      (hog) =>
        hog.feedingCompleted &&
        (!hog.lastFeedingDate || new Date(hog.lastFeedingDate).toDateString() !== today),
    )
    if (toReset.length === 0) return
    const ids = toReset.map((h) => h.id)
    const { data, error: updateError } = await supabase
      .from('hogs')
      .update({ feeding_completed: false })
      .in('id', ids)
      .select('id')
    if (!updateError) {
      const resetSet = new Set((data || []).map((d) => d.id))
      hogs.value = hogs.value.map((h) =>
        resetSet.has(h.id) ? { ...h, feedingCompleted: false } : h,
      )
    }
  }

  // Ensure daily reset (checks and applies once per load)
  async function ensureDailyReset() {
    await resetDailyFeedingStatus()
  }

  // Realtime subscription for hogs table with error handling
  function subscribeToRealtime() {
    try {
      const subscription = supabase
        .channel('hogs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hogs',
          },
          (payload) => {
            console.log('Hog change detected:', payload.eventType)

            // Handle different event types
            switch (payload.eventType) {
              case 'INSERT':
                hogs.value = [
                  {
                    id: payload.new.id,
                    code: payload.new.code,
                    weight: payload.new.weight || 0,
                    days: payload.new.days || 0,
                    amFeeding: payload.new.am_feeding || false,
                    pmFeeding: payload.new.pm_feeding || false,
                    feedingCompleted: payload.new.feeding_completed || false,
                    status: payload.new.status || 'active',
                    createdAt: payload.new.created_at,
                    updated_at: payload.new.updated_at,
                    lastFeedingDate: payload.new.last_feeding_date,
                    totalFeedingDays: payload.new.total_feeding_days || 0,
                    lastDayIncrement: payload.new.last_day_increment,
                  },
                  ...hogs.value,
                ]
                break

              case 'UPDATE':
                hogs.value = hogs.value.map((hog) =>
                  hog.id === payload.new.id
                    ? {
                        ...hog,
                        ...payload.new,
                        amFeeding: payload.new.am_feeding || false,
                        pmFeeding: payload.new.pm_feeding || false,
                        feedingCompleted: payload.new.feeding_completed || false,
                        updated_at: payload.new.updated_at,
                      }
                    : hog,
                )
                break

              case 'DELETE':
                hogs.value = hogs.value.filter((hog) => hog.id !== payload.old.id)
                break

              default:
                // For any other event type, just refresh the data
                fetchHogs()
            }
          },
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('Realtime subscription error:', err)
            // Attempt to resubscribe on error
            setTimeout(subscribeToRealtime, 5000)
          } else {
            console.log('Realtime subscription status:', status)
          }
        })

      return () => {
        try {
          supabase.removeChannel(subscription)
        } catch (e) {
          console.error('Error cleaning up subscription:', e)
        }
      }
    } catch (error) {
      console.error('Error setting up realtime subscription:', error)
      // Return a no-op function if subscription fails
      return () => {}
    }
  }

  // Get statistics
  function getStats() {
    const totalHogs = hogs.value.length
    const completedToday = hogs.value.filter((hog) => hog.feedingCompleted).length
    const averageWeight =
      totalHogs > 0 ? hogs.value.reduce((sum, hog) => sum + hog.weight, 0) / totalHogs : 0
    const averageDays =
      totalHogs > 0 ? hogs.value.reduce((sum, hog) => sum + hog.days, 0) / totalHogs : 0

    return {
      totalHogs,
      completedToday,
      pendingFeeding: totalHogs - completedToday,
      averageWeight: Math.round(averageWeight * 10) / 10,
      averageDays: Math.round(averageDays),
    }
  }

  // Create a new record
  async function createRecord(recordData) {
    try {
      // Supabase column `details` may be TEXT in some schemas; normalize to JSON string on write.
      const normalized =
        recordData && typeof recordData === 'object'
          ? {
              ...recordData,
              details:
                recordData.details && typeof recordData.details === 'object'
                  ? JSON.stringify(recordData.details)
                  : recordData.details,
            }
          : recordData

      const { data, error: recordError } = await supabase
        .from('records')
        .insert(normalized)
        .select()
        .single()

      if (recordError) throw recordError
      return data
    } catch (err) {
      console.error('Error creating record:', err)
      error.value = err.message
      throw err
    }
  }

  // Fetch all records
  async function fetchRecords() {
    try {
      loading.value = true
      const { data, error: fetchError } = await supabase
        .from('records')
        .select('*')
        .order('event_date', { ascending: false })

      if (fetchError) throw fetchError

      // Normalize details to an object for UI usage (if stored as JSON string)
      records.value = (data || []).map((row) => {
        if (row && typeof row.details === 'string') {
          try {
            return { ...row, details: JSON.parse(row.details) }
          } catch {
            return row
          }
        }
        return row
      })
      return records.value
    } catch (err) {
      console.error('Error fetching records:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a financial record in the expenses table
  async function createFinancialRecord(recordData) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          income: recordData.amount,
          date: recordData.date || new Date().toISOString(),
          type: recordData.type || 'hog_sale',
          description: recordData.description || 'Hog Sale',
          reference_type: 'records',
          reference_id: recordData.reference_id,
          record_id: recordData.reference_id, // Link back to the original record
          sale_price: recordData.amount,
          total_cost: recordData.amount,
          amount: recordData.quantity || 1,
          label: recordData.label || 'Hog Sale',
          notes: recordData.notes || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating financial record:', err)
      error.value = err.message
      throw err
    }
  }

  // Mark a hog as sold
  async function markAsSold(hogId, saleData) {
    let recordId = null
    try {
      loading.value = true
      const now = new Date().toISOString()
      const eventDate = saleData?.date || now
      const totalPrice = Number(saleData?.price) || 0
      const weightKg = Number(saleData?.weight) || 0
      const pricePerKg = weightKg > 0 ? totalPrice / weightKg : null
      const feedsStore = useFeedsStore()

      // Update hog status
      const { error: updateError } = await supabase
        .from('hogs')
        .update({
          status: 'sold',
          sold_date: eventDate,
          sale_price: totalPrice,
          updated_at: now,
        })
        .eq('id', hogId)

      if (updateError) throw updateError

      // Create sale record
      const record = await createRecord({
        hog_id: hogId,
        record_type: 'sale',
        event_date: eventDate,
        // Persist to dedicated columns (records table schema)
        sale_price: totalPrice,
        total_cost: totalPrice,
        // Store weight in standard amount/unit fields so UI + analytics can use it
        amount: weightKg,
        unit: 'kg',
        cost_per_unit: pricePerKg,
        details: {
          sale_price: totalPrice,
          weight: weightKg,
          buyer: saleData?.buyer || null,
          notes: saleData?.notes || null,
        },
      })

      // Save the record ID for the financial record
      recordId = record.id

      // Record the sale as income in the expenses table
      if (totalPrice > 0) {
        try {
          const buyer = saleData?.buyer || 'Unknown Buyer'
          const pricePerKilo =
            saleData?.price_per_kilo || (weightKg > 0 ? totalPrice / weightKg : 0)

          // Create the income record data
          const incomeData = {
            label: `Hog Sale - ${buyer}`,
            amount: totalPrice,
            date: eventDate,
            type: 'income',
            reference_id: recordId,
            reference_type: 'hog_sale',
            notes: `Sale of hog ${hogId} (${weightKg}kg × ₱${pricePerKilo.toFixed(2)}/kg) to ${buyer}${saleData?.notes ? ' - ' + saleData.notes : ''}`,
            details: {
              hog_id: hogId,
              weight_kg: weightKg,
              price_per_kg: pricePerKilo,
              buyer: buyer,
              sale_date: eventDate,
            },
          }

          console.log('Adding income record:', incomeData)

          // Add the income record
          const result = await feedsStore.addIncome(incomeData)
          console.log('Income record added successfully:', result)

          // Also create a financial record for consistency
          await createFinancialRecord({
            amount: totalPrice,
            date: eventDate,
            type: 'hog_sale',
            description: `Sale of hog ${hogId} (${weightKg}kg) to ${buyer}`,
            reference_id: recordId,
            reference_type: 'hog_sale',
            label: `Hog Sale - ${buyer}`,
            notes: saleData?.notes || null,
            quantity: 1,
            details: {
              weight_kg: weightKg,
              price_per_kg: pricePerKilo,
              total_price: totalPrice,
            },
          })

          // Force refresh the expenses data to ensure UI is updated
          await feedsStore.fetchExpenses()
          console.log('Refreshed expenses data. Current income count:', feedsStore.income.length)
        } catch (err) {
          console.error('Error adding income record:', err)
          // Don't rethrow the error to prevent the entire operation from failing
          // Just log it and continue
        }
      }
      return true
    } catch (err) {
      console.error('Error marking hog as sold:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mark a hog as deceased
  async function markAsDeceased(hogId, deathData) {
    try {
      loading.value = true
      const now = new Date().toISOString()

      // Update hog status
      const { error: updateError } = await supabase
        .from('hogs')
        .update({
          status: 'deceased',
          deceased_date: deathData.dateOfDeath || now,
          updated_at: now,
        })
        .eq('id', hogId)

      if (updateError) throw updateError

      // Create death record
      await createRecord({
        hog_id: hogId,
        record_type: 'death',
        event_date: deathData.dateOfDeath || now,
        details: {
          cause_of_death: deathData.cause,
          weight: deathData.weight,
          notes: deathData.notes || null,
        },
      })

      // Refresh hogs list
      await fetchHogs('active')
      return true
    } catch (err) {
      console.error('Error marking hog as deceased:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    hogs,
    records,
    createFinancialRecord,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    updateFeedingStatus,
    setFeedingTime,
    addHog,
    updateHog,
    updateHogWeight,
    toggleFeedingStatus,
    markFeedingIncomplete,
    markFeedingComplete,
    deleteHog,
    getHogById,
    getAllHogs: () => fetchHogs('all'), // Modified to fetch all statuses
    getHogsByFeedingStatus,
    getHogsNeedingFeeding,
    incrementDaysForAllHogs,
    resetDailyFeedingStatus,
    ensureDailyReset,
    subscribeToRealtime,
    getStats,
    fetchHogs,
    createRecord,
    fetchRecords,
    markAsSold,
    markAsDeceased,
  }
})
