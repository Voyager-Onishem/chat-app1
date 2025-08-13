import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../context/AuthContext'

// Mock Supabase client
vi.mock('../supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  }
}))

// Mock auth utilities
vi.mock('../utils/auth-cleanup', () => ({
  performCompleteLogout: vi.fn(),
  clearAllStorage: vi.fn(),
  clearAllCookies: vi.fn(),
  validateSessionOnStart: vi.fn().mockResolvedValue(true),
  setupPageUnloadCleanup: vi.fn().mockReturnValue(() => {})
}))

describe('AuthContext', () => {
  it('provides auth context values', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBe(null)
    expect(result.current.profile).toBe(null)
    expect(typeof result.current.signOut).toBe('function')
    expect(typeof result.current.refreshProfile).toBe('function')
  })
})
