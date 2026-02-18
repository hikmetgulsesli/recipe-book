import Database from 'better-sqlite3'
import { Recipe, Ingredient, RecipeWithIngredients } from '../types/index.js'

const DB_PATH = process.env.DATABASE_URL || './recipe-book.db'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function initDatabase(): void {
  const database = getDb()

  // Create recipes table
  database.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      instructions TEXT NOT NULL,
      prep_time INTEGER NOT NULL DEFAULT 0,
      cook_time INTEGER NOT NULL DEFAULT 0,
      servings INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create ingredients table
  database.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL DEFAULT 'piece',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create recipe_ingredients junction table
  database.exec(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
      UNIQUE(recipe_id, ingredient_id)
    )
  `)

  // Create indexes for foreign keys (performance optimization)
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id)
  `)
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id)
  `)
}

export function seedDatabase(): void {
  const database = getDb()

  // Check if we already have data
  const count = database.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number }
  if (count.count > 0) {
    return // Already seeded
  }

  // Insert ingredients first
  const insertIngredient = database.prepare(`
    INSERT INTO ingredients (name, unit) VALUES (?, ?)
  `)

  const ingredients = [
    { name: 'Flour', unit: 'g' },
    { name: 'Sugar', unit: 'g' },
    { name: 'Eggs', unit: 'piece' },
    { name: 'Milk', unit: 'ml' },
    { name: 'Butter', unit: 'g' },
    { name: 'Salt', unit: 'pinch' },
    { name: 'Tomato', unit: 'piece' },
    { name: 'Onion', unit: 'piece' },
    { name: 'Garlic', unit: 'piece' },
    { name: 'Olive Oil', unit: 'ml' },
    { name: 'Pasta', unit: 'g' },
    { name: 'Chicken Breast', unit: 'g' },
    { name: 'Rice', unit: 'g' },
    { name: 'Lemon', unit: 'piece' },
    { name: 'Parsley', unit: 'g' },
  ]

  for (const ing of ingredients) {
    insertIngredient.run(ing.name, ing.unit)
  }

  // Insert recipes
  const insertRecipe = database.prepare(`
    INSERT INTO recipes (name, description, instructions, prep_time, cook_time, servings)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  // Recipe 1: Classic Pancakes
  const pancakeId = insertRecipe.run(
    'Classic Pancakes',
    'Fluffy homemade pancakes perfect for breakfast',
    '1. Mix flour, sugar, and salt in a large bowl.\n2. In another bowl, whisk eggs and milk.\n3. Combine wet and dry ingredients, add melted butter.\n4. Cook on medium heat for 2-3 minutes per side.',
    10,
    15,
    4
  ).lastInsertRowid as number

  // Recipe 2: Tomato Pasta
  const pastaId = insertRecipe.run(
    'Simple Tomato Pasta',
    'Quick and delicious pasta with fresh tomato sauce',
    '1. Boil pasta according to package instructions.\n2. Sauté chopped onion and garlic in olive oil.\n3. Add diced tomatoes and simmer for 15 minutes.\n4. Toss pasta with sauce and garnish with parsley.',
    5,
    20,
    2
  ).lastInsertRowid as number

  // Recipe 3: Lemon Chicken Rice
  const chickenId = insertRecipe.run(
    'Lemon Chicken Rice',
    'Aromatic one-pot chicken and rice dish',
    '1. Season chicken breast with salt.\n2. Sear chicken in olive oil until golden.\n3. Add rice, water, and lemon juice.\n4. Simmer covered for 20 minutes until rice is tender.\n5. Garnish with fresh parsley.',
    10,
    25,
    3
  ).lastInsertRowid as number

  // Insert recipe ingredients (junction table)
  const insertRecipeIngredient = database.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
    VALUES (?, ?, ?)
  `)

  // Pancake ingredients
  insertRecipeIngredient.run(pancakeId, 1, 200)  // Flour 200g
  insertRecipeIngredient.run(pancakeId, 2, 30)   // Sugar 30g
  insertRecipeIngredient.run(pancakeId, 3, 2)    // Eggs 2 pieces
  insertRecipeIngredient.run(pancakeId, 4, 250)  // Milk 250ml
  insertRecipeIngredient.run(pancakeId, 5, 50)   // Butter 50g
  insertRecipeIngredient.run(pancakeId, 6, 1)    // Salt 1 pinch

  // Pasta ingredients
  insertRecipeIngredient.run(pastaId, 7, 4)      // Tomato 4 pieces
  insertRecipeIngredient.run(pastaId, 8, 1)      // Onion 1 piece
  insertRecipeIngredient.run(pastaId, 9, 3)      // Garlic 3 pieces
  insertRecipeIngredient.run(pastaId, 10, 30)    // Olive Oil 30ml
  insertRecipeIngredient.run(pastaId, 11, 300)   // Pasta 300g
  insertRecipeIngredient.run(pastaId, 15, 10)    // Parsley 10g

  // Chicken Rice ingredients
  insertRecipeIngredient.run(chickenId, 12, 400) // Chicken Breast 400g
  insertRecipeIngredient.run(chickenId, 13, 200) // Rice 200g
  insertRecipeIngredient.run(chickenId, 14, 1)   // Lemon 1 piece
  insertRecipeIngredient.run(chickenId, 10, 20)  // Olive Oil 20ml
  insertRecipeIngredient.run(chickenId, 6, 2)    // Salt 2 pinches
  insertRecipeIngredient.run(chickenId, 15, 15)  // Parsley 15g
}

// Query helpers
export function getAllRecipes(): Recipe[] {
  const db = getDb()
  return db.prepare('SELECT * FROM recipes ORDER BY created_at DESC').all() as Recipe[]
}

export function getRecipeById(id: number): Recipe | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Recipe | undefined
}

export function getRecipeWithIngredients(recipeId: number): RecipeWithIngredients | undefined {
  const db = getDb()
  
  const recipe = getRecipeById(recipeId)
  if (!recipe) return undefined

  const ingredients = db.prepare(`
    SELECT i.id, i.name, i.unit, ri.quantity
    FROM ingredients i
    JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = ?
  `).all(recipeId) as Array<{ id: number; name: string; unit: string; quantity: number }>

  return {
    ...recipe,
    ingredients
  }
}

export function getAllIngredients(): Ingredient[] {
  const db = getDb()
  return db.prepare('SELECT * FROM ingredients ORDER BY name').all() as Ingredient[]
}
