import { describe, it, expect, vi } from 'vitest'
import { GetUserUseCase } from '../users/GetUserUseCase'
import { User } from '../../../domain/entities/User'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { NotFoundError } from '../../../domain/errors/NotFoundError'

function makeUser() {
  return new User({
    id: 'u1',
    name: 'Usuário Teste',
    email: 'user@test.com',
    role: 'rider',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function makeRepo(user: User | null): IUserRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn().mockResolvedValue(user),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IUserRepository
}

describe('GetUserUseCase', () => {
  it('deve retornar usuário quando encontrado', async () => {
    const user = makeUser()
    const repo = makeRepo(user)
    const useCase = new GetUserUseCase(repo)

    const result = await useCase.execute('u1')

    expect(result).toEqual(user)
    expect(repo.findById).toHaveBeenCalledWith('u1')
  })

  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeRepo(null)
    const useCase = new GetUserUseCase(repo)

    await expect(useCase.execute('u999')).rejects.toThrow(NotFoundError)
  })
})
