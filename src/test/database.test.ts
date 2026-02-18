import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'fs'

const TEST_DB_PATH = './test-database-recipe-book.db'

// Set test database path BEFORE importing database modules
process.env.DATABASE_URL = TEST_DB_PATH

// Dynamic imports to ensure env var is set first
const { 
  initDatabase, 
  seedDatabase, 
  getDb, 
  closeDb,
  getAllRecipes,
  getRecipeById,
  getRecipeWithIngredients,
  getAllIngredients
} = await import('../db/database.js')

describe('Database Schema', () => {
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
  })

  describe('Schema Creation', () => {
    it('should create recipes table', () => {
      const db = getDb()
      const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recipes'").get()
      expect(result).toBeDefined()
    })

    it('should create ingredients table', () => {
      const db = getDb()
      const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ingredients'").get()
      expect(result).toBeDefined()
    })

    it('should create recipe_ingredients junction table', () => {
      const db = getDb()
      const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recipe_ingredients'").get()
      expect(result).toBeDefined()
    })

    it('should create indexes on foreign keys', () => {
      const db = getDb()
      const index1 = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_recipe_ingredients_recipe_id'").get()
      const index2 = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_recipe_ingredients_ingredient_id'").get()
      expect(index1).toBeDefined()
      expect(index2).toBeDefined()
    })
  })

  describe('Seed Data', () => {
    it('should seed recipes', () => {
      const recipes = getAllRecipes()
      expect(recipes.length).toBeGreaterThan(0)
    })

    it('should seed ingredients', () => {
      const ingredients = getAllIngredients()
      expect(ingredients.length).toBeGreaterThan(0)
    })

    it('should have recipes with ingredients', () => {
      const recipes = getAllRecipes()
      const firstRecipe = recipes[0]
      const recipeWithIngredients = getRecipeWithIngredients(firstRecipe.id)
      expect(recipeWithIngredients).toBeDefined()
      expect(recipeWithIngredients?.ingredients).toBeDefined()
      expect(recipeWithIngredients?.ingredients.length).toBeGreaterThan(0)
    })

    it('should not duplicate seed data on multiple calls', () => {
      // Call seedDatabase again
      seedDatabase()
      
      const recipes = getAllRecipes()
      const ingredients = getAllIngredients()
      
      // Should still have the same number of recipes (3 from seed)
      expect(recipes.length).toBe(3)
      // Should still have the same number of ingredients (15 from seed)
      expect(ingredients.length).toBe(15)
    })
  })

  describe('Query Functions', () => {
    it('getAllRecipes should return all recipes', () => {
      const recipes = getAllRecipes()
      expect(recipes.length).toBe(3)
      expect(recipes[0]).toHaveProperty('id')
      expect(recipes[0]).toHaveProperty('name')
      expect(recipes[0]).toHaveProperty('instructions')
    })

    it('getRecipeById should return specific recipe', () => {
      const recipes = getAllRecipes()
      const firstRecipe = recipes[0]
      const recipe = getRecipeById(firstRecipe.id)
      
      expect(recipe).toBeDefined()
      expect(recipe?.id).toBe(firstRecipe.id)
      expect(recipe?.name).toBe(firstRecipe.name)
    })

    it('getRecipeById should return undefined for non-existent id', () => {
      const recipe = getRecipeById(99999)
      expect(recipe).toBeUndefined()
    })

    it('getRecipeWithIngredients should include ingredient details', () => {
      const recipes = getAllRecipes()
      const firstRecipe = recipes[0]
      const recipe = getRecipeWithIngredients(firstRecipe.id)
      
      expect(recipe).toBeDefined()
      expect(recipe?.ingredients).toBeDefined()
      expect(recipe?.ingredients.length).toBeGreaterThan(0)
      
      // Check ingredient structure
      const ingredient = recipe?.ingredients[0]
      expect(ingredient).toHaveProperty('id')
      expect(ingredient).toHaveProperty('name')
      expect(ingredient).toHaveProperty('unit')
      expect(ingredient).toHaveProperty('quantity')
    })

    it('getAllIngredients should return all ingredients', () => {
      const ingredients = getAllIngredients()
      expect(ingredients.length).toBe(15)
      expect(ingredients[0]).toHaveProperty('id')
      expect(ingredients[0]).toHaveProperty('name')
      expect(ingredients[0]).toHaveProperty('unit')
    })
  })
})
