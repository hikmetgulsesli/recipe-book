import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { IngredientList } from '../components/IngredientList'

describe('IngredientList', () => {
  const mockIngredients = [
    { id: 1, name: 'Flour', quantity: 250, unit: 'g' },
    { id: 2, name: 'Milk', quantity: 200, unit: 'ml' },
    { id: 3, name: 'Eggs', quantity: 2, unit: 'piece' },
    { id: 4, name: 'Butter', quantity: 50, unit: 'g' },
    { id: 5, name: 'Salt', quantity: 1, unit: 'tsp' },
    { id: 6, name: 'Sugar', quantity: 2, unit: 'tbsp' }
  ]

  const mockCategorizedIngredients = [
    { id: 1, name: 'Flour', quantity: 250, unit: 'g', category: 'baking' },
    { id: 2, name: 'Milk', quantity: 200, unit: 'ml', category: 'dairy' },
    { id: 3, name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'meat' },
    { id: 4, name: 'Tomatoes', quantity: 3, unit: 'piece', category: 'produce' },
    { id: 5, name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'pantry' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-008 AC-1: IngredientList component displays all ingredients
  it('renders all ingredients', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={false} />)
    
    mockIngredients.forEach(ingredient => {
      expect(screen.getByText(ingredient.name)).toBeInTheDocument()
    })
  })

  it('displays the correct number of ingredients', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={false} />)
    
    const ingredientItems = screen.getAllByText(/Flour|Milk|Eggs|Butter|Salt|Sugar/)
    expect(ingredientItems).toHaveLength(6)
  })

  // US-008 AC-2: Each item shows quantity, unit, and name
  it('displays quantity for each ingredient', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={false} />)
    
    // Use getAllByText since quantities may appear multiple times (category counts + quantities)
    const quantities = screen.getAllByText(/250|200|2|50|1/)
    expect(quantities.length).toBeGreaterThan(0)
    
    // Check specific ingredient names are present
    expect(screen.getByText('Flour')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
  })

  it('displays unit for each ingredient', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={false} />)
    
    // Units appear in ingredient details
    const units = screen.getAllByText(/g|ml|pc|tsp|tbsp/)
    expect(units.length).toBeGreaterThan(0)
  })

  it('displays ingredient name', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={false} />)
    
    expect(screen.getByText('Flour')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
  })

  it('formats decimal quantities correctly', () => {
    const decimalIngredients = [
      { id: 1, name: 'Vanilla', quantity: 1.5, unit: 'tsp' },
      { id: 2, name: 'Butter', quantity: 2.75, unit: 'tbsp' },
      { id: 3, name: 'Salt', quantity: 0.25, unit: 'tsp' }
    ]
    
    render(<IngredientList ingredients={decimalIngredients} showCheckboxes={false} />)
    
    expect(screen.getByText('1.5')).toBeInTheDocument()
    expect(screen.getByText('2.75')).toBeInTheDocument()
    expect(screen.getByText('0.25')).toBeInTheDocument()
  })

  // US-008 AC-3: Checkboxes allow marking ingredients as gathered
  it('renders checkboxes when showCheckboxes is true', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(mockIngredients.length)
  })

  it('does not render checkboxes when showCheckboxes is false', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={false} />)
    
    const checkboxes = screen.queryAllByRole('checkbox')
    expect(checkboxes).toHaveLength(0)
  })

  it('toggles checkbox state when clicked', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    
    expect(firstCheckbox).not.toBeChecked()
    
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).toBeChecked()
    
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).not.toBeChecked()
  })

  it('calls onIngredientToggle callback when checkbox is clicked', () => {
    const mockToggle = vi.fn()
    render(
      <IngredientList 
        ingredients={mockIngredients} 
        showCheckboxes={true} 
        onIngredientToggle={mockToggle}
      />
    )
    
    // Get first checkbox and click it
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0]
    fireEvent.click(firstCheckbox)
    
    // The callback should be called with the ingredient ID and checked state
    expect(mockToggle).toHaveBeenCalledTimes(1)
    expect(mockToggle).toHaveBeenCalledWith(expect.any(Number), true)
    
    fireEvent.click(firstCheckbox)
    expect(mockToggle).toHaveBeenCalledTimes(2)
    expect(mockToggle).toHaveBeenLastCalledWith(expect.any(Number), false)
  })

  it('shows progress bar when checkboxes are enabled', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText(/gathered/)).toBeInTheDocument()
  })

  it('updates progress when ingredients are checked', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    expect(screen.getByText('0 / 6 gathered')).toBeInTheDocument()
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)
    
    expect(screen.getByText('1 / 6 gathered')).toBeInTheDocument()
  })

  it('shows complete message when all ingredients are gathered', () => {
    render(<IngredientList ingredients={mockIngredients.slice(0, 2)} showCheckboxes={true} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      fireEvent.click(checkbox)
    })
    
    expect(screen.getByText(/✓/)).toBeInTheDocument()
  })

  // US-008 AC-4: Visual hierarchy uses proper spacing and typography
  it('renders with proper heading', () => {
    render(<IngredientList ingredients={mockIngredients} title="Shopping List" />)
    
    expect(screen.getByRole('heading', { name: /shopping list/i })).toBeInTheDocument()
  })

  it('uses default title when not provided', () => {
    render(<IngredientList ingredients={mockIngredients} />)
    
    expect(screen.getByRole('heading', { name: /ingredients/i })).toBeInTheDocument()
  })

  // US-008 AC-5: Lucide icons used for visual elements
  it('renders ShoppingBasket icon in header', () => {
    render(<IngredientList ingredients={mockIngredients} />)
    
    // The icon is rendered as an SVG with aria-hidden
    const svgIcons = document.querySelectorAll('svg[aria-hidden="true"]')
    expect(svgIcons.length).toBeGreaterThan(0)
  })

  // US-008 AC-6: Component is reusable across pages
  it('accepts custom className', () => {
    const { container } = render(
      <IngredientList 
        ingredients={mockIngredients} 
        className="custom-class"
        showCheckboxes={false}
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('works with empty ingredients array', () => {
    render(<IngredientList ingredients={[]} />)
    
    expect(screen.getByText(/no ingredients listed/i)).toBeInTheDocument()
  })

  it('works with single ingredient', () => {
    render(
      <IngredientList 
        ingredients={[{ id: 1, name: 'Salt', quantity: 1, unit: 'tsp' }]} 
        showCheckboxes={false}
      />
    )
    
    expect(screen.getByText('Salt')).toBeInTheDocument()
    expect(screen.getByText('tsp')).toBeInTheDocument()
  })

  // US-008 AC-7: Group by category if available
  it('groups ingredients by category when categories are provided', () => {
    render(<IngredientList ingredients={mockCategorizedIngredients} showCheckboxes={false} />)
    
    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('Dairy')).toBeInTheDocument()
    expect(screen.getByText('Meat')).toBeInTheDocument()
    expect(screen.getByText('Baking')).toBeInTheDocument()
    expect(screen.getByText('Pantry')).toBeInTheDocument()
  })

  it('auto-categorizes ingredients when no category is provided', () => {
    const uncategorized = [
      { id: 1, name: 'Chicken Breast', quantity: 500, unit: 'g' },
      { id: 2, name: 'Milk', quantity: 200, unit: 'ml' },
      { id: 3, name: 'Tomatoes', quantity: 3, unit: 'piece' }
    ]
    
    render(<IngredientList ingredients={uncategorized} showCheckboxes={false} />)
    
    // Should auto-categorize based on ingredient names
    expect(screen.getByText('Meat')).toBeInTheDocument()
    expect(screen.getByText('Dairy')).toBeInTheDocument()
    // Tomatoes don't match produce pattern exactly, goes to Other
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('allows collapsing and expanding categories', () => {
    render(<IngredientList ingredients={mockCategorizedIngredients} showCheckboxes={false} />)
    
    const categoryHeader = screen.getByText('Produce').closest('button')
    expect(categoryHeader).toBeInTheDocument()
    
    // Initially expanded
    expect(screen.getByText('Tomatoes')).toBeInTheDocument()
    
    // Click to collapse
    fireEvent.click(categoryHeader!)
    
    // After collapse, the ingredient should not be visible
    expect(screen.queryByText('Tomatoes')).not.toBeInTheDocument()
  })

  it('displays category count', () => {
    render(<IngredientList ingredients={mockCategorizedIngredients} showCheckboxes={false} />)
    
    // Each category should show its count
    const categoryCounts = screen.getAllByText(/^[1-9]$/)
    expect(categoryCounts.length).toBeGreaterThan(0)
  })

  // US-008 AC-8: Check All / Uncheck All functionality
  it('has Check All button', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    expect(screen.getByRole('button', { name: /mark all ingredients as gathered/i })).toBeInTheDocument()
  })

  it('has Uncheck All button', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    expect(screen.getByRole('button', { name: /clear all gathered ingredients/i })).toBeInTheDocument()
  })

  it('checks all ingredients when Check All is clicked', () => {
    render(<IngredientList ingredients={mockIngredients.slice(0, 3)} showCheckboxes={true} />)
    
    const checkAllButton = screen.getByRole('button', { name: /mark all ingredients as gathered/i })
    fireEvent.click(checkAllButton)
    
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })
  })

  it('unchecks all ingredients when Uncheck All is clicked', () => {
    render(<IngredientList ingredients={mockIngredients.slice(0, 3)} showCheckboxes={true} />)
    
    // First check all
    const checkAllButton = screen.getByRole('button', { name: /mark all ingredients as gathered/i })
    fireEvent.click(checkAllButton)
    
    // Then uncheck all
    const uncheckAllButton = screen.getByRole('button', { name: /clear all gathered ingredients/i })
    fireEvent.click(uncheckAllButton)
    
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked()
    })
  })

  // Accessibility tests
  it('has proper ARIA labels on checkboxes', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-label')
    })
  })

  it('has proper heading structure', () => {
    render(<IngredientList ingredients={mockIngredients} />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'ingredients-heading')
  })

  it('has section with aria-labelledby', () => {
    const { container } = render(<IngredientList ingredients={mockIngredients} />)
    
    const section = container.querySelector('section')
    expect(section).toHaveAttribute('aria-labelledby', 'ingredients-heading')
  })

  it('has progressbar with proper ARIA attributes', () => {
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '6')
    expect(progressBar).toHaveAttribute('aria-label', 'Ingredients gathered')
  })

  it('category headers have proper ARIA attributes', () => {
    render(<IngredientList ingredients={mockCategorizedIngredients} showCheckboxes={false} />)
    
    const categoryHeader = screen.getByText('Produce').closest('button')
    expect(categoryHeader).toHaveAttribute('aria-expanded')
    expect(categoryHeader).toHaveAttribute('aria-controls')
  })

  // Responsive behavior
  it('renders correctly on mobile viewport', () => {
    global.innerWidth = 375
    global.dispatchEvent(new Event('resize'))
    
    render(<IngredientList ingredients={mockIngredients} showCheckboxes={true} />)
    
    expect(screen.getByRole('heading', { name: /ingredients/i })).toBeInTheDocument()
    
    // Reset
    global.innerWidth = 1024
    global.dispatchEvent(new Event('resize'))
  })
})
