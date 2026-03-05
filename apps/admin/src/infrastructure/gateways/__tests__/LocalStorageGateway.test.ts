import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageGateway } from '../LocalStorageGateway'

describe('LocalStorageGateway', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve retornar null para chave inexistente', () => {
    const gateway = new LocalStorageGateway()
    expect(gateway.get('chave_inexistente')).toBeNull()
  })

  it('deve salvar e recuperar valor', () => {
    const gateway = new LocalStorageGateway()
    gateway.set('token', 'abc123')
    expect(gateway.get('token')).toBe('abc123')
  })

  it('deve sobrescrever valor existente', () => {
    const gateway = new LocalStorageGateway()
    gateway.set('token', 'primeiro')
    gateway.set('token', 'segundo')
    expect(gateway.get('token')).toBe('segundo')
  })

  it('deve remover valor', () => {
    const gateway = new LocalStorageGateway()
    gateway.set('token', 'abc123')
    gateway.remove('token')
    expect(gateway.get('token')).toBeNull()
  })

  it('deve remover chave inexistente sem erro', () => {
    const gateway = new LocalStorageGateway()
    expect(() => gateway.remove('nao_existe')).not.toThrow()
  })
})
