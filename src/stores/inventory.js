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
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Soybean Meal',
      quantity: 25,
      cost: 18.75,
      unit: 'kg',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Wheat Bran',
      quantity: 0,
      cost: 8.25,
      unit: 'kg',
      isAvailable: false,
    },
    {
      id: '4',
      name: 'Fish Meal',
      quantity: 15,
      cost: 35.0,
      unit: 'kg',
      isAvailable: true,
    },
    {
      id: '5',
      name: 'Salt',
      quantity: 5,
      cost: 2.5,
      unit: 'kg',
      isAvailable: true,
    },
    {
      id: '6',
      name: 'Vitamins',
      quantity: 0,
      cost: 45.0,
      unit: 'kg',
      isAvailable: false,
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
        isAvailable: (Number(updates.quantity) || ingredients.value[index].quantity) > 0,
      }
      ingredients.value[index] = updatedIngredient
    }
  }

  function deleteIngredient(id) {
    const index = ingredients.value.findIndex((ingredient) => ingredient.id === id)
    if (index !== -1) {
      ingredients.value.splice(index, 1)
    }
  }

  function updateQuantity(id, newQuantity) {
    const ingredient = ingredients.value.find((ingredient) => ingredient.id === id)
    if (ingredient) {
      ingredient.quantity = Number(newQuantity) || 0
      ingredient.isAvailable = ingredient.quantity > 0
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
  }
})
