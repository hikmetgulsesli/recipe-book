import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2, Save } from 'lucide-react'
import type { Ingredient, RecipeWithIngredients } from '../types'
import './RecipeForm.css'

interface IngredientRow {
  id: string // client-side unique id
  ingredient_id: number | null
  quantity: string
}

interface FormErrors {
  name?: string
  instructions?: string
  prep_time?: string
  cook_time?: string
  servings?: string
  ingredients?: string
  general?: string
}

export function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('')
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([])
  
  // Data state
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fetch available ingredients and recipe data (if editing)
  useEffect(() => {
    fetchIngredients()
    if (isEditMode && id) {
      fetchRecipe(parseInt(id, 10))
    }
  }, [id, isEditMode])

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients')
      if (!response.ok) throw new Error('Failed to fetch ingredients')
      const result = await response.json()
      setAvailableIngredients(result.data || [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load ingredients')
    }
  }

  const fetchRecipe = async (recipeId: number) => {
    try {
      setLoading(true)
      setFetchError(null)
      const response = await fetch(`/api/recipes/${recipeId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recipe not found')
        }
        throw new Error('Failed to fetch recipe')
      }
      
      const result = await response.json()
      const recipe: RecipeWithIngredients = result.data
      
      // Populate form
      setName(recipe.name)
      setDescription(recipe.description || '')
      setInstructions(recipe.instructions || '')
      setPrepTime(recipe.prep_time.toString())
      setCookTime(recipe.cook_time.toString())
      setServings(recipe.servings.toString())
      
      // Populate ingredient rows
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setIngredientRows(
          recipe.ingredients.map((ing, index) => ({
            id: `existing-${index}`,
            ingredient_id: ing.id,
            quantity: ing.quantity.toString()
          }))
        )
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Recipe name is required'
    }

    // Instructions validation
    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required'
    }

    // Time validation
    const prepTimeNum = parseInt(prepTime, 10)
    if (prepTime && (isNaN(prepTimeNum) || prepTimeNum < 0)) {
      newErrors.prep_time = 'Prep time must be a non-negative number'
    }

    const cookTimeNum = parseInt(cookTime, 10)
    if (cookTime && (isNaN(cookTimeNum) || cookTimeNum < 0)) {
      newErrors.cook_time = 'Cook time must be a non-negative number'
    }

    // Servings validation
    const servingsNum = parseInt(servings, 10)
    if (servings && (isNaN(servingsNum) || servingsNum < 1)) {
      newErrors.servings = 'Servings must be at least 1'
    }

    // Ingredient validation
    const validIngredients = ingredientRows.filter(
      row => row.ingredient_id && parseFloat(row.quantity) > 0
    )
    if (ingredientRows.length > 0 && validIngredients.length === 0) {
      newErrors.ingredients = 'Please add at least one valid ingredient with quantity'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    setErrors({})

    try {
      // Build ingredients array
      const ingredients = ingredientRows
        .filter(row => row.ingredient_id && parseFloat(row.quantity) > 0)
        .map(row => ({
          ingredient_id: row.ingredient_id!,
          quantity: parseFloat(row.quantity)
        }))

      const recipeData = {
        name: name.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim(),
        prep_time: parseInt(prepTime, 10) || 0,
        cook_time: parseInt(cookTime, 10) || 0,
        servings: parseInt(servings, 10) || 1,
        ingredients
      }

      const url = isEditMode ? `/api/recipes/${id}` : '/api/recipes'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipeData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (errorData?.error?.details) {
          const serverErrors: FormErrors = {}
          errorData.error.details.forEach((err: { field: string; message: string }) => {
            serverErrors[err.field as keyof FormErrors] = err.message
          })
          setErrors(serverErrors)
          throw new Error('Validation failed')
        }
        throw new Error(errorData?.error?.message || 'Failed to save recipe')
      }

      const result = await response.json()
      const savedRecipe: RecipeWithIngredients = result.data

      // Navigate to recipe detail page
      navigate(`/recipes/${savedRecipe.id}`)
    } catch (err) {
      if (err instanceof Error && err.message !== 'Validation failed') {
        setErrors(prev => ({ ...prev, general: err.message }))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddIngredient = () => {
    setIngredientRows(prev => [
      ...prev,
      { id: `new-${Date.now()}`, ingredient_id: null, quantity: '' }
    ])
  }

  const handleRemoveIngredient = (rowId: string) => {
    setIngredientRows(prev => prev.filter(row => row.id !== rowId))
  }

  const handleIngredientChange = (rowId: string, ingredientId: number | null) => {
    setIngredientRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, ingredient_id: ingredientId } : row
      )
    )
  }

  const handleQuantityChange = (rowId: string, quantity: string) => {
    // Allow empty string or valid number
    if (quantity === '' || /^\d*\.?\d*$/.test(quantity)) {
      setIngredientRows(prev =>
        prev.map(row =>
          row.id === rowId ? { ...row, quantity } : row
        )
      )
    }
  }

  const handleBack = () => {
    if (isEditMode && id) {
      navigate(`/recipes/${id}`)
    } else {
      navigate('/recipes')
    }
  }

  const getIngredientUnit = (ingredientId: number | null): string => {
    if (!ingredientId) return ''
    const ingredient = availableIngredients.find(i => i.id === ingredientId)
    return ingredient ? ingredient.unit : ''
  }

  if (loading) {
    return (
      <div className="recipe-form-container">
        <div className="loading-state" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="recipe-form-container">
        <div className="error-state" role="alert">
          <AlertCircle className="error-icon" aria-hidden="true" />
          <p>{fetchError}</p>
          <button 
            onClick={() => isEditMode && id ? fetchRecipe(parseInt(id, 10)) : fetchIngredients()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="recipe-form-container">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="back-link"
        aria-label="Go back"
      >
        <ArrowLeft className="back-icon" aria-hidden="true" />
        {isEditMode ? 'Back to Recipe' : 'Back to Recipes'}
      </button>

      {/* Form Header */}
      <header className="form-header">
        <h1 className="form-title">
          {isEditMode ? 'Edit Recipe' : 'Add New Recipe'}
        </h1>
        <p className="form-subtitle">
          {isEditMode 
            ? 'Update your recipe details and ingredients' 
            : 'Create a new recipe with ingredients and instructions'}
        </p>
      </header>

      {/* General Error */}
      {errors.general && (
        <div className="general-error" role="alert">
          <AlertCircle className="error-icon-small" aria-hidden="true" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="recipe-form" noValidate>
        {/* Basic Info Section */}
        <section className="form-section">
          <h2 className="section-title">Basic Information</h2>
          
          {/* Name Field */}
          <div className="form-field">
            <label htmlFor="name" className="field-label">
              Recipe Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Classic Pancakes"
              className={`field-input ${errors.name ? 'error' : ''}`}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
              autoComplete="off"
            />
            {errors.name && (
              <span id="name-error" className="field-error" role="alert">
                {errors.name}
              </span>
            )}
          </div>

          {/* Description Field */}
          <div className="form-field">
            <label htmlFor="description" className="field-label">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe..."
              className="field-textarea"
              rows={3}
              autoComplete="off"
            />
          </div>

          {/* Time and Servings Grid */}
          <div className="form-grid-3">
            {/* Prep Time */}
            <div className="form-field">
              <label htmlFor="prep_time" className="field-label">
                Prep Time (min)
              </label>
              <input
                type="number"
                id="prep_time"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="0"
                min="0"
                className={`field-input ${errors.prep_time ? 'error' : ''}`}
                aria-invalid={errors.prep_time ? 'true' : 'false'}
                aria-describedby={errors.prep_time ? 'prep-error' : undefined}
              />
              {errors.prep_time && (
                <span id="prep-error" className="field-error" role="alert">
                  {errors.prep_time}
                </span>
              )}
            </div>

            {/* Cook Time */}
            <div className="form-field">
              <label htmlFor="cook_time" className="field-label">
                Cook Time (min)
              </label>
              <input
                type="number"
                id="cook_time"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="0"
                min="0"
                className={`field-input ${errors.cook_time ? 'error' : ''}`}
                aria-invalid={errors.cook_time ? 'true' : 'false'}
                aria-describedby={errors.cook_time ? 'cook-error' : undefined}
              />
              {errors.cook_time && (
                <span id="cook-error" className="field-error" role="alert">
                  {errors.cook_time}
                </span>
              )}
            </div>

            {/* Servings */}
            <div className="form-field">
              <label htmlFor="servings" className="field-label">
                Servings
              </label>
              <input
                type="number"
                id="servings"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="1"
                min="1"
                className={`field-input ${errors.servings ? 'error' : ''}`}
                aria-invalid={errors.servings ? 'true' : 'false'}
                aria-describedby={errors.servings ? 'servings-error' : undefined}
              />
              {errors.servings && (
                <span id="servings-error" className="field-error" role="alert">
                  {errors.servings}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Ingredients Section */}
        <section className="form-section">
          <div className="section-header">
            <h2 className="section-title">Ingredients</h2>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="add-ingredient-button"
              aria-label="Add ingredient"
            >
              <Plus className="button-icon-small" aria-hidden="true" />
              Add Ingredient
            </button>
          </div>

          {errors.ingredients && (
            <div className="section-error" role="alert">
              {errors.ingredients}
            </div>
          )}

          {ingredientRows.length === 0 ? (
            <div className="empty-ingredients">
              <p>No ingredients added yet.</p>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="add-first-ingredient-button"
              >
                <Plus className="button-icon-small" aria-hidden="true" />
                Add your first ingredient
              </button>
            </div>
          ) : (
            <div className="ingredients-list-form">
              {ingredientRows.map((row, index) => (
                <div 
                  key={row.id} 
                  className="ingredient-row"
                  style={{ '--i': index } as React.CSSProperties}
                >
                  <div className="ingredient-select-wrapper">
                    <label 
                      htmlFor={`ingredient-${row.id}`}
                      className="sr-only"
                    >
                      Select ingredient {index + 1}
                    </label>
                    <select
                      id={`ingredient-${row.id}`}
                      value={row.ingredient_id || ''}
                      onChange={(e) => 
                        handleIngredientChange(
                          row.id, 
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      className="ingredient-select"
                      aria-label={`Ingredient ${index + 1}`}
                    >
                      <option value="">Select ingredient...</option>
                      {availableIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ingredient-quantity-wrapper">
                    <label 
                      htmlFor={`quantity-${row.id}`}
                      className="sr-only"
                    >
                      Quantity for ingredient {index + 1}
                    </label>
                    <input
                      type="text"
                      id={`quantity-${row.id}`}
                      value={row.quantity}
                      onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                      placeholder="Qty"
                      className="ingredient-quantity-input"
                      aria-label={`Quantity ${index + 1}`}
                    />
                    {row.ingredient_id && (
                      <span className="ingredient-unit-label">
                        {getIngredientUnit(row.ingredient_id)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(row.id)}
                    className="remove-ingredient-button"
                    aria-label={`Remove ingredient ${index + 1}`}
                    title="Remove ingredient"
                  >
                    <Trash2 className="button-icon-small" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Instructions Section */}
        <section className="form-section">
          <h2 className="section-title">Instructions <span className="required">*</span></h2>
          
          <div className="form-field">
            <label htmlFor="instructions" className="sr-only">
              Recipe Instructions
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step instructions for preparing the recipe..."
              className={`field-textarea instructions-textarea ${errors.instructions ? 'error' : ''}`}
              rows={8}
              aria-invalid={errors.instructions ? 'true' : 'false'}
              aria-describedby={errors.instructions ? 'instructions-error' : undefined}
            />
            {errors.instructions && (
              <span id="instructions-error" className="field-error" role="alert">
                {errors.instructions}
              </span>
            )}
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleBack}
            className="action-button secondary-button"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="action-button primary-button"
            disabled={saving}
            aria-label={isEditMode ? 'Save recipe changes' : 'Create recipe'}
          >
            {saving ? (
              <>
                <Loader2 className="button-icon-small spinning" aria-hidden="true" />
                {isEditMode ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="button-icon-small" aria-hidden="true" />
                {isEditMode ? 'Save Changes' : 'Create Recipe'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
