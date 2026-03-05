import { describe, it, expect, vi } from 'vitest'
import { HttpUserRepository } from '../HttpUserRepository'
import type { IHttpClient } from '../../../application/ports/IHttpClient'

function makeDto(id = 'u1', role: 'driver' | 'rider' = 'rider') {
  return {
    _id: id,
    name: 'Usuário Teste',
    email: 'user@test.com',
    role,
    isActive: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function makeHttp(): IHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}

describe('HttpUserRepository', () => {
  describe('findAll', () => {
    it('deve buscar /users e retornar entidades', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue([makeDto('u1'), makeDto('u2')])
      const repo = new HttpUserRepository(http)

      const result = await repo.findAll()

      expect(http.get).toHaveBeenCalledWith('/users', {})
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('u1')
    })

    it('deve passar filtros como params', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue([])
      const repo = new HttpUserRepository(http)

      await repo.findAll({ role: 'driver', isApproved: false, isActive: true })

      expect(http.get).toHaveBeenCalledWith('/users', {
        role: 'driver',
        isApproved: 'false',
        isActive: 'true',
      })
    })

    it('deve mapear _id para id da entidade', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue([makeDto('mongo-id-123')])
      const repo = new HttpUserRepository(http)

      const result = await repo.findAll()

      expect(result[0].id).toBe('mongo-id-123')
    })
  })

  describe('findById', () => {
    it('deve retornar entidade quando encontrada', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeDto('u1'))
      const repo = new HttpUserRepository(http)

      const result = await repo.findById('u1')

      expect(http.get).toHaveBeenCalledWith('/users/u1')
      expect(result?.id).toBe('u1')
    })

    it('deve retornar null quando http lança erro', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('404'))
      const repo = new HttpUserRepository(http)

      const result = await repo.findById('u999')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('deve chamar patch e retornar entidade atualizada', async () => {
      const http = makeHttp()
      ;(http.patch as ReturnType<typeof vi.fn>).mockResolvedValue(makeDto('u1'))
      const repo = new HttpUserRepository(http)

      const result = await repo.update('u1', { isApproved: true })

      expect(http.patch).toHaveBeenCalledWith('/users/u1', { isApproved: true })
      expect(result.id).toBe('u1')
    })
  })

  describe('delete', () => {
    it('deve chamar delete no endpoint correto', async () => {
      const http = makeHttp()
      ;(http.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
      const repo = new HttpUserRepository(http)

      await repo.delete('u1')

      expect(http.delete).toHaveBeenCalledWith('/users/u1')
    })
  })
})
