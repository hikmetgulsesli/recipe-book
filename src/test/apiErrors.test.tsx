import { describe, it, expect } from 'vitest'
import { ApiError, NetworkError, TimeoutError, getUserFriendlyError } from '../utils/apiErrors'

describe('apiErrors', () => {
  describe('ApiError', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError('Something went wrong', 'ERROR_CODE', 400, [
        { field: 'name', message: 'Name is required' }
      ])

      expect(error.message).toBe('Something went wrong')
      expect(error.code).toBe('ERROR_CODE')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual([{ field: 'name', message: 'Name is required' }])
      expect(error.name).toBe('ApiError')
    })

    it('should create ApiError without details', () => {
      const error = new ApiError('Not found', 'NOT_FOUND', 404)

      expect(error.message).toBe('Not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.details).toBeUndefined()
    })
  })

  describe('NetworkError', () => {
    it('should create NetworkError with default message', () => {
      const error = new NetworkError()

      expect(error.message).toBe('Network error. Please check your connection.')
      expect(error.name).toBe('NetworkError')
    })

    it('should create NetworkError with custom message', () => {
      const error = new NetworkError('Custom network error')

      expect(error.message).toBe('Custom network error')
    })
  })

  describe('TimeoutError', () => {
    it('should create TimeoutError with default message', () => {
      const error = new TimeoutError()

      expect(error.message).toBe('Request timed out. Please try again.')
      expect(error.name).toBe('TimeoutError')
    })

    it('should create TimeoutError with custom message', () => {
      const error = new TimeoutError('Custom timeout')

      expect(error.message).toBe('Custom timeout')
    })
  })

  describe('getUserFriendlyError', () => {
    it('should return NetworkError message', () => {
      const error = new NetworkError()
      expect(getUserFriendlyError(error)).toBe('Network error. Please check your connection.')
    })

    it('should return TimeoutError message', () => {
      const error = new TimeoutError()
      expect(getUserFriendlyError(error)).toBe('Request timed out. Please try again.')
    })

    it('should return message for 400 Bad Request', () => {
      const error = new ApiError('Invalid input', 'BAD_REQUEST', 400)
      expect(getUserFriendlyError(error)).toBe('Invalid input')
    })

    it('should return default message for 400 without message', () => {
      const error = new ApiError('', 'BAD_REQUEST', 400)
      expect(getUserFriendlyError(error)).toBe('Invalid request. Please check your input.')
    })

    it('should return message for 401 Unauthorized', () => {
      const error = new ApiError('Auth failed', 'UNAUTHORIZED', 401)
      expect(getUserFriendlyError(error)).toBe('You are not authorized. Please log in.')
    })

    it('should return message for 403 Forbidden', () => {
      const error = new ApiError('Forbidden', 'FORBIDDEN', 403)
      expect(getUserFriendlyError(error)).toBe('You do not have permission to perform this action.')
    })

    it('should return message for 404 Not Found', () => {
      const error = new ApiError('Recipe not found', 'NOT_FOUND', 404)
      expect(getUserFriendlyError(error)).toBe('Recipe not found')
    })

    it('should return default message for 404 without message', () => {
      const error = new ApiError('', 'NOT_FOUND', 404)
      expect(getUserFriendlyError(error)).toBe('The requested resource was not found.')
    })

    it('should return message for 409 Conflict', () => {
      const error = new ApiError('Already exists', 'CONFLICT', 409)
      expect(getUserFriendlyError(error)).toBe('Already exists')
    })

    it('should return default message for 409 without message', () => {
      const error = new ApiError('', 'CONFLICT', 409)
      expect(getUserFriendlyError(error)).toBe('This resource already exists.')
    })

    it('should return message for 422 Unprocessable Entity', () => {
      const error = new ApiError('Validation failed', 'VALIDATION_ERROR', 422)
      expect(getUserFriendlyError(error)).toBe('Validation failed')
    })

    it('should return default message for 422 without message', () => {
      const error = new ApiError('', 'VALIDATION_ERROR', 422)
      expect(getUserFriendlyError(error)).toBe('Validation failed. Please check your input.')
    })

    it('should return message for 429 Too Many Requests', () => {
      const error = new ApiError('Rate limited', 'RATE_LIMIT', 429)
      expect(getUserFriendlyError(error)).toBe('Too many requests. Please wait a moment.')
    })

    it('should return server error message for 500', () => {
      const error = new ApiError('Server crashed', 'SERVER_ERROR', 500)
      expect(getUserFriendlyError(error)).toBe('Server error. Please try again later.')
    })

    it('should return server error message for 502', () => {
      const error = new ApiError('Bad gateway', 'BAD_GATEWAY', 502)
      expect(getUserFriendlyError(error)).toBe('Server error. Please try again later.')
    })

    it('should return server error message for 503', () => {
      const error = new ApiError('Service unavailable', 'SERVICE_UNAVAILABLE', 503)
      expect(getUserFriendlyError(error)).toBe('Server error. Please try again later.')
    })

    it('should return server error message for 504', () => {
      const error = new ApiError('Gateway timeout', 'GATEWAY_TIMEOUT', 504)
      expect(getUserFriendlyError(error)).toBe('Server error. Please try again later.')
    })

    it('should return error message for generic Error', () => {
      const error = new Error('Something happened')
      expect(getUserFriendlyError(error)).toBe('Something happened')
    })

    it('should return default message for unknown error', () => {
      expect(getUserFriendlyError('unknown')).toBe('An unexpected error occurred.')
    })

    it('should return default message for null', () => {
      expect(getUserFriendlyError(null)).toBe('An unexpected error occurred.')
    })

    it('should return default message for undefined', () => {
      expect(getUserFriendlyError(undefined)).toBe('An unexpected error occurred.')
    })

    it('should return default message for object', () => {
      expect(getUserFriendlyError({ foo: 'bar' })).toBe('An unexpected error occurred.')
    })
  })
})
