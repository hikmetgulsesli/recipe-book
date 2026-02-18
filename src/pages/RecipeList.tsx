import { useState, useEffect } from 'react'
import { Clock, Users, ChefHat } from 'lucide-react'
import type { Recipe } from '../types'
import './RecipeList.css'

interface RecipeWithCount extends Recipe {
  ingredient_count: number
}

interface RecipeListProps {
  onRecipeClick?: (recipeId: number) => void
  onNewRecipeClick?: () => void
}

export function RecipeList({ onRecipeClick, onNewRecipeClick }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/recipes')
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes')
      }
      
      const data = await response.json()
      setRecipes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="recipe-list-container">
        <div className="recipe-list-header">
          <h1>My Recipes</h1>
        </div>
        <div className="loading-state" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading recipes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recipe-list-container">
        <div className="recipe-list-header">
          <h1>My Recipes</h1>
        </div>
        <div className="error-state" role="alert">
          <p>{error}</p>
          <button 
            onClick={fetchRecipes}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="recipe-list-container">
      <div className="recipe-list-header">
        <h1>My Recipes</h1>
        <button
          onClick={onNewRecipeClick}
          className="new-recipe-button"
          aria-label="Create new recipe"
        >
          <ChefHat className="button-icon" aria-hidden="true" />
          New Recipe
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="empty-state">
          <ChefHat className="empty-icon" aria-hidden="true" />
          <h2>No recipes yet</h2>
          <p>Create your first recipe to get started</p>
          <button
            onClick={onNewRecipeClick}
            className="new-recipe-button"
          >
            Create Recipe
          </button>
        </div>
      ) : (
        <div 
          className="recipe-grid"
          role="list"
          aria-label="Recipe list"
        >
          {recipes.map((recipe) => (
            <article
              key={recipe.id}
              className="recipe-card"
              onClick={() => onRecipeClick?.(recipe.id)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRecipeClick?.(recipe.id)
                }
              }}
              aria-label={`${recipe.name}, ${recipe.servings} servings, ${formatTime(recipe.prep_time + recipe.cook_time)} total time`}
            >
              <div className="recipe-card-content">
                <h2 className="recipe-name">{recipe.name}</h2>
                
                {recipe.description && (
                  <p className="recipe-description">
                    {recipe.description.length > 100 
                      ? `${recipe.description.slice(0, 100)}...` 
                      : recipe.description}
                  </p>
                )}

                <div className="recipe-meta">
                  <div className="meta-item" title="Prep time">
                    <Clock className="meta-icon" aria-hidden="true" />
                    <span className="meta-label">Prep:</span>
                    <span className="meta-value">{formatTime(recipe.prep_time)}</span>
                  </div>
                  
                  <div className="meta-item" title="Cook time">
                    <Clock className="meta-icon" aria-hidden="true" />
                    <span className="meta-label">Cook:</span>
                    <span className="meta-value">{formatTime(recipe.cook_time)}</span>
                  </div>
                  
                  <div className="meta-item" title="Servings">
                    <Users className="meta-icon" aria-hidden="true" />
                    <span className="meta-label">Serves:</span>
                    <span className="meta-value">{recipe.servings}</span>
                  </div>
                </div>

                <div className="recipe-footer">
                  <span className="ingredient-count">
                    {recipe.ingredient_count} ingredient{recipe.ingredient_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
