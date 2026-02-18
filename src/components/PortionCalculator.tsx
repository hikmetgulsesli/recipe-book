import { useState, useCallback, useMemo } from 'react'
import { Minus, Plus, RotateCcw, Users, Scale } from 'lucide-react'
import './PortionCalculator.css'

interface Ingredient {
  id: number
  name: string
  unit: string
  quantity: number
}

interface PortionCalculatorProps {
  originalServings: number
  ingredients: Ingredient[]
  className?: string
}

// Format quantity for display with proper decimal handling
function formatQuantity(quantity: number): string {
  // Round to avoid floating point errors, then format
  const rounded = Math.round(quantity * 100) / 100
  if (rounded === Math.floor(rounded)) {
    return rounded.toString()
  }
  return rounded.toFixed(2).replace(/\.?0+$/, '')
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

export function PortionCalculator({
  originalServings,
  ingredients,
  className = ''
}: PortionCalculatorProps) {
  const [currentServings, setCurrentServings] = useState(originalServings)

  // Calculate the ratio between current and original servings
  const ratio = useMemo(() => {
    return currentServings / originalServings
  }, [currentServings, originalServings])

  // Calculate adjusted quantities
  const adjustedIngredients = useMemo(() => {
    return ingredients.map(ingredient => ({
      ...ingredient,
      adjustedQuantity: ingredient.quantity * ratio
    }))
  }, [ingredients, ratio])

  // Check if values have been modified from original
  const isModified = currentServings !== originalServings

  const handleDecrease = useCallback(() => {
    setCurrentServings(prev => Math.max(1, prev - 1))
  }, [])

  const handleIncrease = useCallback(() => {
    setCurrentServings(prev => prev + 1)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 1) {
      setCurrentServings(value)
    }
  }, [])

  const handleReset = useCallback(() => {
    setCurrentServings(originalServings)
  }, [originalServings])

  if (ingredients.length === 0) {
    return null
  }

  return (
    <section 
      className={`portion-calculator ${className}`} 
      aria-labelledby="portion-calculator-heading"
    >
      {/* Header */}
      <div className="portion-calculator-header">
        <h2 id="portion-calculator-heading" className="portion-calculator-title">
          <Scale className="portion-calculator-icon" aria-hidden="true" />
          Portion Calculator
        </h2>
      </div>

      {/* Servings Control */}
      <div className="servings-control">
        <div className="servings-label">
          <Users className="servings-label-icon" aria-hidden="true" />
          <span>Servings</span>
        </div>
        
        <div className="servings-input-group">
          <button
            onClick={handleDecrease}
            className="servings-button decrease-button"
            aria-label="Decrease servings"
            type="button"
            disabled={currentServings <= 1}
          >
            <Minus className="servings-button-icon" aria-hidden="true" />
          </button>
          
          <input
            type="number"
            min="1"
            value={currentServings}
            onChange={handleInputChange}
            className="servings-input"
            aria-label="Number of servings"
          />
          
          <button
            onClick={handleIncrease}
            className="servings-button increase-button"
            aria-label="Increase servings"
            type="button"
          >
            <Plus className="servings-button-icon" aria-hidden="true" />
          </button>
        </div>

        {isModified && (
          <button
            onClick={handleReset}
            className="reset-button"
            aria-label="Reset to original servings"
            type="button"
          >
            <RotateCcw className="reset-button-icon" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {/* Original Reference */}
      <div className="original-reference">
        <span className="original-label">Original recipe:</span>
        <span className="original-value">{originalServings} servings</span>
      </div>

      {/* Ingredients Table */}
      <div className="ingredients-table-container">
        <table className="ingredients-table" role="table" aria-label="Adjusted ingredient quantities">
          <thead>
            <tr>
              <th scope="col" className="ingredient-col">Ingredient</th>
              <th scope="col" className="quantity-col">Original</th>
              <th scope="col" className="quantity-col adjusted">Adjusted</th>
            </tr>
          </thead>
          <tbody>
            {adjustedIngredients.map((ingredient) => (
              <tr 
                key={ingredient.id} 
                className={`ingredient-row ${isModified ? 'adjusted' : ''}`}
              >
                <td className="ingredient-name">{ingredient.name}</td>
                <td className="original-quantity">
                  <span className="quantity-value">
                    {formatQuantity(ingredient.quantity)}
                  </span>
                  <span className="quantity-unit">
                    {formatUnit(ingredient.unit)}
                  </span>
                </td>
                <td className="adjusted-quantity">
                  <span 
                    className="quantity-value"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {formatQuantity(ingredient.adjustedQuantity)}
                  </span>
                  <span className="quantity-unit">
                    {formatUnit(ingredient.unit)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {isModified && (
        <div className="portion-summary" role="status" aria-live="polite">
          <p>
            Cooking for <strong>{currentServings}</strong> people 
            ({formatQuantity(ratio * 100)}% of original recipe)
          </p>
        </div>
      )}
    </section>
  )
}

// Re-export types for convenience
export type { Ingredient, PortionCalculatorProps }
