import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ToastNotificationProvider, useNotifications } from '../context/NotificationContext'

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastNotificationProvider>{children}</ToastNotificationProvider>
)

describe('ToastNotificationProvider', () => {
  it('adds and removes notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.success('Saved successfully', 'Success')
    })

    expect(result.current.notifications.length).toBe(1)

    const id = result.current.notifications[0].id
    act(() => {
      result.current.removeNotification(id)
    })

    expect(result.current.notifications.length).toBe(0)
  })
})
