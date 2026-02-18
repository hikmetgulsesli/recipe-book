import { Router } from 'express'
import { getDb } from '../db/database.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'
import type { Recipe, RecipeWithIngredients } from '../types/index.js'

const router = Router()

// GET /api/recipes - List all recipes with ingredient count
router.get('/', (_req, res, next) => {
  try {
    const db = getDb()
    
    const recipes = db.prepare(`
      SELECT 
        r.*,
        COUNT(ri.id) as ingredient_count
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).all() as Array<Recipe & { ingredient_count: number }>
    
    res.status(200).json({
      data: recipes,
      meta: {
        total: recipes.length
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/recipes/:id - Get single recipe with full ingredient details
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb()
    const recipeId = parseInt(req.params.id, 10)
    
    if (isNaN(recipeId)) {
      throw new ValidationError('Invalid recipe ID', [{ field: 'id', message: 'ID must be a number' }])
    }
    
    // Get recipe
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId) as Recipe | undefined
    
    if (!recipe) {
      throw new NotFoundError('Recipe', recipeId)
    }
    
    // Get ingredients
    const ingredients = db.prepare(`
      SELECT i.id, i.name, i.unit, ri.quantity
      FROM ingredients i
      JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = ?
    `).all(recipeId) as Array<{ id: number; name: string; unit: string; quantity: number }>
    
    const recipeWithIngredients: RecipeWithIngredients = {
      ...recipe,
      ingredients
    }
    
    res.status(200).json({
      data: recipeWithIngredients
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/recipes - Create new recipe with ingredients
router.post('/', (req, res, next) => {
  try {
    const db = getDb()
    const { name, description, instructions, prep_time, cook_time, servings, ingredients } = req.body
    
    // Validation
    const errors: Array<{ field: string; message: string }> = []
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' })
    }
    
    if (!instructions || typeof instructions !== 'string' || instructions.trim().length === 0) {
      errors.push({ field: 'instructions', message: 'Instructions are required' })
    }
    
    if (prep_time !== undefined && (typeof prep_time !== 'number' || prep_time < 0)) {
      errors.push({ field: 'prep_time', message: 'Prep time must be a non-negative number' })
    }
    
    if (cook_time !== undefined && (typeof cook_time !== 'number' || cook_time < 0)) {
      errors.push({ field: 'cook_time', message: 'Cook time must be a non-negative number' })
    }
    
    if (servings !== undefined && (typeof servings !== 'number' || servings < 1)) {
      errors.push({ field: 'servings', message: 'Servings must be at least 1' })
    }
    
    if (ingredients && !Array.isArray(ingredients)) {
      errors.push({ field: 'ingredients', message: 'Ingredients must be an array' })
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
    
    // Insert recipe
    const insertRecipe = db.prepare(`
      INSERT INTO recipes (name, description, instructions, prep_time, cook_time, servings)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const result = insertRecipe.run(
      name.trim(),
      description?.trim() || null,
      instructions.trim(),
      prep_time || 0,
      cook_time || 0,
      servings || 1
    )
    
    const recipeId = result.lastInsertRowid as number
    
    // Insert ingredients if provided
    if (ingredients && ingredients.length > 0) {
      const insertRecipeIngredient = db.prepare(`
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
        VALUES (?, ?, ?)
      `)
      
      for (const ing of ingredients) {
        if (ing.ingredient_id && typeof ing.quantity === 'number') {
          insertRecipeIngredient.run(recipeId, ing.ingredient_id, ing.quantity)
        }
      }
    }
    
    // Fetch the created recipe with ingredients
    const createdRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId) as Recipe
    const createdIngredients = db.prepare(`
      SELECT i.id, i.name, i.unit, ri.quantity
      FROM ingredients i
      JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = ?
    `).all(recipeId) as Array<{ id: number; name: string; unit: string; quantity: number }>
    
    const recipeWithIngredients: RecipeWithIngredients = {
      ...createdRecipe,
      ingredients: createdIngredients
    }
    
    res.status(201).json({
      data: recipeWithIngredients
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/recipes/:id - Update recipe and ingredients
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb()
    const recipeId = parseInt(req.params.id, 10)
    const { name, description, instructions, prep_time, cook_time, servings, ingredients } = req.body
    
    if (isNaN(recipeId)) {
      throw new ValidationError('Invalid recipe ID', [{ field: 'id', message: 'ID must be a number' }])
    }
    
    // Check if recipe exists
    const existingRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId) as Recipe | undefined
    
    if (!existingRecipe) {
      throw new NotFoundError('Recipe', recipeId)
    }
    
    // Validation
    const errors: Array<{ field: string; message: string }> = []
    
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      errors.push({ field: 'name', message: 'Name cannot be empty' })
    }
    
    if (instructions !== undefined && (typeof instructions !== 'string' || instructions.trim().length === 0)) {
      errors.push({ field: 'instructions', message: 'Instructions cannot be empty' })
    }
    
    if (prep_time !== undefined && (typeof prep_time !== 'number' || prep_time < 0)) {
      errors.push({ field: 'prep_time', message: 'Prep time must be a non-negative number' })
    }
    
    if (cook_time !== undefined && (typeof cook_time !== 'number' || cook_time < 0)) {
      errors.push({ field: 'cook_time', message: 'Cook time must be a non-negative number' })
    }
    
    if (servings !== undefined && (typeof servings !== 'number' || servings < 1)) {
      errors.push({ field: 'servings', message: 'Servings must be at least 1' })
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
    
    // Build update query dynamically
    const updates: string[] = []
    const values: (string | number | null)[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name.trim())
    }
    
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description?.trim() || null)
    }
    
    if (instructions !== undefined) {
      updates.push('instructions = ?')
      values.push(instructions.trim())
    }
    
    if (prep_time !== undefined) {
      updates.push('prep_time = ?')
      values.push(prep_time)
    }
    
    if (cook_time !== undefined) {
      updates.push('cook_time = ?')
      values.push(cook_time)
    }
    
    if (servings !== undefined) {
      updates.push('servings = ?')
      values.push(servings)
    }
    
    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP')
    
    if (updates.length > 0) {
      const updateQuery = `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`
      values.push(recipeId)
      db.prepare(updateQuery).run(...values)
    }
    
    // Update ingredients if provided
    if (ingredients !== undefined && Array.isArray(ingredients)) {
      // Remove existing ingredients
      db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(recipeId)
      
      // Insert new ingredients
      if (ingredients.length > 0) {
        const insertRecipeIngredient = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
          VALUES (?, ?, ?)
        `)
        
        for (const ing of ingredients) {
          if (ing.ingredient_id && typeof ing.quantity === 'number') {
            insertRecipeIngredient.run(recipeId, ing.ingredient_id, ing.quantity)
          }
        }
      }
    }
    
    // Fetch the updated recipe with ingredients
    const updatedRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId) as Recipe
    const updatedIngredients = db.prepare(`
      SELECT i.id, i.name, i.unit, ri.quantity
      FROM ingredients i
      JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = ?
    `).all(recipeId) as Array<{ id: number; name: string; unit: string; quantity: number }>
    
    const recipeWithIngredients: RecipeWithIngredients = {
      ...updatedRecipe,
      ingredients: updatedIngredients
    }
    
    res.status(200).json({
      data: recipeWithIngredients
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/recipes/:id - Delete recipe and related ingredients
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb()
    const recipeId = parseInt(req.params.id, 10)
    
    if (isNaN(recipeId)) {
      throw new ValidationError('Invalid recipe ID', [{ field: 'id', message: 'ID must be a number' }])
    }
    
    // Check if recipe exists
    const existingRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId) as Recipe | undefined
    
    if (!existingRecipe) {
      throw new NotFoundError('Recipe', recipeId)
    }
    
    // Delete recipe (junction records will be deleted via CASCADE)
    db.prepare('DELETE FROM recipes WHERE id = ?').run(recipeId)
    
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
