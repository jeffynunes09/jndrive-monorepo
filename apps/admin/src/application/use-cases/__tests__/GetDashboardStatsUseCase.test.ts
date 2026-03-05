import { describe, it, expect, vi } from 'vitest'
import { GetDashboardStatsUseCase } from '../rides/GetDashboardStatsUseCase'
import { User } from '../../../domain/entities/User'
import { Ride } from '../../../domain/entities/Ride'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'

function makeUser(role: 'driver' | 'rider', isApproved = true) {
  return new User({
    id: Math.random().toString(),
    name: 'Teste',
    email: `${Math.random()}@test.com`,
    role,
    isActive: true,
    isApproved,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function makeRide(status: Ride['status'], fare?: number) {
  return new Ride({
    id: Math.random().toString(),
    riderId: 'u1',
    origin: { lat: -23.5, lng: -46.6, address: 'Origem' },
    destination: { lat: -23.6, lng: -46.7, address: 'Destino' },
    status,
    otp: '123456',
    otpVerified: true,
    fare,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function makeRepos(users: User[], rides: Ride[]) {
  const userRepo: IUserRepository = {
    findAll: vi.fn().mockResolvedValue(users),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IUserRepository

  const rideRepo: IRideRepository = {
    findAll: vi.fn().mockResolvedValue(rides),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IRideRepository

  return { userRepo, rideRepo }
}

describe('GetDashboardStatsUseCase', () => {
  it('deve calcular totais de usuários corretamente', async () => {
    const users = [makeUser('driver'), makeUser('driver'), makeUser('rider')]
    const { userRepo, rideRepo } = makeRepos(users, [])
    const useCase = new GetDashboardStatsUseCase(userRepo, rideRepo)

    const stats = await useCase.execute()

    expect(stats.totalUsers).toBe(3)
    expect(stats.totalDrivers).toBe(2)
    expect(stats.totalRiders).toBe(1)
  })

  it('deve contar aprovações pendentes', async () => {
    const users = [
      makeUser('driver', false),
      makeUser('driver', false),
      makeUser('driver', true),
    ]
    const { userRepo, rideRepo } = makeRepos(users, [])
    const useCase = new GetDashboardStatsUseCase(userRepo, rideRepo)

    const stats = await useCase.execute()

    expect(stats.pendingApprovals).toBe(2)
  })

  it('deve contar corridas ativas', async () => {
    const rides = [
      makeRide('searching_driver'),
      makeRide('driver_assigned'),
      makeRide('in_progress'),
      makeRide('completed'),
      makeRide('cancelled'),
    ]
    const { userRepo, rideRepo } = makeRepos([], rides)
    const useCase = new GetDashboardStatsUseCase(userRepo, rideRepo)

    const stats = await useCase.execute()

    expect(stats.activeRides).toBe(3)
    expect(stats.completedRides).toBe(1)
    expect(stats.cancelledRides).toBe(1)
    expect(stats.totalRides).toBe(5)
  })

  it('deve somar receita total apenas de corridas concluídas', async () => {
    const rides = [
      makeRide('completed', 30.0),
      makeRide('completed', 20.5),
      makeRide('cancelled', 15.0),
    ]
    const { userRepo, rideRepo } = makeRepos([], rides)
    const useCase = new GetDashboardStatsUseCase(userRepo, rideRepo)

    const stats = await useCase.execute()

    expect(stats.totalRevenue).toBeCloseTo(50.5)
  })

  it('deve retornar zeros quando não há dados', async () => {
    const { userRepo, rideRepo } = makeRepos([], [])
    const useCase = new GetDashboardStatsUseCase(userRepo, rideRepo)

    const stats = await useCase.execute()

    expect(stats.totalUsers).toBe(0)
    expect(stats.totalRides).toBe(0)
    expect(stats.totalRevenue).toBe(0)
    expect(stats.pendingApprovals).toBe(0)
  })
})
