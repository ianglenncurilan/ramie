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
    const { data, error } = await supabase.from('inventory').select('*')
    if (data) ingredients.value = data
    if (error) console.log('Error fetching ingredients')
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
    const ingredient = ingredients.value.find((ingredient) => ingredient.id === id)
    if (ingredient) {
      ingredient.quantity = Number(newQuantity) || 0
      ingredient.isAvailable = ingredient.quantity > 0
    }
  }

  function deductIngredientQuantity(ingredientName, amountKg) {
    // Clean the ingredient name for better matching
    const cleanName = ingredientName
      .toLowerCase()
      .replace(/\([^)]*\)/g, '') // Remove parentheses content
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()

    // Find ingredient by name with improved matching
    const ingredient = ingredients.value.find((item) => {
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

    if (ingredient) {
      const currentQuantity = Number(ingredient.quantity) || 0
      const newQuantity = Math.max(0, currentQuantity - Number(amountKg))
      ingredient.quantity = newQuantity
      ingredient.isAvailable = newQuantity > 0
      return { success: true, ingredient: ingredient.name, deducted: Number(amountKg) }
    }
    return { success: false, ingredient: ingredientName, deducted: 0 }
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
