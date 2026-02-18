import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { RecipeList } from './pages/RecipeList'
import { RecipeDetail } from './pages/RecipeDetail'
import { RecipeForm } from './pages/RecipeForm'
import { ToastContainer } from './components/ToastContainer'
import { useToast } from './hooks/useToast'
import './App.css'

interface PageProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

function RecipeListPage({ onSuccess: _onSuccess, onError }: PageProps) {
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
      onError={onError}
    />
  )
}

function RecipeDetailPage({ onSuccess, onError }: PageProps) {
  return (
    <RecipeDetail 
      onError={onError}
      onSuccess={onSuccess}
    />
  )
}

function NewRecipePage({ onSuccess, onError }: PageProps) {
  return (
    <RecipeForm 
      onError={onError}
      onSuccess={onSuccess}
    />
  )
}

function EditRecipePage({ onSuccess, onError }: PageProps) {
  return (
    <RecipeForm 
      onSuccess={onSuccess}
      onError={onError}
    />
  )
}

function AppContent() {
  const { toasts, removeToast, success, error } = useToast()

  return (
    <>
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
            <Route path="/recipes" element={
              <RecipeListPage onSuccess={success} onError={error} />
            } />
            <Route path="/recipes/new" element={
              <NewRecipePage onSuccess={success} onError={error} />
            } />
            <Route path="/recipes/:id/edit" element={
              <EditRecipePage onSuccess={success} onError={error} />
            } />
            <Route path="/recipes/:id" element={
              <RecipeDetailPage onSuccess={success} onError={error} />
            } />
          </Routes>
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
