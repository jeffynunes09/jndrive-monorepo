import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import type { UserDto } from '../../../application/dtos/UserDto'

const mockUser: UserDto = {
  id: 'u1',
  name: 'Admin Teste',
  email: 'admin@trudrive.com',
  role: 'admin',
  isActive: true,
  isApproved: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
    localStorage.clear()
  })

  it('deve iniciar sem autenticação', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('deve autenticar ao chamar setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc')

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
    expect(state.token).toBe('token-abc')
  })

  it('deve limpar autenticação ao chamar clearAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc')
    useAuthStore.getState().clearAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })
})
