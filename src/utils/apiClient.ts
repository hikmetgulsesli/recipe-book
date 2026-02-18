import { ApiError, NetworkError, TimeoutError } from './apiErrors'

interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface ApiResponse<T> {
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY = 1000 // 1 second

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError()
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function makeRequest<T>(
  url: string,
  options: RequestInit,
  config: RequestConfig
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, retryDelay = DEFAULT_RETRY_DELAY } = config
  
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout)
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        // Don't retry client errors (4xx) except for 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new ApiError(
            errorData?.error?.message || `HTTP ${response.status}`,
            errorData?.error?.code || 'HTTP_ERROR',
            response.status,
            errorData?.error?.details
          )
        }
        
        // Retry server errors and rate limits
        throw new ApiError(
          errorData?.error?.message || `HTTP ${response.status}`,
          errorData?.error?.code || 'HTTP_ERROR',
          response.status,
          errorData?.error?.details
        )
      }
      
      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return undefined as T
      }
      
      return await response.json() as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry if it's a client error (except rate limit which we already handled)
      if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error
      }
      
      // Don't retry if we've used all attempts
      if (attempt >= retries) {
        break
      }
      
      // Wait before retrying with exponential backoff
      const backoffDelay = retryDelay * Math.pow(2, attempt)
      await delay(backoffDelay)
    }
  }
  
  // If we get here, all retries failed
  if (lastError instanceof ApiError || lastError instanceof TimeoutError) {
    throw lastError
  }
  
  // Check if it's a network error
  if (lastError instanceof Error) {
    if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
      throw new NetworkError()
    }
    throw lastError
  }
  
  throw new Error('Request failed after retries')
}

export const apiClient = {
  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return makeRequest<T>(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, config)
  },

  async post<T>(url: string, body: unknown, config: RequestConfig = {}): Promise<T> {
    return makeRequest<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }, config)
  },

  async put<T>(url: string, body: unknown, config: RequestConfig = {}): Promise<T> {
    return makeRequest<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }, config)
  },

  async patch<T>(url: string, body: unknown, config: RequestConfig = {}): Promise<T> {
    return makeRequest<T>(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }, config)
  },

  async delete(url: string, config: RequestConfig = {}): Promise<void> {
    await makeRequest<void>(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    }, config)
  }
}

export type { ApiResponse, RequestConfig }
