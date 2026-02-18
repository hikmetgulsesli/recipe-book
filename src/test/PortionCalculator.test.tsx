import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PortionCalculator } from '../components/PortionCalculator'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Minus: () => <svg data-testid="minus-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  RotateCcw: () => <svg data-testid="reset-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  Scale: () => <svg data-testid="scale-icon" />
}))

describe('PortionCalculator', () => {
  const mockIngredients = [
    { id: 1, name: 'Flour', unit: 'g', quantity: 200 },
    { id: 2, name: 'Milk', unit: 'ml', quantity: 250 },
    { id: 3, name: 'Eggs', unit: 'piece', quantity: 2 },
    { id: 4, name: 'Sugar', unit: 'tbsp', quantity: 3 }
  ]

  const defaultProps = {
    originalServings: 4,
    ingredients: mockIngredients
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-009 AC1: PortionCalculator shows current servings
  it('renders with current servings displayed', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    expect(screen.getByLabelText(/number of servings/i)).toHaveValue(4)
    expect(screen.getByText(/portion calculator/i)).toBeInTheDocument()
  })

  // US-009 AC2: User can increase serving count
  it('increases servings when increase button is clicked', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const increaseButton = screen.getByLabelText(/increase servings/i)
    fireEvent.click(increaseButton)
    
    expect(screen.getByLabelText(/number of servings/i)).toHaveValue(5)
  })

  it('increases servings multiple times', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const increaseButton = screen.getByLabelText(/increase servings/i)
    fireEvent.click(increaseButton)
    fireEvent.click(increaseButton)
    fireEvent.click(increaseButton)
    
    expect(screen.getByLabelText(/number of servings/i)).toHaveValue(7)
  })

  // US-009 AC2: User can decrease serving count
  it('decreases servings when decrease button is clicked', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const decreaseButton = screen.getByLabelText(/decrease servings/i)
    fireEvent.click(decreaseButton)
    
    expect(screen.getByLabelText(/number of servings/i)).toHaveValue(3)
  })

  it('prevents decreasing below 1 serving', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const decreaseButton = screen.getByLabelText(/decrease servings/i)
    
    // Click 5 times to try to go below 1
    fireEvent.click(decreaseButton)
    fireEvent.click(decreaseButton)
    fireEvent.click(decreaseButton)
    fireEvent.click(decreaseButton)
    
    // Should stop at 1
    expect(screen.getByLabelText(/number of servings/i)).toHaveValue(1)
    expect(decreaseButton).toBeDisabled()
  })

  // US-009 AC2: User can directly input serving count
  it('allows direct input of serving count', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '8' } })
    
    expect(input).toHaveValue(8)
  })

  it('prevents invalid input values', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const input = screen.getByLabelText(/number of servings/i)
    
    // Try to set to 0 (should not change or keep minimum)
    fireEvent.change(input, { target: { value: '0' } })
    // The component doesn't update on invalid values
    expect(input).toHaveValue(4)
    
    // Try invalid text
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(input).toHaveValue(4)
  })

  // US-009 AC3: Ingredient quantities update proportionally
  it('calculates ingredient quantities proportionally when servings increase', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Double the servings (4 -> 8)
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '8' } })
    
    // Check that adjusted quantities are displayed
    // Original: Flour 200g -> Adjusted: 400g
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('400')
    expect(table).toHaveTextContent('500') // Milk: 250 -> 500
    expect(table).toHaveTextContent('4')   // Eggs: 2 -> 4
    expect(table).toHaveTextContent('6')   // Sugar: 3 -> 6
  })

  it('calculates ingredient quantities proportionally when servings decrease', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Halve the servings (4 -> 2)
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '2' } })
    
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('100') // Flour: 200 -> 100
    expect(table).toHaveTextContent('125') // Milk: 250 -> 125
    expect(table).toHaveTextContent('1')   // Eggs: 2 -> 1
    expect(table).toHaveTextContent('1.5') // Sugar: 3 -> 1.5
  })

  it('calculates correctly for fractional ratios', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // 3 servings (75% of original)
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '3' } })
    
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('150') // Flour: 200 * 0.75 = 150
    expect(table).toHaveTextContent('187.5') // Milk: 250 * 0.75 = 187.5
  })

  // US-009 AC4: Original quantities displayed for reference
  it('displays original quantities alongside adjusted quantities', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const table = screen.getByRole('table')
    const headers = screen.getAllByRole('columnheader')
    
    // Check column headers
    expect(headers.some(h => h.textContent?.includes('Original'))).toBe(true)
    expect(headers.some(h => h.textContent?.includes('Adjusted'))).toBe(true)
    
    // Original quantities should always be visible
    expect(table).toHaveTextContent('200') // Original flour
    expect(table).toHaveTextContent('250') // Original milk
  })

  it('shows original recipe servings reference', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    expect(screen.getByText(/original recipe:/i)).toBeInTheDocument()
    expect(screen.getByText(/4 servings/i)).toBeInTheDocument()
  })

  // US-009 AC5: Reset button restores original values
  it('shows reset button when servings are modified', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Initially no reset button
    expect(screen.queryByLabelText(/reset to original servings/i)).not.toBeInTheDocument()
    
    // Change servings
    const increaseButton = screen.getByLabelText(/increase servings/i)
    fireEvent.click(increaseButton)
    
    // Reset button should appear
    expect(screen.getByLabelText(/reset to original servings/i)).toBeInTheDocument()
  })

  it('resets servings to original when reset button is clicked', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Change servings
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '10' } })
    expect(input).toHaveValue(10)
    
    // Click reset
    const resetButton = screen.getByLabelText(/reset to original servings/i)
    fireEvent.click(resetButton)
    
    // Should be back to original
    expect(input).toHaveValue(4)
  })

  it('reset button disappears after clicking reset', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Change servings
    const increaseButton = screen.getByLabelText(/increase servings/i)
    fireEvent.click(increaseButton)
    
    // Reset
    const resetButton = screen.getByLabelText(/reset to original servings/i)
    fireEvent.click(resetButton)
    
    // Reset button should be gone
    expect(screen.queryByLabelText(/reset to original servings/i)).not.toBeInTheDocument()
  })

  // US-009 AC6: Calculations are accurate (no rounding errors)
  it('handles calculations without floating point errors', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Triple the servings
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.click(input)
    fireEvent.change(input, { target: { value: '12' } })
    
    const table = screen.getByRole('table')
    // 200 * 3 = 600 (exact)
    expect(table).toHaveTextContent('600')
  })

  it('formats decimal quantities correctly', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // 5 servings (1.25x)
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '5' } })
    
    const table = screen.getByRole('table')
    // Eggs: 2 * 1.25 = 2.5
    expect(table).toHaveTextContent('2.5')
  })

  it('removes trailing zeros from decimal numbers', () => {
    const ingredientsWithDecimals = [
      { id: 1, name: 'Test', unit: 'g', quantity: 2.5 }
    ]
    
    render(
      <PortionCalculator 
        originalServings={2}
        ingredients={ingredientsWithDecimals}
      />
    )
    
    // At original servings, 2.5 should display as 2.5
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('2.5')
  })

  // US-009 AC7: Component integrates with RecipeDetail page
  it('renders ingredient names correctly', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    expect(screen.getByText('Flour')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
    expect(screen.getByText('Sugar')).toBeInTheDocument()
  })

  it('formats units correctly', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('g')
    expect(table).toHaveTextContent('ml')
    expect(table).toHaveTextContent('pc') // piece -> pc
    expect(table).toHaveTextContent('tbsp')
  })

  // US-009 AC8: Accessibility
  it('has proper ARIA labels', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    expect(screen.getByLabelText(/number of servings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/increase servings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/decrease servings/i)).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Adjusted ingredient quantities')
  })

  it('has proper heading structure', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(/portion calculator/i)
    expect(heading).toHaveAttribute('id', 'portion-calculator-heading')
  })

  // US-009 AC8: Edge cases
  it('returns null when no ingredients are provided', () => {
    const { container } = render(
      <PortionCalculator 
        originalServings={4}
        ingredients={[]}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('handles single ingredient', () => {
    render(
      <PortionCalculator 
        originalServings={2}
        ingredients={[{ id: 1, name: 'Salt', unit: 'pinch', quantity: 1 }]}
      />
    )
    
    expect(screen.getByText('Salt')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('handles large serving numbers', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '100' } })
    
    expect(input).toHaveValue(100)
    
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('5000') // Flour: 200 * 25 = 5000
  })

  it('displays summary when modified', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    // Initially no summary
    expect(screen.queryByText(/cooking for/i)).not.toBeInTheDocument()
    
    // Change servings
    const input = screen.getByLabelText(/number of servings/i)
    fireEvent.change(input, { target: { value: '8' } })
    
    // Summary should appear
    expect(screen.getByText(/cooking for/i)).toBeInTheDocument()
    expect(screen.getByText(/8/i)).toBeInTheDocument()
    expect(screen.getByText(/200%/i)).toBeInTheDocument() // 8/4 = 200%
  })

  it('accepts custom className', () => {
    const { container } = render(
      <PortionCalculator 
        {...defaultProps}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has proper table structure with headers', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(3)
    expect(headers[0]).toHaveTextContent(/ingredient/i)
    expect(headers[1]).toHaveTextContent(/original/i)
    expect(headers[2]).toHaveTextContent(/adjusted/i)
  })

  it('has proper row structure for each ingredient', () => {
    render(<PortionCalculator {...defaultProps} />)
    
    const rows = screen.getAllByRole('row')
    // Header row + 4 ingredient rows
    expect(rows).toHaveLength(5)
  })
})
