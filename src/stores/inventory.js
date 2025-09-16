import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const ingredients = ref([
    {
      id: '1',
      name: 'Corn',
      quantity: 50,
      cost: 12.5,
      unit: 'kg',
      type: 'carbs',
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Soybean Meal',
      quantity: 25,
      cost: 18.75,
      unit: 'kg',
      type: 'protein',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Wheat Bran',
      quantity: 0,
      cost: 8.25,
      unit: 'kg',
      type: 'carbs',
      isAvailable: false,
    },
    {
      id: '4',
      name: 'Fish Meal',
      quantity: 15,
      cost: 35.0,
      unit: 'kg',
      type: 'protein',
      isAvailable: true,
    },
    {
      id: '5',
      name: 'Salt',
      quantity: 5,
      cost: 2.5,
      unit: 'kg',
      type: 'minerals',
      isAvailable: true,
    },
    {
      id: '6',
      name: 'Vitamins',
      quantity: 0,
      cost: 45.0,
      unit: 'kg',
      type: 'vitamins',
      isAvailable: false,
    },
    // Feed calculator ingredients
    {
      id: '7',
      name: 'Banana Peels',
      quantity: 20,
      cost: 8.0,
      unit: 'kg',
      type: 'carbs',
      isAvailable: true,
    },
    {
      id: '8',
      name: 'Rice Bran D2',
      quantity: 30,
      cost: 15.5,
      unit: 'kg',
      type: 'carbs',
      isAvailable: true,
    },
    {
      id: '9',
      name: 'Ramie',
      quantity: 25,
      cost: 12.0,
      unit: 'kg',
      type: 'protein',
      isAvailable: true,
    },
    {
      id: '10',
      name: 'Cadamba',
      quantity: 15,
      cost: 18.0,
      unit: 'kg',
      type: 'protein',
      isAvailable: true,
    },
    {
      id: '11',
      name: 'Copra Meal',
      quantity: 40,
      cost: 22.5,
      unit: 'kg',
      type: 'protein',
      isAvailable: true,
    },
    {
      id: '12',
      name: 'Molasses',
      quantity: 10,
      cost: 25.0,
      unit: 'kg',
      type: 'vitamins',
      isAvailable: true,
    },
    {
      id: '13',
      name: 'Herbal Concoctions',
      quantity: 5,
      cost: 35.0,
      unit: 'kg',
      type: 'vitamins',
      isAvailable: true,
    },
    {
      id: '14',
      name: 'Premix Animal Vita',
      quantity: 8,
      cost: 45.0,
      unit: 'kg',
      type: 'vitamins',
      isAvailable: true,
    },
    {
      id: '15',
      name: 'Cececal',
      quantity: 3,
      cost: 30.0,
      unit: 'kg',
      type: 'vitamins',
      isAvailable: true,
    },
    {
      id: '16',
      name: 'Carbonised Rice Hull',
      quantity: 12,
      cost: 10.0,
      unit: 'kg',
      type: 'minerals',
      isAvailable: true,
    },
  ])

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
  function addIngredient(ingredientData) {
    const newIngredient = {
      id: crypto.randomUUID?.() || String(Date.now()),
      quantity: Number(ingredientData.quantity) || 0,
      cost: Number(ingredientData.cost) || 0,
      unit: ingredientData.unit || 'kg',
      type: ingredientData.type || 'carbs', // Default to carbs if not specified
      isAvailable: (Number(ingredientData.quantity) || 0) > 0,
      ...ingredientData,
    }
    ingredients.value.unshift(newIngredient)
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
  }
})
