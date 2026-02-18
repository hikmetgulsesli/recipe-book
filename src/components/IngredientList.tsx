import { useState, useCallback } from 'react'
import { Check, Circle, ChefHat, ShoppingBasket } from 'lucide-react'
import './IngredientList.css'

interface Ingredient {
  id: number
  name: string
  unit: string
  quantity: number
  category?: string
}

interface IngredientListProps {
  ingredients: Ingredient[]
  title?: string
  showCheckboxes?: boolean
  onIngredientToggle?: (ingredientId: number, isChecked: boolean) => void
  className?: string
}

// Helper to guess category from ingredient name
function guessCategory(name: string): string {
  const lower = name.toLowerCase()
  
  // Produce
  if (/\b(apple|banana|orange|tomato|onion|garlic|potato|carrot|lettuce|spinach|pepper|lemon|lime|herb|parsley|basil|mint|cilantro|ginger|mushroom|zucchini|cucumber|celery|broccoli|cauliflower|avocado|berry|fruit|vegetable)\b/.test(lower)) {
    return 'produce'
  }
  
  // Dairy
  if (/\b(milk|cheese|butter|cream|yogurt|egg|mozzarella|cheddar|parmesan|feta|ricotta)\b/.test(lower)) {
    return 'dairy'
  }
  
  // Meat
  if (/\b(chicken|beef|pork|lamb|turkey|bacon|sausage|ham|meat|steak|ground)\b/.test(lower)) {
    return 'meat'
  }
  
  // Seafood
  if (/\b(fish|salmon|tuna|shrimp|prawn|crab|lobster|scallop|cod|seafood)\b/.test(lower)) {
    return 'seafood'
  }
  
  // Spices & Herbs
  if (/\b(salt|pepper|cumin|paprika|cinnamon|nutmeg|oregano|thyme|rosemary|spice|seasoning|powder|flakes)\b/.test(lower)) {
    return 'spices'
  }
  
  // Baking
  if (/\b(flour|sugar|baking|yeast|vanilla|chocolate|honey|syrup|oil|vinegar)\b/.test(lower)) {
    return 'baking'
  }
  
  // Pantry
  if (/\b(rice|pasta|noodle|bean|lentil|can|sauce|broth|stock|oil|vinegar|cereal|grain|bread)\b/.test(lower)) {
    return 'pantry'
  }
  
  return 'other'
}

// Group ingredients by category
function groupByCategory(ingredients: Ingredient[]): Record<string, Ingredient[]> {
  const groups: Record<string, Ingredient[]> = {}
  
  ingredients.forEach(ingredient => {
    const category = ingredient.category || guessCategory(ingredient.name)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push({ ...ingredient, category })
  })
  
  // Sort categories in preferred order
  const categoryOrder = ['produce', 'dairy', 'meat', 'seafood', 'pantry', 'baking', 'spices', 'frozen', 'beverages', 'other']
  const sortedGroups: Record<string, Ingredient[]> = {}
  
  categoryOrder.forEach(cat => {
    if (groups[cat]) {
      sortedGroups[cat] = groups[cat]
    }
  })
  
  // Add any remaining categories not in the order
  Object.keys(groups).forEach(cat => {
    if (!sortedGroups[cat]) {
      sortedGroups[cat] = groups[cat]
    }
  })
  
  return sortedGroups
}

// Format quantity for display
function formatQuantity(quantity: number): string {
  if (quantity === Math.floor(quantity)) {
    return quantity.toString()
  }
  return quantity.toFixed(2).replace(/\.?0+$/, '')
}

// Format unit for display
function formatUnit(unit: string): string {
  const unitLabels: Record<string, string> = {
    g: 'g',
    ml: 'ml',
    piece: 'pc',
    tbsp: 'tbsp',
    tsp: 'tsp',
    cup: 'cup',
    pinch: 'pinch'
  }
  return unitLabels[unit] || unit
}

// Format category name for display
function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function IngredientList({
  ingredients,
  title = 'Ingredients',
  showCheckboxes = true,
  onIngredientToggle,
  className = ''
}: IngredientListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Initialize all categories as expanded
  const groupedIngredients = groupByCategory(ingredients)
  const categories = Object.keys(groupedIngredients)
  
  // Auto-expand categories on first render
  if (expandedCategories.size === 0 && categories.length > 0) {
    setExpandedCategories(new Set(categories))
  }

  const handleToggle = useCallback((ingredientId: number) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev)
      const isChecked = !newSet.has(ingredientId)
      
      if (isChecked) {
        newSet.add(ingredientId)
      } else {
        newSet.delete(ingredientId)
      }
      
      if (onIngredientToggle) {
        onIngredientToggle(ingredientId, isChecked)
      }
      
      return newSet
    })
  }, [onIngredientToggle])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }, [])

  const checkAll = useCallback(() => {
    const allIds = ingredients.map(i => i.id)
    setCheckedItems(new Set(allIds))
    if (onIngredientToggle) {
      allIds.forEach(id => onIngredientToggle(id, true))
    }
  }, [ingredients, onIngredientToggle])

  const uncheckAll = useCallback(() => {
    if (onIngredientToggle) {
      checkedItems.forEach(id => onIngredientToggle(id, false))
    }
    setCheckedItems(new Set())
  }, [checkedItems, onIngredientToggle])

  const gatheredCount = checkedItems.size
  const totalCount = ingredients.length
  const progress = totalCount > 0 ? (gatheredCount / totalCount) * 100 : 0
  const allGathered = gatheredCount === totalCount && totalCount > 0

  if (ingredients.length === 0) {
    return (
      <section className={`ingredient-list-container ${className}`} aria-labelledby="ingredients-heading">
        <div className="ingredient-list-header">
          <h2 id="ingredients-heading" className="ingredient-list-title">
            <ChefHat className="ingredient-list-icon" aria-hidden="true" />
            {title}
          </h2>
        </div>
        <p className="ingredient-list-empty">No ingredients listed for this recipe.</p>
      </section>
    )
  }

  return (
    <section className={`ingredient-list-container ${className}`} aria-labelledby="ingredients-heading">
      {/* Header */}
      <div className="ingredient-list-header">
        <h2 id="ingredients-heading" className="ingredient-list-title">
          <ShoppingBasket className="ingredient-list-icon" aria-hidden="true" />
          {title}
        </h2>
        
        {showCheckboxes && (
          <div className="ingredient-list-actions">
            <button
              onClick={checkAll}
              className="ingredient-action-button"
              aria-label="Mark all ingredients as gathered"
              type="button"
            >
              <Check className="action-button-icon" aria-hidden="true" />
              All
            </button>
            <button
              onClick={uncheckAll}
              className="ingredient-action-button"
              aria-label="Clear all gathered ingredients"
              type="button"
            >
              <Circle className="action-button-icon" aria-hidden="true" />
              None
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showCheckboxes && (
        <div className="ingredient-progress" role="progressbar" aria-valuenow={gatheredCount} aria-valuemax={totalCount} aria-label="Ingredients gathered">
          <div className="ingredient-progress-bar" style={{ width: `${progress}%` }} />
          <span className={`ingredient-progress-text ${allGathered ? 'complete' : ''}`}>
            {gatheredCount} / {totalCount} gathered
            {allGathered && ' ✓'}
          </span>
        </div>
      )}

      {/* Ingredients by Category */}
      <div className="ingredient-categories">
        {categories.map((category, categoryIndex) => (
          <div 
            key={category} 
            className="ingredient-category"
            style={{ '--category-index': categoryIndex } as React.CSSProperties}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="category-header"
              aria-expanded={expandedCategories.has(category)}
              aria-controls={`category-${category}`}
              type="button"
            >
              <span className="category-name">{formatCategoryName(category)}</span>
              <span className="category-count">
                {groupedIngredients[category].length}
              </span>
              <span className="category-toggle-icon" aria-hidden="true">
                {expandedCategories.has(category) ? '−' : '+'}
              </span>
            </button>

            {/* Category Items */}
            {expandedCategories.has(category) && (
              <ul 
                id={`category-${category}`} 
                className="category-items"
                role="list"
              >
                {groupedIngredients[category].map((ingredient, index) => {
                  const isChecked = checkedItems.has(ingredient.id)
                  
                  return (
                    <li 
                      key={ingredient.id}
                      className={`ingredient-item ${isChecked ? 'checked' : ''}`}
                      style={{ '--item-index': index } as React.CSSProperties}
                    >
                      {showCheckboxes ? (
                        <label className="ingredient-label">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(ingredient.id)}
                            className="ingredient-checkbox"
                            aria-label={`${formatQuantity(ingredient.quantity)} ${formatUnit(ingredient.unit)} ${ingredient.name}`}
                          />
                          <span className="ingredient-checkbox-visual" aria-hidden="true">
                            {isChecked && <Check className="checkbox-check-icon" />}
                          </span>
                          <span className="ingredient-details">
                            <span className="ingredient-quantity">{formatQuantity(ingredient.quantity)}</span>
                            <span className="ingredient-unit">{formatUnit(ingredient.unit)}</span>
                            <span className="ingredient-name">{ingredient.name}</span>
                          </span>
                        </label>
                      ) : (
                        <div className="ingredient-details">
                          <span className="ingredient-quantity">{formatQuantity(ingredient.quantity)}</span>
                          <span className="ingredient-unit">{formatUnit(ingredient.unit)}</span>
                          <span className="ingredient-name">{ingredient.name}</span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// Re-export types for convenience
export type { Ingredient, IngredientListProps }
