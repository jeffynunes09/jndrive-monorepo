import { describe, it, expect, vi } from 'vitest'
import { GetRideUseCase } from '../rides/GetRideUseCase'
import { Ride } from '../../../domain/entities/Ride'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import { NotFoundError } from '../../../domain/errors/NotFoundError'

function makeRide() {
  return new Ride({
    id: 'r1',
    riderId: 'u1',
    origin: { lat: -23.5, lng: -46.6, address: 'Origem' },
    destination: { lat: -23.6, lng: -46.7, address: 'Destino' },
    status: 'in_progress',
    otp: '123456',
    otpVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function makeRepo(ride: Ride | null): IRideRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn().mockResolvedValue(ride),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IRideRepository
}

describe('GetRideUseCase', () => {
  it('deve retornar corrida quando encontrada', async () => {
    const ride = makeRide()
    const repo = makeRepo(ride)
    const useCase = new GetRideUseCase(repo)

    const result = await useCase.execute('r1')

    expect(result).toEqual(ride)
    expect(repo.findById).toHaveBeenCalledWith('r1')
  })

  it('deve lançar NotFoundError quando corrida não existe', async () => {
    const repo = makeRepo(null)
    const useCase = new GetRideUseCase(repo)

    await expect(useCase.execute('r999')).rejects.toThrow(NotFoundError)
  })
})
