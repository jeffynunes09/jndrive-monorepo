import { describe, it, expect, vi } from 'vitest'
import { HttpRideRepository } from '../HttpRideRepository'
import type { IHttpClient } from '../../../application/ports/IHttpClient'

function makeDto(id = 'r1', status = 'in_progress') {
  return {
    _id: id,
    riderId: 'u1',
    origin: { lat: -23.5, lng: -46.6, address: 'Origem' },
    destination: { lat: -23.6, lng: -46.7, address: 'Destino' },
    status,
    otp: '123456',
    otpVerified: true,
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

describe('HttpRideRepository', () => {
  describe('findAll', () => {
    it('deve buscar /rides e retornar entidades', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue([makeDto('r1'), makeDto('r2')])
      const repo = new HttpRideRepository(http)

      const result = await repo.findAll()

      expect(http.get).toHaveBeenCalledWith('/rides', {})
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('r1')
    })

    it('deve passar filtros como params', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue([])
      const repo = new HttpRideRepository(http)

      await repo.findAll({ status: 'completed', driverId: 'd1', riderId: 'u1' })

      expect(http.get).toHaveBeenCalledWith('/rides', {
        status: 'completed',
        driverId: 'd1',
        riderId: 'u1',
      })
    })

    it('deve mapear _id para id da entidade', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue([makeDto('mongo-id-456')])
      const repo = new HttpRideRepository(http)

      const result = await repo.findAll()

      expect(result[0].id).toBe('mongo-id-456')
    })
  })

  describe('findById', () => {
    it('deve retornar entidade quando encontrada', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeDto('r1'))
      const repo = new HttpRideRepository(http)

      const result = await repo.findById('r1')

      expect(http.get).toHaveBeenCalledWith('/rides/r1')
      expect(result?.id).toBe('r1')
    })

    it('deve retornar null quando http lança erro', async () => {
      const http = makeHttp()
      ;(http.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('404'))
      const repo = new HttpRideRepository(http)

      const result = await repo.findById('r999')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('deve chamar patch e retornar entidade atualizada', async () => {
      const http = makeHttp()
      ;(http.patch as ReturnType<typeof vi.fn>).mockResolvedValue(makeDto('r1', 'cancelled'))
      const repo = new HttpRideRepository(http)

      const result = await repo.update('r1', { status: 'cancelled', cancelledBy: 'admin' })

      expect(http.patch).toHaveBeenCalledWith('/rides/r1', { status: 'cancelled', cancelledBy: 'admin' })
      expect(result.status).toBe('cancelled')
    })
  })

  describe('delete', () => {
    it('deve chamar delete no endpoint correto', async () => {
      const http = makeHttp()
      ;(http.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
      const repo = new HttpRideRepository(http)

      await repo.delete('r1')

      expect(http.delete).toHaveBeenCalledWith('/rides/r1')
    })
  })
})
