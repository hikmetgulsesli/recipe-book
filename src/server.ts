import { createServer } from './api/server.js'
import { initDatabase, seedDatabase } from './db/database.js'

const PORT = process.env.API_PORT || 3001

// Initialize database
initDatabase()
seedDatabase()

// Create and start server
const app = createServer()

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

export default app
