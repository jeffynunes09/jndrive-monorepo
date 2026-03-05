import { describe, it, expect } from 'vitest'
import { NotFoundError } from '../NotFoundError'
import { DomainError } from '../DomainError'

describe('NotFoundError', () => {
  it('deve formatar mensagem com recurso e id', () => {
    const error = new NotFoundError('Usuário', 'u123')
    expect(error.message).toBe("Usuário 'u123' não encontrado.")
  })

  it('deve formatar mensagem apenas com recurso', () => {
    const error = new NotFoundError('Corrida')
    expect(error.message).toBe('Corrida não encontrado.')
  })

  it('deve ter name correto', () => {
    const error = new NotFoundError('Recurso')
    expect(error.name).toBe('NotFoundError')
  })

  it('deve ser instância de DomainError', () => {
    expect(new NotFoundError('Recurso')).toBeInstanceOf(DomainError)
  })

  it('deve ser instância de Error', () => {
    expect(new NotFoundError('Recurso')).toBeInstanceOf(Error)
  })
})
