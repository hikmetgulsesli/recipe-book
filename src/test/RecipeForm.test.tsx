import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RecipeForm } from '../pages/RecipeForm'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock useParams and useNavigate
const mockNavigate = vi.fn()
let mockParams: { id?: string } = {}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate
  }
})

const mockIngredients = [
  { id: 1, name: 'Flour', unit: 'g', created_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Milk', unit: 'ml', created_at: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'Eggs', unit: 'piece', created_at: '2024-01-01T00:00:00Z' },
  { id: 4, name: 'Sugar', unit: 'tbsp', created_at: '2024-01-01T00:00:00Z' }
]

const mockRecipe = {
  id: 1,
  name: 'Classic Pancakes',
  description: 'Fluffy pancakes perfect for breakfast',
  instructions: 'Mix dry ingredients.\nAdd wet ingredients.\nCook on griddle.',
  prep_time: 10,
  cook_time: 15,
  servings: 4,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ingredients: [
    { id: 1, name: 'Flour', unit: 'g', quantity: 200 },
    { id: 2, name: 'Milk', unit: 'ml', quantity: 250 }
  ]
}

describe('RecipeForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams = {}
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockIngredients })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form title', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add New Recipe')
      })
    })

    it('should render form subtitle', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a new recipe with ingredients and instructions')).toBeInTheDocument()
      })
    })

    it('should have empty form fields initially', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toHaveValue('')
      })

      expect(screen.getByLabelText(/description/i)).toHaveValue('')
      expect(screen.getByLabelText(/instructions/i)).toHaveValue('')
    })
  })

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockParams = { id: '1' }
    })

    it('should render edit form title', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRecipe })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit Recipe')
      })
    })

    it('should populate form with recipe data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRecipe })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Classic Pancakes')
      })

      expect(screen.getByLabelText(/description/i)).toHaveValue('Fluffy pancakes perfect for breakfast')
      expect(screen.getByLabelText(/instructions/i)).toHaveValue('Mix dry ingredients.\nAdd wet ingredients.\nCook on griddle.')
    })

    it('should populate time and servings fields', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRecipe })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/prep time/i)).toHaveValue(10)
      })

      expect(screen.getByLabelText(/cook time/i)).toHaveValue(15)
      expect(screen.getByLabelText(/servings/i)).toHaveValue(4)
    })

    it('should show loading state while fetching recipe', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      expect(screen.getByText('Loading recipe...')).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should have name input field', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument()
      })
    })

    it('should have description textarea', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      })
    })

    it('should have prep time input', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument()
      })
    })

    it('should have cook time input', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument()
      })
    })

    it('should have servings input', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/servings/i)).toBeInTheDocument()
      })
    })

    it('should have instructions textarea', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument()
      })
    })
  })

  describe('Ingredient Management', () => {
    it('should show empty ingredients state initially', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No ingredients added yet.')).toBeInTheDocument()
      })
    })

    it('should add ingredient row when add button is clicked', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No ingredients added yet.')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add your first ingredient/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Ingredient 1')).toBeInTheDocument()
      })
    })

    it('should populate ingredient selector from API', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add your first ingredient/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add your first ingredient/i }))

      await waitFor(() => {
        const select = screen.getByLabelText('Ingredient 1')
        expect(select).toBeInTheDocument()
      })

      // Check that ingredients are loaded
      expect(mockFetch).toHaveBeenCalledWith('/api/ingredients')
    })

    it('should remove ingredient row when remove button is clicked', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add your first ingredient/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add your first ingredient/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Ingredient 1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /remove ingredient 1/i }))

      await waitFor(() => {
        expect(screen.queryByLabelText('Ingredient 1')).not.toBeInTheDocument()
      })
    })

    it('should show unit label when ingredient is selected', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add your first ingredient/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /add your first ingredient/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Ingredient 1')).toBeInTheDocument()
      })

      const select = screen.getByLabelText('Ingredient 1')
      fireEvent.change(select, { target: { value: '1' } })

      await waitFor(() => {
        expect(screen.getByText('g')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should show error when name is empty on submit', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText('Recipe name is required')).toBeInTheDocument()
      })
    })

    it('should show error when instructions are empty on submit', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText('Instructions are required')).toBeInTheDocument()
      })
    })

    it('should show error for negative prep time', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument()
      })

      const prepTimeInput = screen.getByLabelText(/prep time/i)
      fireEvent.change(prepTimeInput, { target: { value: '-5' } })
      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText('Prep time must be a non-negative number')).toBeInTheDocument()
      })
    })

    it('should show error for negative cook time', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument()
      })

      const cookTimeInput = screen.getByLabelText(/cook time/i)
      fireEvent.change(cookTimeInput, { target: { value: '-10' } })
      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText('Cook time must be a non-negative number')).toBeInTheDocument()
      })
    })

    it('should show error for invalid servings', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/servings/i)).toBeInTheDocument()
      })

      const servingsInput = screen.getByLabelText(/servings/i)
      fireEvent.change(servingsInput, { target: { value: '0' } })
      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText('Servings must be at least 1')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      // First call for ingredients, second for create
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...mockRecipe, id: 5 } })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument()
      })

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Test Recipe' } })
      fireEvent.change(screen.getByLabelText(/instructions/i), { target: { value: 'Test instructions' } })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Recipe')
        })
      })
    })

    it('should navigate to recipe detail after successful create', async () => {
      // First call for ingredients, second for create
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...mockRecipe, id: 5 } })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Test Recipe' } })
      fireEvent.change(screen.getByLabelText(/instructions/i), { target: { value: 'Test instructions' } })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/recipes/5')
      })
    })

    it('should show loading state while saving', async () => {
      // First call for ingredients, second for create (hanging)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockImplementationOnce(() => new Promise(() => {}))

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Test Recipe' } })
      fireEvent.change(screen.getByLabelText(/instructions/i), { target: { value: 'Test instructions' } })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create recipe/i })).toBeDisabled()
      })
    })

    it('should update existing recipe in edit mode', async () => {
      mockParams = { id: '1' }
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRecipe })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...mockRecipe, name: 'Updated Recipe' } })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Classic Pancakes')
      })

      fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Updated Recipe' } })
      fireEvent.click(screen.getByRole('button', { name: /save recipe changes/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/recipes/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Updated Recipe')
        })
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate back to recipes when cancel clicked in create mode', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/recipes')
    })

    it('should navigate back to recipe detail when cancel clicked in edit mode', async () => {
      mockParams = { id: '1' }
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRecipe })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1')
    })

    it('should navigate back when back link is clicked', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /go back/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/recipes')
    })
  })

  describe('Error Handling', () => {
    it('should show error when fetch ingredients fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should show server validation errors', async () => {
      // First call for ingredients, second for create (which fails)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockIngredients })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: {
              message: 'Validation failed',
              details: [{ field: 'name', message: 'Name already exists' }]
            }
          })
        })

      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Test Recipe' } })
      fireEvent.change(screen.getByLabelText(/instructions/i), { target: { value: 'Test instructions' } })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText('Name already exists')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toBeInTheDocument()
      })

      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s.length).toBeGreaterThanOrEqual(2)
    })

    it('should have aria-invalid on invalid fields', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have aria-describedby linking to error message', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/recipe name/i)
        const errorId = nameInput.getAttribute('aria-describedby')
        expect(errorId).toBeTruthy()
        expect(document.getElementById(errorId!)).toHaveTextContent('Recipe name is required')
      })
    })

    it('should have aria-label on icon-only buttons', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /add ingredient/i })).toHaveAttribute('aria-label')
    })

    it('should have required field indicators', async () => {
      render(
        <BrowserRouter>
          <RecipeForm />
        </BrowserRouter>
      )

      await waitFor(() => {
        const nameLabel = screen.getByText(/recipe name/i).closest('label')
        expect(nameLabel).toHaveTextContent('*')
      })
    })
  })
})
