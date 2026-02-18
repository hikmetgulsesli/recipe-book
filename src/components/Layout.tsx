import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ChefHat } from 'lucide-react'
import { useState, useEffect } from 'react'
import './Layout.css'

export interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { to: '/recipes', label: 'Recipes' },
    { to: '/recipes/new', label: 'Add Recipe' },
  ]

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="layout-header">
        <nav className="layout-nav" aria-label="Main navigation">
          <div className="nav-container">
            <NavLink to="/" className="nav-logo" aria-label="Recipe Book Home">
              <ChefHat className="nav-logo-icon" aria-hidden="true" />
              <span className="nav-logo-text">Recipe Book</span>
            </NavLink>

            {/* Desktop Navigation */}
            <ul className="nav-links" role="menubar">
              {navLinks.map((link) => (
                <li key={link.to} role="none">
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                    role="menuitem"
                    end={link.to === '/recipes'}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="menu-icon" aria-hidden="true" />
              ) : (
                <Menu className="menu-icon" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu-panel">
            <ul className="mobile-nav-links" role="menu">
              {navLinks.map((link) => (
                <li key={link.to} role="none">
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
                    }
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    end={link.to === '/recipes'}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <main className="layout-main" id="main-content">
        <div className="main-container">
          {children}
        </div>
      </main>

      <footer className="layout-footer">
        <div className="footer-container">
          <div className="footer-content">
            <ChefHat className="footer-icon" aria-hidden="true" />
            <span className="footer-text">Recipe Book</span>
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Recipe Book. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
