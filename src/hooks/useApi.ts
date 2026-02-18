import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
}

export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
    initialData?: T | null
  } = {}
): UseApiReturn<T> {
  const { onSuccess, onError, initialData = null } = options
  
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null
  })

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await apiFunction(...args)
      setState({ data: result, loading: false, error: null })
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setState({ data: null, loading: false, error: errorMessage })
      onError?.(errorMessage)
      return null
    }
  }, [apiFunction, onSuccess, onError])

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData
  }
}
