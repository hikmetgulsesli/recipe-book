import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Users, ChefHat, ArrowLeft, Edit2, Trash2, AlertCircle } from 'lucide-react'
import type { RecipeWithIngredients } from '../types'
import './RecipeDetail.css'

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchRecipe(parseInt(id, 10))
    }
  }, [id])

  const fetchRecipe = async (recipeId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/recipes/${recipeId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recipe not found')
        }
        throw new Error('Failed to fetch recipe')
      }
      
      const data = await response.json()
      setRecipe(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/recipes/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!id) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete recipe')
      }
      
      navigate('/recipes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleBack = () => {
    navigate('/recipes')
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatUnit = (unit: string): string => {
    const unitLabels: Record<string, string> = {
      g: 'g',
      ml: 'ml',
      piece: 'piece',
      tbsp: 'tbsp',
      tsp: 'tsp',
      cup: 'cup',
      pinch: 'pinch'
    }
    return unitLabels[unit] || unit
  }

  const formatQuantity = (quantity: number): string => {
    if (quantity === Math.floor(quantity)) {
      return quantity.toString()
    }
    return quantity.toFixed(2).replace(/\.?0+$/, '')
  }

  if (loading) {
    return (
      <div className="recipe-detail-container">
        <div className="loading-state" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recipe-detail-container">
        <div className="error-state" role="alert">
          <AlertCircle className="error-icon" aria-hidden="true" />
          <p>{error}</p>
          <button 
            onClick={() => id && fetchRecipe(parseInt(id, 10))}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-container">
        <div className="error-state" role="alert">
          <AlertCircle className="error-icon" aria-hidden="true" />
          <p>Recipe not found</p>
          <button 
            onClick={handleBack}
            className="back-button"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="recipe-detail-container">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="back-link"
        aria-label="Back to recipe list"
      >
        <ArrowLeft className="back-icon" aria-hidden="true" />
        Back to Recipes
      </button>

      {/* Recipe Header */}
      <header className="recipe-header">
        <div className="recipe-header-content">
          <h1 className="recipe-title">{recipe.name}</h1>
          
          {recipe.description && (
            <p className="recipe-description">{recipe.description}</p>
          )}

          {/* Time and Servings */}
          <div className="recipe-meta">
            <div className="meta-card">
              <Clock className="meta-card-icon" aria-hidden="true" />
              <div className="meta-card-content">
                <span className="meta-card-label">Prep Time</span>
                <span className="meta-card-value">{formatTime(recipe.prep_time)}</span>
              </div>
            </div>

            <div className="meta-card">
              <Clock className="meta-card-icon" aria-hidden="true" />
              <div className="meta-card-content">
                <span className="meta-card-label">Cook Time</span>
                <span className="meta-card-value">{formatTime(recipe.cook_time)}</span>
              </div>
            </div>

            <div className="meta-card">
              <Users className="meta-card-icon" aria-hidden="true" />
              <div className="meta-card-content">
                <span className="meta-card-label">Servings</span>
                <span className="meta-card-value">{recipe.servings}</span>
              </div>
            </div>

            <div className="meta-card total-time">
              <ChefHat className="meta-card-icon" aria-hidden="true" />
              <div className="meta-card-content">
                <span className="meta-card-label">Total Time</span>
                <span className="meta-card-value">{formatTime(recipe.prep_time + recipe.cook_time)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="recipe-actions">
          <button
            onClick={handleEdit}
            className="action-button edit-button"
            aria-label="Edit recipe"
          >
            <Edit2 className="action-icon" aria-hidden="true" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="action-button delete-button"
            aria-label="Delete recipe"
          >
            <Trash2 className="action-icon" aria-hidden="true" />
            Delete
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="recipe-content">
        {/* Ingredients Section */}
        <section className="recipe-section ingredients-section" aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading" className="section-title">
            <ChefHat className="section-icon" aria-hidden="true" />
            Ingredients
          </h2>
          
          {recipe.ingredients.length === 0 ? (
            <p className="empty-section">No ingredients listed for this recipe.</p>
          ) : (
            <ul className="ingredients-list" role="list">
              {recipe.ingredients.map((ingredient, index) => (
                <li 
                  key={ingredient.id} 
                  className="ingredient-item"
                  style={{ '--i': index } as React.CSSProperties}
                >
                  <span className="ingredient-quantity">
                    {formatQuantity(ingredient.quantity)}
                  </span>
                  <span className="ingredient-unit">
                    {formatUnit(ingredient.unit)}
                  </span>
                  <span className="ingredient-name">{ingredient.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Instructions Section */}
        <section className="recipe-section instructions-section" aria-labelledby="instructions-heading">
          <h2 id="instructions-heading" className="section-title">
            <Clock className="section-icon" aria-hidden="true" />
            Instructions
          </h2>
          
          {recipe.instructions ? (
            <div className="instructions-content">
              {recipe.instructions.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="instruction-paragraph">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          ) : (
            <p className="empty-section">No instructions provided for this recipe.</p>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="modal-overlay" 
          role="dialog" 
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false)
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <AlertCircle className="modal-icon" aria-hidden="true" />
              <h2 id="delete-modal-title" className="modal-title">Delete Recipe</h2>
            </div>
            <p className="modal-message">
              Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="modal-button cancel-button"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="modal-button confirm-delete-button"
                disabled={deleting}
                aria-label="Confirm delete recipe"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
