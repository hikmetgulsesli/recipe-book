import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createServer } from '../api/server.js'
import { initDatabase, seedDatabase, closeDb } from '../db/database.js'
import fs from 'fs'

const TEST_DB_PATH = './test-ingredients-recipe-book.db'

// Set test database path
process.env.DATABASE_URL = TEST_DB_PATH

describe('Ingredient API Endpoints', () => {
  let app: ReturnType<typeof createServer>

  beforeAll(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  afterAll(() => {
    closeDb()
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  beforeEach(() => {
    closeDb()
    // Clean up test database before each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    initDatabase()
    seedDatabase()
    app = createServer()
  })

  describe('GET /api/ingredients', () => {
    it('should return array of all ingredients', async () => {
      const response = await request(app)
        .get('/api/ingredients')
        .expect(200)
      
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      
      // Check ingredient structure
      const ingredient = response.body.data[0]
      expect(ingredient).toHaveProperty('id')
      expect(ingredient).toHaveProperty('name')
      expect(ingredient).toHaveProperty('unit')
      expect(ingredient).toHaveProperty('created_at')
      
      // Check meta
      expect(response.body.meta).toBeDefined()
      expect(response.body.meta.total).toBeGreaterThan(0)
    })

    it('should return ingredients ordered by name', async () => {
      const response = await request(app)
        .get('/api/ingredients')
        .expect(200)
      
      const ingredients = response.body.data
      // Verify ascending alphabetical order
      for (let i = 0; i < ingredients.length - 1; i++) {
        expect(ingredients[i].name.localeCompare(ingredients[i + 1].name)).toBeLessThanOrEqual(0)
      }
    })

    it('should filter ingredients by search query', async () => {
      const response = await request(app)
        .get('/api/ingredients?search=tomato')
        .expect(200)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].name.toLowerCase()).toContain('tomato')
      expect(response.body.meta.search).toBe('tomato')
    })

    it('should return empty array for non-matching search', async () => {
      const response = await request(app)
        .get('/api/ingredients?search=xyznonexistent')
        .expect(200)
      
      expect(response.body.data).toEqual([])
      expect(response.body.meta.total).toBe(0)
    })

    it('should handle search with special characters', async () => {
      const response = await request(app)
        .get('/api/ingredients?search=olive%20oil')
        .expect(200)
      
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].name.toLowerCase()).toContain('olive')
    })
  })

  describe('GET /api/ingredients/:id', () => {
    it('should return single ingredient', async () => {
      // First get all ingredients to find a valid ID
      const listResponse = await request(app).get('/api/ingredients')
      const ingredientId = listResponse.body.data[0].id
      
      const response = await request(app)
        .get(`/api/ingredients/${ingredientId}`)
        .expect(200)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(ingredientId)
      expect(response.body.data.name).toBeDefined()
      expect(response.body.data.unit).toBeDefined()
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .get('/api/ingredients/99999')
        .expect(404)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid ingredient ID', async () => {
      const response = await request(app)
        .get('/api/ingredients/invalid')
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/ingredients', () => {
    it('should create new ingredient and return created record', async () => {
      const newIngredient = {
        name: 'Test Ingredient XYZ',
        unit: 'g'
      }
      
      const response = await request(app)
        .post('/api/ingredients')
        .send(newIngredient)
        .expect(201)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.name).toBe(newIngredient.name)
      expect(response.body.data.unit).toBe(newIngredient.unit)
      expect(response.body.data.created_at).toBeDefined()
    })

    it('should create ingredient with default unit', async () => {
      const newIngredient = {
        name: 'Another Test Ingredient ABC'
      }
      
      const response = await request(app)
        .post('/api/ingredients')
        .send(newIngredient)
        .expect(201)
      
      expect(response.body.data.unit).toBe('piece')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ unit: 'g' })
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toBeDefined()
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: '   ' })
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid unit', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Test Invalid Unit', unit: 'invalid' })
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 409 for duplicate ingredient name', async () => {
      // First create an ingredient
      await request(app)
        .post('/api/ingredients')
        .send({ name: 'Unique Ingredient XYZ', unit: 'g' })
        .expect(201)
      
      // Try to create another with the same name
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: 'unique ingredient xyz', unit: 'ml' }) // Different case
        .expect(409)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('CONFLICT')
    })

    it('should return 400 for name too long', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: 'a'.repeat(101) })
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /api/ingredients/:id', () => {
    it('should update ingredient name', async () => {
      // First create an ingredient with unique name
      const createResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Original Name XYZ', unit: 'g' })
        .expect(201)
      
      const ingredientId = createResponse.body.data.id
      
      // Update it
      const response = await request(app)
        .put(`/api/ingredients/${ingredientId}`)
        .send({ name: 'Updated Name XYZ' })
        .expect(200)
      
      expect(response.body.data.name).toBe('Updated Name XYZ')
      expect(response.body.data.unit).toBe('g') // Unchanged
    })

    it('should update ingredient unit', async () => {
      // First create an ingredient with unique name
      const createResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Test Ingredient Unit Update', unit: 'g' })
        .expect(201)
      
      const ingredientId = createResponse.body.data.id
      
      // Update it
      const response = await request(app)
        .put(`/api/ingredients/${ingredientId}`)
        .send({ unit: 'ml' })
        .expect(200)
      
      expect(response.body.data.unit).toBe('ml')
      expect(response.body.data.name).toBe('Test Ingredient Unit Update') // Unchanged
    })

    it('should update both name and unit', async () => {
      // First create an ingredient with unique name
      const createResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Old Name ABC', unit: 'g' })
        .expect(201)
      
      const ingredientId = createResponse.body.data.id
      
      // Update it
      const response = await request(app)
        .put(`/api/ingredients/${ingredientId}`)
        .send({ name: 'New Name ABC', unit: 'cup' })
        .expect(200)
      
      expect(response.body.data.name).toBe('New Name ABC')
      expect(response.body.data.unit).toBe('cup')
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .put('/api/ingredients/99999')
        .send({ name: 'Updated' })
        .expect(404)
      
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid ingredient ID', async () => {
      const response = await request(app)
        .put('/api/ingredients/invalid')
        .send({ name: 'Updated' })
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty name', async () => {
      // First create an ingredient with unique name
      const createResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Test Empty Name', unit: 'g' })
        .expect(201)
      
      const ingredientId = createResponse.body.data.id
      
      const response = await request(app)
        .put(`/api/ingredients/${ingredientId}`)
        .send({ name: '' })
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid unit', async () => {
      // First create an ingredient with unique name
      const createResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Test Invalid Unit Update', unit: 'g' })
        .expect(201)
      
      const ingredientId = createResponse.body.data.id
      
      const response = await request(app)
        .put(`/api/ingredients/${ingredientId}`)
        .send({ unit: 'invalid' })
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 409 for duplicate name', async () => {
      // Create two ingredients with unique names
      await request(app)
        .post('/api/ingredients')
        .send({ name: 'First Ingredient ABC', unit: 'g' })
        .expect(201)
      
      const secondResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Second Ingredient ABC', unit: 'ml' })
        .expect(201)
      
      const secondId = secondResponse.body.data.id
      
      // Try to update second to have the same name as first
      const response = await request(app)
        .put(`/api/ingredients/${secondId}`)
        .send({ name: 'first ingredient abc' }) // Different case
        .expect(409)
      
      expect(response.body.error.code).toBe('CONFLICT')
    })
  })

  describe('DELETE /api/ingredients/:id', () => {
    it('should delete unused ingredient and return 204', async () => {
      // Create an ingredient
      const createResponse = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Ingredient To Delete', unit: 'g' })
        .expect(201)
      
      const ingredientId = createResponse.body.data.id
      
      // Delete it
      await request(app)
        .delete(`/api/ingredients/${ingredientId}`)
        .expect(204)
      
      // Verify it's gone
      await request(app)
        .get(`/api/ingredients/${ingredientId}`)
        .expect(404)
    })

    it('should return 409 when trying to delete ingredient used in recipes', async () => {
      // Get the list of ingredients and find one that is used in recipes
      // by checking recipe_ingredients junction table through the recipes endpoint
      const recipesResponse = await request(app).get('/api/recipes')
      expect(recipesResponse.body.data.length).toBeGreaterThan(0)
      
      // Get first recipe with ingredients
      const recipeWithIngredients = recipesResponse.body.data.find((r: { ingredient_count: number }) => r.ingredient_count > 0)
      expect(recipeWithIngredients).toBeDefined()
      
      // Get the full recipe details to find an ingredient ID
      const recipeResponse = await request(app).get(`/api/recipes/${recipeWithIngredients.id}`)
      expect(recipeResponse.body.data.ingredients.length).toBeGreaterThan(0)
      
      const usedIngredientId = recipeResponse.body.data.ingredients[0].id
      
      // Try to delete it
      const response = await request(app)
        .delete(`/api/ingredients/${usedIngredientId}`)
        .expect(409)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('CONFLICT')
      expect(response.body.error.message).toContain('used in')
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .delete('/api/ingredients/99999')
        .expect(404)
      
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid ingredient ID', async () => {
      const response = await request(app)
        .delete('/api/ingredients/invalid')
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
