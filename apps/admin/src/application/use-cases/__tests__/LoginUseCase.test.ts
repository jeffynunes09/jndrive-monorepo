import { describe, it, expect, vi } from 'vitest'
import { LoginUseCase } from '../auth/LoginUseCase'
import type { IAuthGateway, LoginResult } from '../../ports/IAuthGateway'
import { DomainError } from '../../../domain/errors/DomainError'

const mockResult: LoginResult = {
  token: 'token-abc',
  user: {
    id: 'u1',
    name: 'Admin',
    email: 'admin@trudrive.com',
    role: 'admin',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

function makeGateway(): IAuthGateway {
  return {
    login: vi.fn().mockResolvedValue(mockResult),
    logout: vi.fn(),
    getToken: vi.fn().mockReturnValue(null),
  }
}

describe('LoginUseCase', () => {
  it('deve chamar gateway.login com credenciais válidas', async () => {
    const gateway = makeGateway()
    const useCase = new LoginUseCase(gateway)

    await useCase.execute({ email: 'admin@trudrive.com', password: 'senha123' })

    expect(gateway.login).toHaveBeenCalledWith('admin@trudrive.com', 'senha123')
  })

  it('deve retornar resultado do gateway', async () => {
    const gateway = makeGateway()
    const useCase = new LoginUseCase(gateway)

    const result = await useCase.execute({ email: 'admin@trudrive.com', password: 'senha123' })

    expect(result).toEqual(mockResult)
  })

  it('deve lançar DomainError para e-mail inválido', async () => {
    const gateway = makeGateway()
    const useCase = new LoginUseCase(gateway)

    await expect(
      useCase.execute({ email: 'nao-eh-email', password: 'senha123' }),
    ).rejects.toThrow(DomainError)
    expect(gateway.login).not.toHaveBeenCalled()
  })

  it('deve lançar DomainError para senha com menos de 6 caracteres', async () => {
    const gateway = makeGateway()
    const useCase = new LoginUseCase(gateway)

    await expect(
      useCase.execute({ email: 'admin@trudrive.com', password: '123' }),
    ).rejects.toThrow(DomainError)
    expect(gateway.login).not.toHaveBeenCalled()
  })

  it('deve lançar DomainError para senha vazia', async () => {
    const gateway = makeGateway()
    const useCase = new LoginUseCase(gateway)

    await expect(
      useCase.execute({ email: 'admin@trudrive.com', password: '' }),
    ).rejects.toThrow(DomainError)
  })
})
