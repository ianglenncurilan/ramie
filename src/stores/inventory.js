import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useInventoryStore = defineStore('inventory', () => {
  const ingredients = ref([])

  // Computed properties
  const availableIngredients = computed(() =>
    ingredients.value.filter((ingredient) => ingredient.isAvailable),
  )

  const unavailableIngredients = computed(() =>
    ingredients.value.filter((ingredient) => !ingredient.isAvailable),
  )

  const totalValue = computed(() =>
    ingredients.value.reduce(
      (total, ingredient) => total + ingredient.quantity * ingredient.cost,
      0,
    ),
  )

  // Actions
  async function fetchIngredients() {
    try {
      const { data, error } = await supabase.from('inventory').select('*')
      if (error) throw error
      
      // Ensure isAvailable is set based on quantity
      ingredients.value = data.map(item => ({
        ...item,
        isAvailable: (item.quantity || 0) > 0
      }))
      
      console.log('Fetched ingredients:', ingredients.value)
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    }
  }

  async function addIngredient(formData) {
    return await supabase.from('inventory').insert(formData).select()
  }

  function updateIngredient(id, updates) {
    const index = ingredients.value.findIndex((ingredient) => ingredient.id === id)
    if (index !== -1) {
      const updatedIngredient = {
        ...ingredients.value[index],
        ...updates,
        quantity: Number(updates.quantity) || ingredients.value[index].quantity,
        cost: Number(updates.cost) || ingredients.value[index].cost,
        type: updates.type || ingredients.value[index].type,
        isAvailable: (Number(updates.quantity) || ingredients.value[index].quantity) > 0,
      }
      ingredients.value[index] = updatedIngredient
    }
  }

  function deleteIngredient(id) {
    console.log('Store deleteIngredient called with ID:', id)
    console.log('Ingredients before delete:', ingredients.value.length)

    const index = ingredients.value.findIndex((ingredient) => ingredient.id === id)
    console.log('Found ingredient at index:', index)

    if (index !== -1) {
      console.log('Deleting ingredient:', ingredients.value[index].name)
      // Create a new array to ensure reactivity
      ingredients.value = ingredients.value.filter((ingredient) => ingredient.id !== id)
      console.log('Ingredients after delete:', ingredients.value.length)
    } else {
      console.log('Ingredient not found!')
    }
  }

  function updateQuantity(id, newQuantity) {
    const numericQuantity = Number(newQuantity) || 0
    const ingredientIndex = ingredients.value.findIndex(ing => ing.id === id)
    
    if (ingredientIndex !== -1) {
      const updatedIngredient = {
        ...ingredients.value[ingredientIndex],
        quantity: numericQuantity,
        isAvailable: numericQuantity > 0,
        updated_at: new Date().toISOString()
      }
      
      // Update in the array to trigger reactivity
      ingredients.value[ingredientIndex] = updatedIngredient
      
      // Update in the database
      supabase
        .from('inventory')
        .update({
          quantity: numericQuantity,
          is_available: numericQuantity > 0,
          updated_at: updatedIngredient.updated_at
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating quantity in database:', error)
            // Revert the local change if database update fails
            ingredients.value[ingredientIndex] = {
              ...ingredients.value[ingredientIndex],
              quantity: ingredients.value[ingredientIndex].quantity,
              isAvailable: ingredients.value[ingredientIndex].isAvailable
            }
          }
        })
    }
  }

  async function deductIngredientQuantity(ingredientName, amountKg) {
    try {
      // Clean the ingredient name for better matching
      const cleanName = ingredientName
        .toLowerCase()
        .replace(/\([^)]*\)/g, '') // Remove parentheses content
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()

      // Find ingredient by name with improved matching
      const ingredientIndex = ingredients.value.findIndex((item) => {
        const itemName = item.name.toLowerCase()
        return (
          itemName === cleanName ||
          itemName.includes(cleanName) ||
          cleanName.includes(itemName) ||
          // Handle specific mappings
          (cleanName.includes('banana') && itemName.includes('banana')) ||
          (cleanName.includes('rice bran') && itemName.includes('rice bran')) ||
          (cleanName.includes('ramie') && itemName.includes('ramie')) ||
          (cleanName.includes('cadamba') && itemName.includes('cadamba')) ||
          (cleanName.includes('copra') && itemName.includes('copra')) ||
          (cleanName.includes('molasses') && itemName.includes('molasses')) ||
          (cleanName.includes('herbal') && itemName.includes('herbal')) ||
          (cleanName.includes('premix') && itemName.includes('premix')) ||
          (cleanName.includes('cececal') && itemName.includes('cececal')) ||
          (cleanName.includes('salt') && itemName.includes('salt')) ||
          (cleanName.includes('rice hull') && itemName.includes('rice hull')) ||
          (cleanName.includes('water') && itemName.includes('water'))
        )
      })

      if (ingredientIndex === -1) {
        console.warn(`Ingredient not found: ${ingredientName}`)
        return { success: false, ingredient: ingredientName, deducted: 0, error: 'Ingredient not found' }
      }

      const ingredient = ingredients.value[ingredientIndex]
      const currentQuantity = Number(ingredient.quantity) || 0
      const amountToDeduct = Number(amountKg) || 0
      
      if (isNaN(amountToDeduct) || amountToDeduct <= 0) {
        console.warn(`Invalid amount to deduct: ${amountKg}`)
        return { success: false, ingredient: ingredient.name, deducted: 0, error: 'Invalid amount' }
      }

      if (currentQuantity < amountToDeduct) {
        console.warn(`Insufficient quantity for ${ingredient.name}. Available: ${currentQuantity}, Needed: ${amountToDeduct}`)
        return { 
          success: false, 
          ingredient: ingredient.name, 
          deducted: 0, 
          error: `Insufficient quantity. Available: ${currentQuantity} ${ingredient.unit || 'kg'}` 
        }
      }

      const newQuantity = currentQuantity - amountToDeduct
      const isAvailable = newQuantity > 0
      
      // Update local state immediately for better UX
      ingredients.value[ingredientIndex] = {
        ...ingredient,
        quantity: newQuantity,
        isAvailable,
        updated_at: new Date().toISOString()
      }

      // Update the database
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          is_available: isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', ingredient.id)

      if (error) {
        console.error('Error updating inventory in database:', error)
        // Revert local changes if database update fails
        ingredients.value[ingredientIndex] = {
          ...ingredients.value[ingredientIndex],
          quantity: currentQuantity,
          isAvailable: currentQuantity > 0
        }
        return { 
          success: false, 
          ingredient: ingredient.name, 
          deducted: 0, 
          error: 'Failed to update database' 
        }
      }

      console.log(`Successfully deducted ${amountToDeduct}kg of ${ingredient.name}. New quantity: ${newQuantity}kg`)
      return { 
        success: true, 
        ingredient: ingredient.name, 
        deducted: amountToDeduct, 
        remaining: newQuantity 
      }
      
    } catch (error) {
      console.error('Error in deductIngredientQuantity:', error)
      return { 
        success: false, 
        ingredient: ingredientName, 
        deducted: 0, 
        error: error.message || 'An unexpected error occurred' 
      }
    }
  }

  return {
    ingredients,
    availableIngredients,
    unavailableIngredients,
    totalValue,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    updateQuantity,
    deductIngredientQuantity,
    fetchIngredients,
  }
})
