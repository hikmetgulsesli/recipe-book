import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createServer } from '../api/server.js'
import { initDatabase, seedDatabase, closeDb } from '../db/database.js'
import fs from 'fs'

const TEST_DB_PATH = './test-api-recipe-book.db'

// Set test database path
process.env.DATABASE_URL = TEST_DB_PATH

describe('Recipe API Endpoints', () => {
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

  describe('GET /api/recipes', () => {
    it('should return array of recipes with ingredient count', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200)
      
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(3) // From seed data
      
      // Check that ingredient_count is included
      expect(response.body.data[0]).toHaveProperty('ingredient_count')
      expect(typeof response.body.data[0].ingredient_count).toBe('number')
      
      // Check meta
      expect(response.body.meta).toBeDefined()
      expect(response.body.meta.total).toBe(3)
    })

    it('should return recipes ordered by created_at DESC', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200)
      
      const recipes = response.body.data
      // Verify descending order
      for (let i = 0; i < recipes.length - 1; i++) {
        const current = new Date(recipes[i].created_at).getTime()
        const next = new Date(recipes[i + 1].created_at).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })
  })

  describe('GET /api/recipes/:id', () => {
    it('should return single recipe with full ingredient details', async () => {
      // First get all recipes to find a valid ID
      const listResponse = await request(app).get('/api/recipes')
      const recipeId = listResponse.body.data[0].id
      
      const response = await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(200)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(recipeId)
      expect(response.body.data.name).toBeDefined()
      expect(response.body.data.ingredients).toBeDefined()
      expect(Array.isArray(response.body.data.ingredients)).toBe(true)
      
      // Check ingredient structure
      if (response.body.data.ingredients.length > 0) {
        const ingredient = response.body.data.ingredients[0]
        expect(ingredient).toHaveProperty('id')
        expect(ingredient).toHaveProperty('name')
        expect(ingredient).toHaveProperty('unit')
        expect(ingredient).toHaveProperty('quantity')
      }
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/99999')
        .expect(404)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid recipe ID', async () => {
      const response = await request(app)
        .get('/api/recipes/invalid')
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/recipes', () => {
    it('should create new recipe and return created record', async () => {
      const newRecipe = {
        name: 'Test Recipe',
        description: 'A test recipe description',
        instructions: '1. Step one\n2. Step two',
        prep_time: 15,
        cook_time: 30,
        servings: 4
      }
      
      const response = await request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .expect(201)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.name).toBe(newRecipe.name)
      expect(response.body.data.description).toBe(newRecipe.description)
      expect(response.body.data.instructions).toBe(newRecipe.instructions)
      expect(response.body.data.prep_time).toBe(newRecipe.prep_time)
      expect(response.body.data.cook_time).toBe(newRecipe.cook_time)
      expect(response.body.data.servings).toBe(newRecipe.servings)
      expect(response.body.data.ingredients).toEqual([])
    })

    it('should create recipe with ingredients', async () => {
      // First get available ingredients
      const dbResponse = await request(app).get('/api/recipes')
      const recipeResponse = await request(app).get(`/api/recipes/${dbResponse.body.data[0].id}`)
      const availableIngredients = recipeResponse.body.data.ingredients
      
      if (availableIngredients.length > 0) {
        const newRecipe = {
          name: 'Recipe With Ingredients',
          instructions: 'Cook it',
          ingredients: [
            { ingredient_id: availableIngredients[0].id, quantity: 100 }
          ]
        }
        
        const response = await request(app)
          .post('/api/recipes')
          .send(newRecipe)
          .expect(201)
        
        expect(response.body.data.ingredients).toHaveLength(1)
        expect(response.body.data.ingredients[0].quantity).toBe(100)
      }
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({})
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toBeDefined()
    })

    it('should return 400 for invalid field types', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test',
          instructions: 'Test',
          prep_time: -5 // Invalid: negative
        })
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /api/recipes/:id', () => {
    it('should update recipe and return updated record', async () => {
      // First get a recipe to update
      const listResponse = await request(app).get('/api/recipes')
      const recipeId = listResponse.body.data[0].id
      
      const updates = {
        name: 'Updated Recipe Name',
        prep_time: 20
      }
      
      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .send(updates)
        .expect(200)
      
      expect(response.body.data.name).toBe(updates.name)
      expect(response.body.data.prep_time).toBe(updates.prep_time)
      // Other fields should remain unchanged
      expect(response.body.data.id).toBe(recipeId)
    })

    it('should update recipe ingredients', async () => {
      // First get a recipe and its ingredients
      const listResponse = await request(app).get('/api/recipes')
      const recipeId = listResponse.body.data[0].id
      const recipeResponse = await request(app).get(`/api/recipes/${recipeId}`)
      const availableIngredients = recipeResponse.body.data.ingredients
      
      if (availableIngredients.length > 0) {
        const updates = {
          ingredients: [
            { ingredient_id: availableIngredients[0].id, quantity: 999 }
          ]
        }
        
        const response = await request(app)
          .put(`/api/recipes/${recipeId}`)
          .send(updates)
          .expect(200)
        
        expect(response.body.data.ingredients).toHaveLength(1)
        expect(response.body.data.ingredients[0].quantity).toBe(999)
      }
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .put('/api/recipes/99999')
        .send({ name: 'Updated' })
        .expect(404)
      
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid data', async () => {
      const listResponse = await request(app).get('/api/recipes')
      const recipeId = listResponse.body.data[0].id
      
      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .send({ servings: 0 }) // Invalid: must be at least 1
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    it('should delete recipe and return 204', async () => {
      // Create a recipe to delete
      const newRecipe = {
        name: 'Recipe To Delete',
        instructions: 'Delete me'
      }
      
      const createResponse = await request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .expect(201)
      
      const recipeId = createResponse.body.data.id
      
      // Delete it
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204)
      
      // Verify it's gone
      await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(404)
    })

    it('should delete recipe and related junction records', async () => {
      // Get a recipe with ingredients
      const listResponse = await request(app).get('/api/recipes')
      const recipeWithIngredients = listResponse.body.data.find((r: { ingredient_count: number }) => r.ingredient_count > 0)
      
      if (recipeWithIngredients) {
        const recipeId = recipeWithIngredients.id
        
        // Delete it
        await request(app)
          .delete(`/api/recipes/${recipeId}`)
          .expect(204)
        
        // Verify it's gone
        await request(app)
          .get(`/api/recipes/${recipeId}`)
          .expect(404)
      }
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .delete('/api/recipes/99999')
        .expect(404)
      
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid recipe ID', async () => {
      const response = await request(app)
        .delete('/api/recipes/invalid')
        .expect(400)
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })
})
