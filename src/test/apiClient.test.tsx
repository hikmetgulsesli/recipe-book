import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '../utils/apiClient'
import { ApiError, NetworkError } from '../utils/apiErrors'

describe('apiClient', () => {
  const mockFetch = vi.fn()
  global.fetch = mockFetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET method', () => {
    it('should make a GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      })

      const result = await apiClient.get('/api/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Accept': 'application/json'
        })
      }))
      expect(result).toEqual({ data: 'test' })
    })

    it('should return data for successful response', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.get('/api/test')

      expect(result).toEqual(mockData)
    })

    it('should throw ApiError for 4xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not found', code: 'NOT_FOUND' } })
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ApiError)
    })

    it('should throw ApiError for 5xx response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error', code: 'SERVER_ERROR' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error', code: 'SERVER_ERROR' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error', code: 'SERVER_ERROR' } })
        })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ApiError)
    })
  })

  describe('POST method', () => {
    it('should make a POST request with correct headers and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 })
      })

      const body = { name: 'Test Recipe' }
      await apiClient.post('/api/recipes', body)

      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        body: JSON.stringify(body)
      }))
    })

    it('should return data for successful POST', async () => {
      const mockData = { id: 1, name: 'Test Recipe' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.post('/api/recipes', { name: 'Test Recipe' })

      expect(result).toEqual(mockData)
    })
  })

  describe('PUT method', () => {
    it('should make a PUT request with correct headers and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Updated' })
      })

      const body = { name: 'Updated Recipe' }
      await apiClient.put('/api/recipes/1', body)

      expect(mockFetch).toHaveBeenCalledWith('/api/recipes/1', expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        body: JSON.stringify(body)
      }))
    })
  })

  describe('DELETE method', () => {
    it('should make a DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      await apiClient.delete('/api/recipes/1')

      expect(mockFetch).toHaveBeenCalledWith('/api/recipes/1', expect.objectContaining({
        method: 'DELETE'
      }))
    })

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const result = await apiClient.delete('/api/recipes/1')

      expect(result).toBeUndefined()
    })
  })

  describe('Retry logic', () => {
    it('should retry on network error (2 retries by default)', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        })

      const result = await apiClient.get('/api/test')

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ data: 'success' })
    })

    it('should throw NetworkError after all retries fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))

      await expect(apiClient.get('/api/test')).rejects.toThrow(NetworkError)
    })

    it('should not retry on 4xx errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Bad request', code: 'BAD_REQUEST' } })
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ApiError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should retry on 5xx errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error', code: 'SERVER_ERROR' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        })

      const result = await apiClient.get('/api/test')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })
  })

  describe('Timeout handling', () => {
    it('should accept timeout option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      })

      await apiClient.get('/api/test', { timeout: 5000 })

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Request configuration', () => {
    it('should allow custom retry count', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        })

      const result = await apiClient.get('/api/test', { retries: 1 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })
  })
})
