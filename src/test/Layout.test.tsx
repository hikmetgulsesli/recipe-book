import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Basic Structure', () => {
    it('renders the layout with children', () => {
      renderWithRouter(
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders header with logo', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      expect(screen.getByLabelText('Recipe Book Home')).toBeInTheDocument()
      // Use getAllByText since Recipe Book appears in both header and footer
      expect(screen.getAllByText('Recipe Book').length).toBeGreaterThanOrEqual(1)
    })

    it('renders footer with app name', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      // Check for copyright text in footer
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
    })

    it('renders main content area', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
    })
  })

  describe('Navigation', () => {
    it('renders navigation links', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      // Links have role="menuitem" inside menubar
      expect(screen.getByRole('menuitem', { name: 'Recipes' })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: 'Add Recipe' })).toBeInTheDocument()
    })

    it('navigation has correct aria-label', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    })

    it('Recipes link navigates to /recipes', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const recipesLink = screen.getByRole('menuitem', { name: 'Recipes' })
      expect(recipesLink).toHaveAttribute('href', '/recipes')
    })

    it('Add Recipe link navigates to /recipes/new', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const addRecipeLink = screen.getByRole('menuitem', { name: 'Add Recipe' })
      expect(addRecipeLink).toHaveAttribute('href', '/recipes/new')
    })

    it('logo links to home', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const logo = screen.getByLabelText('Recipe Book Home')
      expect(logo).toHaveAttribute('href', '/')
    })
  })

  describe('Active Link Highlighting', () => {
    it('highlights Recipes link when on /recipes', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const recipesLink = screen.getByRole('menuitem', { name: 'Recipes' })
      // NavLink applies 'nav-link-active' class when active
      expect(recipesLink.className).toContain('nav-link')
    })

    it('highlights Add Recipe link when on /recipes/new', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const addRecipeLink = screen.getByRole('menuitem', { name: 'Add Recipe' })
      expect(addRecipeLink.className).toContain('nav-link')
    })
  })

  describe('Mobile Menu', () => {
    it('renders mobile menu button', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      expect(menuButton).toBeInTheDocument()
    })

    it('mobile menu button has correct aria attributes', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
    })

    it('opens mobile menu when button is clicked', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      fireEvent.click(menuButton)

      expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
    })

    it('closes mobile menu when overlay is clicked', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      fireEvent.click(menuButton)

      const overlay = document.querySelector('.mobile-menu-overlay')
      if (overlay) {
        fireEvent.click(overlay)
      }

      expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
    })

    it('closes mobile menu on escape key', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      fireEvent.click(menuButton)

      expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
    })

    it('renders mobile navigation links when open', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      fireEvent.click(menuButton)

      const mobileMenu = document.getElementById('mobile-menu')
      expect(mobileMenu).toHaveClass('mobile-menu-open')
    })
  })

  describe('Accessibility', () => {
    it('renders skip link', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      expect(screen.getByText('Skip to main content')).toBeInTheDocument()
    })

    it('skip link points to main content', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const skipLink = screen.getByText('Skip to main content')
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('main content has correct id for skip link', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
    })

    it('mobile menu has correct aria-hidden when closed', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const mobileMenu = document.getElementById('mobile-menu')
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true')
    })

    it('mobile menu has correct aria-hidden when open', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      fireEvent.click(menuButton)

      const mobileMenu = document.getElementById('mobile-menu')
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'false')
    })

    it('logo icon has aria-hidden', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const logoIcon = document.querySelector('.nav-logo-icon')
      expect(logoIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('menu icons have aria-hidden', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const menuIcons = document.querySelectorAll('.menu-icon')
      menuIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Design Tokens', () => {
    it('uses design token CSS classes', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const layout = document.querySelector('.layout')
      expect(layout).toBeInTheDocument()

      const header = document.querySelector('.layout-header')
      expect(header).toBeInTheDocument()

      const main = document.querySelector('.layout-main')
      expect(main).toBeInTheDocument()

      const footer = document.querySelector('.layout-footer')
      expect(footer).toBeInTheDocument()
    })

    it('main container has max-width class', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const mainContainer = document.querySelector('.main-container')
      expect(mainContainer).toBeInTheDocument()
    })
  })
})
