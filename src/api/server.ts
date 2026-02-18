import express from 'express'
import cors from 'cors'
import recipeRoutes from './recipes.js'
import { formatErrorResponse, AppError } from '../utils/errors.js'

export function createServer() {
  const app = express()
  
  // Middleware
  app.use(cors())
  app.use(express.json())
  
  // Routes
  app.use('/api/recipes', recipeRoutes)
  
  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json(formatErrorResponse(new AppError('NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404)))
  })
  
  // Error handler
  app.use((err: Error | AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err)
    
    if (err instanceof AppError) {
      res.status(err.statusCode).json(formatErrorResponse(err))
      return
    }
    
    // Generic error
    res.status(500).json(formatErrorResponse(err))
  })
  
  return app
}
