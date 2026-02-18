export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error. Please check your connection.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out. Please try again.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

// User-friendly error messages
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof NetworkError) {
    return error.message
  }
  
  if (error instanceof TimeoutError) {
    return error.message
  }
  
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return error.message || 'Invalid request. Please check your input.'
      case 401:
        return 'You are not authorized. Please log in.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return error.message || 'The requested resource was not found.'
      case 409:
        return error.message || 'This resource already exists.'
      case 422:
        return error.message || 'Validation failed. Please check your input.'
      case 429:
        return 'Too many requests. Please wait a moment.'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred.'
}
