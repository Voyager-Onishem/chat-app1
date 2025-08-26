import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase-client';
import { robustQuery } from '../utils/robust-query';
import { debounce } from '../utils/debounce';
import type { ApiResponse } from '../types';

export interface UseQueryOptions {
  enabled?: boolean;
  retry?: number;
  timeout?: number;
  fallbackData?: any;
  refetchOnWindowFocus?: boolean;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fromFallback: boolean;
}

/**
 * Custom hook for robust data fetching with automatic retries and error handling
 */
export function useQuery<T = any>(
  queryKey: string,
  queryFn: () => Promise<any>,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    retry = 2,
    timeout = 15000, // Increased from 8000 to 15000ms for better reliability
    fallbackData = null,
    refetchOnWindowFocus = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromFallback, setFromFallback] = useState(false);

  const executeQuery = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Create an AbortController for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Execute query with abort signal
      const queryResult = await Promise.race([
        queryFn(),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Query timeout'));
          });
        })
      ]);

      clearTimeout(timeoutId);
      
      if (queryResult && queryResult.error) {
        console.warn('Query failed:', queryResult.error);
        setError(queryResult.error.message || 'Query failed');
        setData(fallbackData);
        setFromFallback(true);
      } else {
        setData(queryResult.data || queryResult);
        setFromFallback(false);
        setError(null);
      }
    } catch (err: any) {
      console.warn('Query execution error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setData(fallbackData);
      setFromFallback(!!fallbackData);
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, retry, timeout, fallbackData]);

  const refetch = useCallback(() => {
    executeQuery();
  }, [executeQuery]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Refetch on window focus if enabled (debounced)
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const debouncedRefetch = debounce(() => {
      if (!document.hidden) {
        console.log('Window focus detected, refetching...');
        // Add random delay to stagger multiple query refetches
        const delay = Math.random() * 2000; // 0-2 seconds random delay
        setTimeout(() => {
          refetch();
        }, delay);
      }
    }, 1000); // 1 second debounce

    const handleFocus = () => {
      debouncedRefetch();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedRefetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, refetchOnWindowFocus]);

  return {
    data,
    loading,
    error,
    refetch,
    fromFallback,
  };
}

/**
 * Hook for mutations (create, update, delete operations)
 */
export interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<void>;
  data: T | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<any>,
  options: UseMutationOptions<T> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: V) => {
    setLoading(true);
    setError(null);

    try {
      const result = await robustQuery(mutationFn(variables), {
        timeout: 30000, // Longer timeout for mutations
        retries: 1, // Fewer retries for mutations to avoid duplicates
      });

      if (result.error) {
        throw result.error;
      }

      setData(result.data);
      onSuccess?.(result.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
      onSettled?.();
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  };
}

/**
 * Hook for real-time subscriptions
 */
export interface UseSubscriptionOptions {
  enabled?: boolean;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useSubscription(
  table: string,
  filter?: string,
  options: UseSubscriptionOptions = {}
) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options;
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload: any) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status: any) => {
        setConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(`Subscription error: ${status}`);
        } else {
          setError(null);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [table, filter, enabled, onInsert, onUpdate, onDelete]);

  return { connected, error };
}
