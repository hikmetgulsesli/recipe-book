import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { 
  initDatabase, 
  seedDatabase, 
  getDb, 
  closeDb,
  getAllRecipes,
  getRecipeById,
  getRecipeWithIngredients,
  getAllIngredients
} from '../db/database.js'
import fs from 'fs'

const TEST_DB_PATH = './test-recipe-book.db'

// Set test database path
process.env.DATABASE_URL = TEST_DB_PATH

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
  })

  it('should create recipes table with all required columns', () => {
    initDatabase()
    const db = getDb()
    
    // Check if table exists
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recipes'").get()
    expect(tableInfo).toBeDefined()
    
    // Check columns
    const columns = db.prepare("PRAGMA table_info(recipes)").all() as Array<{ name: string; type: string }>
    const columnNames = columns.map(c => c.name)
    
    expect(columnNames).toContain('id')
    expect(columnNames).toContain('name')
    expect(columnNames).toContain('description')
    expect(columnNames).toContain('instructions')
    expect(columnNames).toContain('prep_time')
    expect(columnNames).toContain('cook_time')
    expect(columnNames).toContain('servings')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
  })

  it('should create ingredients table with all required columns', () => {
    initDatabase()
    const db = getDb()
    
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ingredients'").get()
    expect(tableInfo).toBeDefined()
    
    const columns = db.prepare("PRAGMA table_info(ingredients)").all() as Array<{ name: string; type: string }>
    const columnNames = columns.map(c => c.name)
    
    expect(columnNames).toContain('id')
    expect(columnNames).toContain('name')
    expect(columnNames).toContain('unit')
    expect(columnNames).toContain('created_at')
  })

  it('should create recipe_ingredients junction table with foreign keys', () => {
    initDatabase()
    const db = getDb()
    
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recipe_ingredients'").get()
    expect(tableInfo).toBeDefined()
    
    const columns = db.prepare("PRAGMA table_info(recipe_ingredients)").all() as Array<{ name: string; type: string }>
    const columnNames = columns.map(c => c.name)
    
    expect(columnNames).toContain('id')
    expect(columnNames).toContain('recipe_id')
    expect(columnNames).toContain('ingredient_id')
    expect(columnNames).toContain('quantity')
  })

  it('should create indexes on foreign key columns', () => {
    initDatabase()
    const db = getDb()
    
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='recipe_ingredients'").all() as Array<{ name: string }>
    const indexNames = indexes.map(i => i.name)
    
    expect(indexNames).toContain('idx_recipe_ingredients_recipe_id')
    expect(indexNames).toContain('idx_recipe_ingredients_ingredient_id')
  })

  it('should seed database with 3 sample recipes', () => {
    initDatabase()
    seedDatabase()
    
    const recipes = getAllRecipes()
    expect(recipes).toHaveLength(3)
  })

  it('should seed database with ingredients', () => {
    initDatabase()
    seedDatabase()
    
    const ingredients = getAllIngredients()
    expect(ingredients.length).toBeGreaterThan(0)
  })

  it('should link recipes with ingredients via junction table', () => {
    initDatabase()
    seedDatabase()
    
    const recipes = getAllRecipes()
    expect(recipes.length).toBeGreaterThan(0)
    
    const firstRecipe = getRecipeWithIngredients(recipes[0].id)
    expect(firstRecipe).toBeDefined()
    expect(firstRecipe?.ingredients).toBeDefined()
    expect(firstRecipe?.ingredients.length).toBeGreaterThan(0)
  })

  it('should retrieve recipe by id', () => {
    initDatabase()
    seedDatabase()
    
    const recipes = getAllRecipes()
    const firstRecipe = recipes[0]
    
    const retrieved = getRecipeById(firstRecipe.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe(firstRecipe.name)
  })

  it('should return undefined for non-existent recipe', () => {
    initDatabase()
    seedDatabase()
    
    const retrieved = getRecipeById(99999)
    expect(retrieved).toBeUndefined()
  })

  it('should not duplicate seed data on multiple calls', () => {
    initDatabase()
    seedDatabase()
    seedDatabase() // Call again
    seedDatabase() // And again
    
    const recipes = getAllRecipes()
    expect(recipes).toHaveLength(3) // Should still be 3, not 9
  })
})
