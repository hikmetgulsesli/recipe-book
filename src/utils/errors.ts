// Custom error classes for API error handling
export class AppError extends Error {
  code: string
  statusCode: number
  details?: Array<{ field: string; message: string }>

  constructor(code: string, message: string, statusCode: number = 500, details?: Array<{ field: string; message: string }>) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Array<{ field: string; message: string }>) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super('NOT_FOUND', `${resource} with id ${id} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
    this.name = 'ConflictError'
  }
}

// Error response formatter
export function formatErrorResponse(error: AppError | Error): { error: { code: string; message: string; details?: Array<{ field: string; message: string }> } } {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      }
    }
  }
  
  // Generic error fallback
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }
}
