import { describe, it, expect } from 'vitest'
import { RideStatus } from '../RideStatus'
import { DomainError } from '../../errors/DomainError'

describe('RideStatus value object', () => {
  it('deve criar status válido', () => {
    const status = RideStatus.create('in_progress')
    expect(status.toString()).toBe('in_progress')
  })

  it('deve lançar DomainError para status inválido', () => {
    expect(() => RideStatus.create('inexistente')).toThrow(DomainError)
    expect(() => RideStatus.create('')).toThrow(DomainError)
  })

  it('deve retornar label em português', () => {
    expect(RideStatus.create('in_progress').label()).toBe('Em andamento')
    expect(RideStatus.create('searching_driver').label()).toBe('Buscando motorista')
    expect(RideStatus.create('completed').label()).toBe('Concluída')
    expect(RideStatus.create('cancelled').label()).toBe('Cancelada')
    expect(RideStatus.create('driver_assigned').label()).toBe('Motorista atribuído')
    expect(RideStatus.create('payment_pending').label()).toBe('Aguardando pagamento')
  })

  it('deve identificar status terminais', () => {
    expect(RideStatus.create('completed').isTerminal()).toBe(true)
    expect(RideStatus.create('cancelled').isTerminal()).toBe(true)
  })

  it('deve identificar status não terminais', () => {
    expect(RideStatus.create('in_progress').isTerminal()).toBe(false)
    expect(RideStatus.create('searching_driver').isTerminal()).toBe(false)
    expect(RideStatus.create('driver_assigned').isTerminal()).toBe(false)
    expect(RideStatus.create('pending').isTerminal()).toBe(false)
  })

  it('deve permitir cancelamento em status não terminais', () => {
    expect(RideStatus.create('in_progress').canBeCancelledByAdmin()).toBe(true)
    expect(RideStatus.create('searching_driver').canBeCancelledByAdmin()).toBe(true)
  })

  it('não deve permitir cancelamento em status terminais', () => {
    expect(RideStatus.create('completed').canBeCancelledByAdmin()).toBe(false)
    expect(RideStatus.create('cancelled').canBeCancelledByAdmin()).toBe(false)
  })
})
