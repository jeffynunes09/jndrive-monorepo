import { describe, it, expect, vi } from 'vitest'
import { ListRidesUseCase } from '../rides/ListRidesUseCase'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import { Ride } from '../../../domain/entities/Ride'

function makeRide(id: string) {
  return new Ride({
    id,
    riderId: 'u1',
    origin: { lat: -23.5, lng: -46.6, address: 'Origem' },
    destination: { lat: -23.6, lng: -46.7, address: 'Destino' },
    status: 'completed',
    otp: '123456',
    otpVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function makeRepo(rides: Ride[] = []): IRideRepository {
  return {
    findAll: vi.fn().mockResolvedValue(rides),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IRideRepository
}

describe('ListRidesUseCase', () => {
  it('deve retornar lista de corridas', async () => {
    const rides = [makeRide('r1'), makeRide('r2')]
    const repo = makeRepo(rides)
    const useCase = new ListRidesUseCase(repo)

    const result = await useCase.execute()

    expect(result).toEqual(rides)
  })

  it('deve chamar findAll sem filtros quando não informados', async () => {
    const repo = makeRepo()
    const useCase = new ListRidesUseCase(repo)

    await useCase.execute()

    expect(repo.findAll).toHaveBeenCalledWith(undefined)
  })

  it('deve passar filtros ao repositório', async () => {
    const repo = makeRepo()
    const useCase = new ListRidesUseCase(repo)
    const filters = { status: 'in_progress' as const }

    await useCase.execute(filters)

    expect(repo.findAll).toHaveBeenCalledWith(filters)
  })
})
