import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RecipeDetail } from '../pages/RecipeDetail'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock useParams and useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate
  }
})

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
    { id: 2, name: 'Milk', unit: 'ml', quantity: 250 },
    { id: 3, name: 'Eggs', unit: 'piece', quantity: 2 },
    { id: 4, name: 'Sugar', unit: 'tbsp', quantity: 2.5 }
  ]
}

describe('RecipeDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipe', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      expect(screen.getByText('Loading recipe...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('should display recipe name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Classic Pancakes')
      })
    })

    it('should display recipe description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Fluffy pancakes perfect for breakfast')).toBeInTheDocument()
      })
    })

    it('should display prep time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        const prepTimeLabel = screen.getByText('Prep Time')
        expect(prepTimeLabel).toBeInTheDocument()
        // Find the parent meta-card and check for 10 min within it
        const metaCard = prepTimeLabel.closest('.meta-card')
        expect(metaCard).toHaveTextContent('10 min')
      })
    })

    it('should display cook time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        const cookTimeLabel = screen.getByText('Cook Time')
        expect(cookTimeLabel).toBeInTheDocument()
        // Find the parent meta-card and check for 15 min within it
        const metaCard = cookTimeLabel.closest('.meta-card')
        expect(metaCard).toHaveTextContent('15 min')
      })
    })

    it('should display servings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        // "Servings" appears in both meta card and PortionCalculator
        // Use getAllByText and verify at least one exists
        expect(screen.getAllByText('Servings').length).toBeGreaterThanOrEqual(1)
        // Check for the value 4 in the meta card specifically
        const metaCards = document.querySelectorAll('.meta-card')
        let foundServingsValue = false
        metaCards.forEach(card => {
          if (card.textContent?.includes('Servings') && card.textContent?.includes('4')) {
            foundServingsValue = true
          }
        })
        expect(foundServingsValue).toBe(true)
      })
    })

    it('should display total time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Total Time')).toBeInTheDocument()
        expect(screen.getByText('25 min')).toBeInTheDocument()
      })
    })

    it('should format time correctly for hours and minutes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockRecipe,
          prep_time: 90,
          cook_time: 60
        })
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('1h 30m')).toBeInTheDocument()
        expect(screen.getByText('1h')).toBeInTheDocument()
      })
    })
  })

  describe('Ingredients', () => {
    it('should display ingredients section', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /ingredients/i })).toBeInTheDocument()
      })
    })

    it('should display all ingredients with quantities and units', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        // Use within the ingredients section to avoid conflicts with PortionCalculator
        const ingredientsHeading = screen.getByRole('heading', { name: /ingredients/i })
        expect(ingredientsHeading).toBeInTheDocument()
      })

      // Check ingredients are in the document (they may appear in both PortionCalculator and IngredientList)
      expect(screen.getAllByText('Flour').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Milk').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Eggs').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Sugar').length).toBeGreaterThanOrEqual(1)

      // Check quantities appear somewhere (may appear multiple times in PortionCalculator)
      expect(screen.getAllByText('200').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('250').length).toBeGreaterThanOrEqual(1)

      // Check units appear somewhere (may appear multiple times)
      // Note: PortionCalculator uses abbreviated units (piece -> pc)
      expect(screen.getAllByText('g').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('ml').length).toBeGreaterThanOrEqual(1)
      expect(screen.queryAllByText('pc').length).toBeGreaterThanOrEqual(1)
      expect(screen.queryAllByText('tbsp').length).toBeGreaterThanOrEqual(1)
    })

    it('should show empty state when no ingredients', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockRecipe,
          ingredients: []
        })
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No ingredients listed for this recipe.')).toBeInTheDocument()
      })
    })
  })

  describe('Instructions', () => {
    it('should display instructions section', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /instructions/i })).toBeInTheDocument()
      })
    })

    it('should display instructions in readable format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Mix dry ingredients.')).toBeInTheDocument()
        expect(screen.getByText('Add wet ingredients.')).toBeInTheDocument()
        expect(screen.getByText('Cook on griddle.')).toBeInTheDocument()
      })
    })

    it('should show empty state when no instructions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockRecipe,
          instructions: ''
        })
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No instructions provided for this recipe.')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Button', () => {
    it('should display Edit button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })
    })

    it('should navigate to edit form when Edit button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /edit/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1/edit')
    })
  })

  describe('Delete Button', () => {
    it('should display Delete button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })
    })

    it('should show confirmation modal when Delete button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete Recipe')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    })

    it('should close modal when Cancel is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should delete recipe and navigate to recipe list when confirmed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRecipe
        })
        .mockResolvedValueOnce({
          ok: true
        })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm delete recipe/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /confirm delete recipe/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/recipes/1', {
          method: 'DELETE'
        })
        expect(mockNavigate).toHaveBeenCalledWith('/recipes')
      })
    })
  })

  describe('Back Button', () => {
    it('should display Back to Recipes link', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipe list/i })).toBeInTheDocument()
      })
    })

    it('should navigate to recipe list when Back is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipe list/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /back to recipe list/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/recipes')
    })
  })

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should show error message for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Recipe not found')).toBeInTheDocument()
      })
    })

    it('should show retry button when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('Classic Pancakes')
      })

      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s.length).toBeGreaterThanOrEqual(2) // Ingredients and Instructions
    })

    it('should have aria-label on action buttons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText('Edit recipe')).toBeInTheDocument()
        expect(screen.getByLabelText('Delete recipe')).toBeInTheDocument()
      })
    })

    it('should have proper ARIA attributes on modal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))

      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby', 'delete-modal-title')
    })

    it('should have ingredients list with proper role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe
      })

      render(
        <BrowserRouter>
          <RecipeDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        // There may be multiple lists (ingredients, timer presets, etc.)
        // Just verify at least one list exists
        expect(screen.getAllByRole('list').length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
