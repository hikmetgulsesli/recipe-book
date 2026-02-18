import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders Recipe Book heading', () => {
    render(<App />)
    expect(screen.getByText('Recipe Book')).toBeInTheDocument()
  })

  it('renders My Recipes heading', () => {
    render(<App />)
    expect(screen.getByText('My Recipes')).toBeInTheDocument()
  })
})
