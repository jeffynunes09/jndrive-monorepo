import { describe, it, expect, vi } from 'vitest'
import { LogoutUseCase } from '../auth/LogoutUseCase'
import type { IAuthGateway } from '../../ports/IAuthGateway'

function makeGateway(): IAuthGateway {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
  }
}

describe('LogoutUseCase', () => {
  it('deve chamar gateway.logout', () => {
    const gateway = makeGateway()
    const useCase = new LogoutUseCase(gateway)

    useCase.execute()

    expect(gateway.logout).toHaveBeenCalledOnce()
  })
})
