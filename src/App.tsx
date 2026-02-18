import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { RecipeList } from './pages/RecipeList'
import { RecipeDetail } from './pages/RecipeDetail'
import './App.css'

function RecipeListPage() {
  const navigate = useNavigate()

  const handleRecipeClick = (recipeId: number) => {
    navigate(`/recipes/${recipeId}`)
  }

  const handleNewRecipeClick = () => {
    navigate('/recipes/new')
  }

  return (
    <RecipeList 
      onRecipeClick={handleRecipeClick}
      onNewRecipeClick={handleNewRecipeClick}
    />
  )
}

function RecipeDetailPage() {
  return <RecipeDetail />
}

function NewRecipePage() {
  return (
    <div className="placeholder-page">
      <h1>New Recipe</h1>
      <p>This page is coming soon...</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <nav className="app-nav" aria-label="Main navigation">
            <a href="/" className="app-logo" aria-label="Recipe Book Home">
              Recipe Book
            </a>
          </nav>
        </header>
        
        <main className="app-main" id="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<RecipeListPage />} />
            <Route path="/recipes/new" element={<NewRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
