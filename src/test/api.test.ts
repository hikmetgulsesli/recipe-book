import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import fs from 'fs'

const TEST_DB_PATH = './test-api-recipe-book.db'

// Set test database path BEFORE importing database modules
process.env.DATABASE_URL = TEST_DB_PATH

// Dynamic imports to ensure env var is set first
const { createServer } = await import('../api/server.js')
const { initDatabase, seedDatabase, closeDb } = await import('../db/database.js')

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
      const recipe = response.body.data[0]
      expect(recipe).toHaveProperty('id')
      expect(recipe).toHaveProperty('name')
      expect(recipe).toHaveProperty('ingredient_count')
      
      // Check meta
      expect(response.body.meta).toBeDefined()
      expect(response.body.meta.total).toBe(3)
    })

    it('should return empty array when no recipes exist', async () => {
      // Clear all recipes directly from database
      const { getDb } = await import('../db/database.js')
      const db = getDb()
      db.prepare('DELETE FROM recipe_ingredients').run()
      db.prepare('DELETE FROM recipes').run()
      
      const response = await request(app)
        .get('/api/recipes')
        .expect(200)
      
      expect(response.body.data).toEqual([])
      expect(response.body.meta.total).toBe(0)
    })
  })

  describe('GET /api/recipes/:id', () => {
    it('should return single recipe with ingredients', async () => {
      // Get all recipes first
      const listResponse = await request(app)
        .get('/api/recipes')
        .expect(200)
      
      const recipeId = listResponse.body.data[0].id
      
      const response = await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(200)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(recipeId)
      expect(response.body.data).toHaveProperty('name')
      expect(response.body.data).toHaveProperty('description')
      expect(response.body.data).toHaveProperty('instructions')
      expect(response.body.data).toHaveProperty('prep_time')
      expect(response.body.data).toHaveProperty('cook_time')
      expect(response.body.data).toHaveProperty('servings')
      expect(response.body.data).toHaveProperty('ingredients')
      expect(Array.isArray(response.body.data.ingredients)).toBe(true)
      expect(response.body.data.ingredients.length).toBeGreaterThan(0)
      
      // Check ingredient structure
      const ingredient = response.body.data.ingredients[0]
      expect(ingredient).toHaveProperty('id')
      expect(ingredient).toHaveProperty('name')
      expect(ingredient).toHaveProperty('unit')
      expect(ingredient).toHaveProperty('quantity')
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
    it('should create new recipe with ingredients', async () => {
      // Get an ingredient first
      const ingredientsResponse = await request(app)
        .get('/api/ingredients')
        .expect(200)
      
      const ingredientId = ingredientsResponse.body.data[0].id
      
      const newRecipe = {
        name: 'Test Recipe XYZ',
        description: 'A test recipe',
        instructions: 'Step 1\nStep 2\nStep 3',
        prep_time: 10,
        cook_time: 20,
        servings: 4,
        ingredients: [
          { ingredient_id: ingredientId, quantity: 100 }
        ]
      }
      
      const response = await request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .expect(201)
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.name).toBe(newRecipe.name)
      expect(response.body.data.ingredients).toBeDefined()
      expect(response.body.data.ingredients.length).toBe(1)
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          description: 'Missing name and instructions'
        })
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: '',
          instructions: 'Some instructions'
        })
        .expect(400)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /api/recipes/:id', () => {
    it('should update recipe and ingredients', async () => {
      // Get all recipes first
      const listResponse = await request(app)
        .get('/api/recipes')
        .expect(200)
      
      const recipeId = listResponse.body.data[0].id
      
      // Get ingredients for the update
      const ingredientsResponse = await request(app)
        .get('/api/ingredients')
        .expect(200)
      
      const ingredientId = ingredientsResponse.body.data[0].id
      
      const updates = {
        name: 'Updated Recipe Name XYZ',
        description: 'Updated description',
        instructions: 'Updated instructions',
        prep_time: 15,
        cook_time: 30,
        servings: 6,
        ingredients: [
          { ingredient_id: ingredientId, quantity: 200 }
        ]
      }
      
      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .send(updates)
        .expect(200)
      
      expect(response.body.data.name).toBe(updates.name)
      expect(response.body.data.description).toBe(updates.description)
      expect(response.body.data.ingredients.length).toBe(1)
      expect(response.body.data.ingredients[0].quantity).toBe(200)
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .put('/api/recipes/99999')
        .send({
          name: 'Updated Recipe',
          instructions: 'Updated instructions'
        })
        .expect(404)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    it('should delete recipe and its ingredients', async () => {
      // Get all recipes first
      const listResponse = await request(app)
        .get('/api/recipes')
        .expect(200)
      
      const recipeId = listResponse.body.data[0].id
      
      // Delete the recipe
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204)
      
      // Verify it's gone
      await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(404)
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .delete('/api/recipes/99999')
        .expect(404)
      
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
      
      expect(response.body.status).toBe('ok')
      expect(response.body.timestamp).toBeDefined()
    })
  })
})
