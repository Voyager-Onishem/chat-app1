import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import {QueryClient, QueryClientProvider} from "@tanstack/react-query"

// Enhanced QueryClient configuration with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query defaults for better performance and UX
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for this duration
      gcTime: 5 * 60 * 1000, // 5 minutes - cache cleanup time
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Smart retry logic based on error type
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1, // Mutations should be retried less aggressively
      gcTime: 5 * 60 * 1000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App/>
    </QueryClientProvider>
  </StrictMode>,
)
