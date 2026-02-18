export interface Recipe {
  id: number
  name: string
  description: string
  instructions: string
  prep_time: number // in minutes
  cook_time: number // in minutes
  servings: number
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: number
  name: string
  unit: 'g' | 'ml' | 'piece' | 'tbsp' | 'tsp' | 'cup' | 'pinch'
  created_at: string
}

export interface RecipeIngredient {
  id: number
  recipe_id: number
  ingredient_id: number
  quantity: number
}

// Combined type for fetching a recipe with its ingredients
export interface RecipeWithIngredients extends Recipe {
  ingredients: Array<{
    id: number
    name: string
    unit: string
    quantity: number
  }>
}
