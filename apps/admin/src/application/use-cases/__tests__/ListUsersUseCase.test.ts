import { describe, it, expect, vi } from 'vitest'
import { ListUsersUseCase } from '../users/ListUsersUseCase'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'

function makeUser(id: string) {
  return new User({
    id,
    name: 'Usuário Teste',
    email: `user${id}@test.com`,
    role: 'rider',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function makeRepo(users: User[] = []): IUserRepository {
  return {
    findAll: vi.fn().mockResolvedValue(users),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IUserRepository
}

describe('ListUsersUseCase', () => {
  it('deve retornar lista de usuários', async () => {
    const users = [makeUser('1'), makeUser('2')]
    const repo = makeRepo(users)
    const useCase = new ListUsersUseCase(repo)

    const result = await useCase.execute()

    expect(result).toEqual(users)
  })

  it('deve chamar findAll sem filtros quando não informados', async () => {
    const repo = makeRepo()
    const useCase = new ListUsersUseCase(repo)

    await useCase.execute()

    expect(repo.findAll).toHaveBeenCalledWith(undefined)
  })

  it('deve passar filtros ao repositório', async () => {
    const repo = makeRepo()
    const useCase = new ListUsersUseCase(repo)
    const filters = { role: 'driver' as const, isApproved: false }

    await useCase.execute(filters)

    expect(repo.findAll).toHaveBeenCalledWith(filters)
  })

  it('deve retornar lista vazia quando não há usuários', async () => {
    const repo = makeRepo([])
    const useCase = new ListUsersUseCase(repo)

    const result = await useCase.execute()

    expect(result).toHaveLength(0)
  })
})
