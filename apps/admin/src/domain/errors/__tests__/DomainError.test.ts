import { describe, it, expect } from 'vitest'
import { DomainError } from '../DomainError'

describe('DomainError', () => {
  it('deve ter name correto', () => {
    const error = new DomainError('mensagem de teste')
    expect(error.name).toBe('DomainError')
  })

  it('deve ter a mensagem passada', () => {
    const error = new DomainError('algo deu errado')
    expect(error.message).toBe('algo deu errado')
  })

  it('deve ser instância de Error', () => {
    expect(new DomainError('erro')).toBeInstanceOf(Error)
  })
})
