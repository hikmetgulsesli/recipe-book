import { Router } from 'express'
import { getDb } from '../db/database.js'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js'
import type { Ingredient } from '../types/index.js'

const router = Router()

// GET /api/ingredients - List all ingredients with optional search
router.get('/', (req, res, next) => {
  try {
    const db = getDb()
    const search = req.query.search as string | undefined
    
    let query = 'SELECT * FROM ingredients'
    const params: (string | number)[] = []
    
    if (search && search.trim()) {
      query += ' WHERE name LIKE ?'
      params.push(`%${search.trim()}%`)
    }
    
    query += ' ORDER BY name'
    
    const ingredients = db.prepare(query).all(...params) as Ingredient[]
    
    res.status(200).json({
      data: ingredients,
      meta: {
        total: ingredients.length,
        ...(search && { search: search.trim() })
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/ingredients/:id - Get single ingredient
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb()
    const ingredientId = parseInt(req.params.id, 10)
    
    if (isNaN(ingredientId)) {
      throw new ValidationError('Invalid ingredient ID', [{ field: 'id', message: 'ID must be a number' }])
    }
    
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId) as Ingredient | undefined
    
    if (!ingredient) {
      throw new NotFoundError('Ingredient', ingredientId)
    }
    
    res.status(200).json({
      data: ingredient
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/ingredients - Create new ingredient
router.post('/', (req, res, next) => {
  try {
    const db = getDb()
    const { name, unit } = req.body
    
    // Validation
    const errors: Array<{ field: string; message: string }> = []
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' })
    }
    
    if (name && name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
    }
    
    const validUnits = ['g', 'ml', 'piece', 'tbsp', 'tsp', 'cup', 'pinch']
    if (unit !== undefined && !validUnits.includes(unit)) {
      errors.push({ field: 'unit', message: `Unit must be one of: ${validUnits.join(', ')}` })
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
    
    // Check for duplicate name
    const existingIngredient = db.prepare('SELECT * FROM ingredients WHERE LOWER(name) = LOWER(?)').get(name.trim()) as Ingredient | undefined
    if (existingIngredient) {
      throw new ConflictError(`Ingredient with name "${name.trim()}" already exists`)
    }
    
    // Insert ingredient
    const insertIngredient = db.prepare(`
      INSERT INTO ingredients (name, unit) VALUES (?, ?)
    `)
    
    const result = insertIngredient.run(name.trim(), unit || 'piece')
    const ingredientId = result.lastInsertRowid as number
    
    // Fetch the created ingredient
    const createdIngredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId) as Ingredient
    
    res.status(201).json({
      data: createdIngredient
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/ingredients/:id - Update ingredient
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb()
    const ingredientId = parseInt(req.params.id, 10)
    const { name, unit } = req.body
    
    if (isNaN(ingredientId)) {
      throw new ValidationError('Invalid ingredient ID', [{ field: 'id', message: 'ID must be a number' }])
    }
    
    // Check if ingredient exists
    const existingIngredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId) as Ingredient | undefined
    
    if (!existingIngredient) {
      throw new NotFoundError('Ingredient', ingredientId)
    }
    
    // Validation
    const errors: Array<{ field: string; message: string }> = []
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Name cannot be empty' })
      } else if (name.trim().length > 100) {
        errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
      }
    }
    
    const validUnits = ['g', 'ml', 'piece', 'tbsp', 'tsp', 'cup', 'pinch']
    if (unit !== undefined && !validUnits.includes(unit)) {
      errors.push({ field: 'unit', message: `Unit must be one of: ${validUnits.join(', ')}` })
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
    
    // Check for duplicate name (if name is being changed)
    if (name !== undefined && name.trim().toLowerCase() !== existingIngredient.name.toLowerCase()) {
      const duplicateIngredient = db.prepare('SELECT * FROM ingredients WHERE LOWER(name) = LOWER(?) AND id != ?').get(name.trim(), ingredientId) as Ingredient | undefined
      if (duplicateIngredient) {
        throw new ConflictError(`Ingredient with name "${name.trim()}" already exists`)
      }
    }
    
    // Build update query dynamically
    const updates: string[] = []
    const values: (string | null)[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name.trim())
    }
    
    if (unit !== undefined) {
      updates.push('unit = ?')
      values.push(unit)
    }
    
    if (updates.length > 0) {
      const updateQuery = `UPDATE ingredients SET ${updates.join(', ')} WHERE id = ?`
      values.push(String(ingredientId))
      db.prepare(updateQuery).run(...values)
    }
    
    // Fetch the updated ingredient
    const updatedIngredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId) as Ingredient
    
    res.status(200).json({
      data: updatedIngredient
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/ingredients/:id - Delete ingredient (if not used in recipes)
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb()
    const ingredientId = parseInt(req.params.id, 10)
    
    if (isNaN(ingredientId)) {
      throw new ValidationError('Invalid ingredient ID', [{ field: 'id', message: 'ID must be a number' }])
    }
    
    // Check if ingredient exists
    const existingIngredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId) as Ingredient | undefined
    
    if (!existingIngredient) {
      throw new NotFoundError('Ingredient', ingredientId)
    }
    
    // Check if ingredient is used in any recipes
    const usageCount = db.prepare('SELECT COUNT(*) as count FROM recipe_ingredients WHERE ingredient_id = ?').get(ingredientId) as { count: number }
    
    if (usageCount.count > 0) {
      throw new ConflictError(`Cannot delete ingredient: it is used in ${usageCount.count} recipe(s)`)
    }
    
    // Delete ingredient
    db.prepare('DELETE FROM ingredients WHERE id = ?').run(ingredientId)
    
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
