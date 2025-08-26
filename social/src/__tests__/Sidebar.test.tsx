import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CssVarsProvider } from '@mui/joy/styles'
import Sidebar from '../components/Sidebar'

// Mock NotificationDropdown to avoid DB provider dependency
vi.mock('../components/NotificationDropdown', () => ({
  NotificationDropdown: () => null,
}))

// Mock ColorSchemeToggle to avoid theme provider dependency
vi.mock('../components/ColorSchemeToggle', () => ({
  default: () => null,
}))

// Mock SimpleAuthContext hook to provide stable user/profile
vi.mock('../context/SimpleAuthContext', () => ({
  useSimpleAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    profile: { full_name: 'Test User', role: 'alumni' },
    loading: false,
    signOut: vi.fn(),
  }),
}))

describe('Sidebar', () => {
  it('renders main navigation items', () => {
    render(
      <CssVarsProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Sidebar />
        </MemoryRouter>
      </CssVarsProvider>
    )

  expect(screen.getByText('Home')).toBeTruthy()
  expect(screen.getByText('Directory')).toBeTruthy()
  expect(screen.getByText('Connections')).toBeTruthy()
  expect(screen.getByText('Messages')).toBeTruthy()
  })
})
