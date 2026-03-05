import { describe, it, expect } from 'vitest'
import { Money } from '../Money'
import { DomainError } from '../../errors/DomainError'

describe('Money value object', () => {
  it('deve criar valor monetário positivo', () => {
    const money = Money.fromNumber(25.5)
    expect(money.toNumber()).toBe(25.5)
  })

  it('deve criar valor zero', () => {
    const money = Money.fromNumber(0)
    expect(money.toNumber()).toBe(0)
  })

  it('deve lançar DomainError para valor negativo', () => {
    expect(() => Money.fromNumber(-1)).toThrow(DomainError)
    expect(() => Money.fromNumber(-0.01)).toThrow(DomainError)
  })

  it('deve arredondar corretamente para centavos', () => {
    const money = Money.fromNumber(10.999)
    expect(money.toNumber()).toBe(11)
  })

  it('deve formatar em BRL', () => {
    const money = Money.fromNumber(25.5)
    const formatted = money.format()
    expect(formatted).toMatch(/R\$/)
    expect(formatted).toContain('25')
  })

  it('deve formatar zero em BRL', () => {
    const money = Money.fromNumber(0)
    expect(money.format()).toMatch(/R\$/)
  })
})
