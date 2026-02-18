import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { RecipeList } from '../pages/RecipeList'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('RecipeList Component', () => {
  const mockRecipes = [
    {
      id: 1,
      name: 'Classic Pancakes',
      description: 'Fluffy pancakes perfect for breakfast',
      prep_time: 10,
      cook_time: 15,
      servings: 4,
      ingredient_count: 6
    },
    {
      id: 2,
      name: 'Simple Tomato Pasta',
      description: 'Quick and easy pasta dish',
      prep_time: 5,
      cook_time: 20,
      servings: 2,
      ingredient_count: 5
    },
    {
      id: 3,
      name: 'Lemon Chicken Rice',
      description: 'A zesty chicken and rice dish',
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      ingredient_count: 8
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipes', async () => {
      // Delay the fetch to ensure loading state is visible
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<RecipeList />)

      expect(screen.getByText('Loading recipes...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('should display all recipes from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('Classic Pancakes')).toBeInTheDocument()
      })

      expect(screen.getByText('Simple Tomato Pasta')).toBeInTheDocument()
      expect(screen.getByText('Lemon Chicken Rice')).toBeInTheDocument()
    })

    it('should display recipe cards with name, prep time, cook time, and servings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRecipes[0]]
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('Classic Pancakes')).toBeInTheDocument()
      })

      // Check for prep time, cook time, and servings
      expect(screen.getByText('Prep:')).toBeInTheDocument()
      expect(screen.getByText('10 min')).toBeInTheDocument()
      expect(screen.getByText('Cook:')).toBeInTheDocument()
      expect(screen.getByText('15 min')).toBeInTheDocument()
      expect(screen.getByText('Serves:')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should show ingredient count on each card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRecipes[0]]
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('6 ingredients')).toBeInTheDocument()
      })
    })

    it('should handle singular ingredient count correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...mockRecipes[0], ingredient_count: 1 }]
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('1 ingredient')).toBeInTheDocument()
      })
    })

    it('should truncate long descriptions', async () => {
      const longDescription = 'A'.repeat(150)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...mockRecipes[0], description: longDescription }]
      })

      render(<RecipeList />)

      await waitFor(() => {
        const description = screen.getByText(/A+\.\.\./)
        expect(description).toBeInTheDocument()
      })
    })

    it('should format time correctly for hours and minutes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...mockRecipes[0], prep_time: 90, cook_time: 60 }]
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('1h 30m')).toBeInTheDocument()
        expect(screen.getByText('1h')).toBeInTheDocument()
      })
    })
  })

  describe('New Recipe Button', () => {
    it('should show New Recipe button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('New Recipe')).toBeInTheDocument()
      })
    })

    it('should call onNewRecipeClick when New Recipe button is clicked', async () => {
      const onNewRecipeClick = vi.fn()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList onNewRecipeClick={onNewRecipeClick} />)

      await waitFor(() => {
        expect(screen.getByText('New Recipe')).toBeInTheDocument()
      })

      const newRecipeButton = screen.getAllByText('New Recipe')[0]
      fireEvent.click(newRecipeButton)

      expect(onNewRecipeClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Recipe Card Click', () => {
    it('should call onRecipeClick when a recipe card is clicked', async () => {
      const onRecipeClick = vi.fn()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList onRecipeClick={onRecipeClick} />)

      await waitFor(() => {
        expect(screen.getByText('Classic Pancakes')).toBeInTheDocument()
      })

      const recipeCard = screen.getByRole('listitem', { name: /Classic Pancakes/ })
      fireEvent.click(recipeCard)

      expect(onRecipeClick).toHaveBeenCalledWith(1)
    })

    it('should call onRecipeClick when Enter key is pressed on a card', async () => {
      const onRecipeClick = vi.fn()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList onRecipeClick={onRecipeClick} />)

      await waitFor(() => {
        expect(screen.getByText('Classic Pancakes')).toBeInTheDocument()
      })

      const recipeCard = screen.getByRole('listitem', { name: /Classic Pancakes/ })
      fireEvent.keyDown(recipeCard, { key: 'Enter' })

      expect(onRecipeClick).toHaveBeenCalledWith(1)
    })

    it('should call onRecipeClick when Space key is pressed on a card', async () => {
      const onRecipeClick = vi.fn()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList onRecipeClick={onRecipeClick} />)

      await waitFor(() => {
        expect(screen.getByText('Classic Pancakes')).toBeInTheDocument()
      })

      const recipeCard = screen.getByRole('listitem', { name: /Classic Pancakes/ })
      fireEvent.keyDown(recipeCard, { key: ' ' })

      expect(onRecipeClick).toHaveBeenCalledWith(1)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no recipes exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('No recipes yet')).toBeInTheDocument()
      })

      expect(screen.getByText('Create your first recipe to get started')).toBeInTheDocument()
    })

    it('should show Create Recipe button in empty state', async () => {
      const onNewRecipeClick = vi.fn()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      render(<RecipeList onNewRecipeClick={onNewRecipeClick} />)

      await waitFor(() => {
        expect(screen.getByText('Create Recipe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Create Recipe'))
      expect(onNewRecipeClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should show error message for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch recipes')).toBeInTheDocument()
      })
    })

    it('should retry fetch when retry button is clicked', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRecipes
        })

      render(<RecipeList />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Try Again'))

      await waitFor(() => {
        expect(screen.getByText('Classic Pancakes')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on recipe cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRecipes[0]]
      })

      render(<RecipeList />)

      await waitFor(() => {
        const recipeCard = screen.getByRole('listitem')
        expect(recipeCard).toHaveAttribute('aria-label', 'Classic Pancakes, 4 servings, 25 min total time')
      })
    })

    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList />)

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 })
        expect(mainHeading).toHaveTextContent('My Recipes')
      })

      const recipeHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(recipeHeadings.length).toBeGreaterThan(0)
    })

    it('should make recipe cards keyboard accessible', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRecipes[0]]
      })

      render(<RecipeList />)

      await waitFor(() => {
        const recipeCard = screen.getByRole('listitem', { name: /Classic Pancakes/ })
        expect(recipeCard).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should have aria-label on New Recipe button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes
      })

      render(<RecipeList />)

      await waitFor(() => {
        const newRecipeButton = screen.getAllByLabelText('Create new recipe')[0]
        expect(newRecipeButton).toBeInTheDocument()
      })
    })
  })
})
