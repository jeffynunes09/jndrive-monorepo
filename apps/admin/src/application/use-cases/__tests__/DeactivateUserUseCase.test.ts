import { describe, it, expect, vi } from 'vitest'
import { DeactivateUserUseCase } from '../users/DeactivateUserUseCase'
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
    update: vi.fn().mockResolvedValue({ ...user, isActive: false }),
    delete: vi.fn(),
  } as unknown as IUserRepository
}

describe('DeactivateUserUseCase', () => {
  it('deve chamar update com isActive: false', async () => {
    const user = makeUser()
    const repo = makeRepo(user)
    const useCase = new DeactivateUserUseCase(repo)

    await useCase.execute('u1')

    expect(repo.update).toHaveBeenCalledWith('u1', { isActive: false })
  })

  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeRepo(null)
    const useCase = new DeactivateUserUseCase(repo)

    await expect(useCase.execute('u999')).rejects.toThrow(NotFoundError)
    expect(repo.update).not.toHaveBeenCalled()
  })
})
