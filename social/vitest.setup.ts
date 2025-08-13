import '@testing-library/jest-dom/vitest'

// Mock router used in components
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
