import { describe, it, expect, vi } from 'vitest'
import { JwtAuthGateway } from '../JwtAuthGateway'
import type { IHttpClient } from '../../../application/ports/IHttpClient'
import type { IStorageGateway } from '../../../application/ports/IStorageGateway'
import { TOKEN_KEY } from '../../http/api.config'

function makeHttp(response: object): IHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue(response),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}

function makeStorage(): IStorageGateway {
  const store: Record<string, string> = {}
  return {
    get: vi.fn((key) => store[key] ?? null),
    set: vi.fn((key, value) => { store[key] = value }),
    remove: vi.fn((key) => { delete store[key] }),
  }
}

describe('JwtAuthGateway', () => {
  it('deve salvar token no storage após login', async () => {
    const storage = makeStorage()
    const http = makeHttp({
      token: 'jwt-token',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
    })
    const gateway = new JwtAuthGateway(http, storage)

    await gateway.login('admin@test.com', 'senha123')

    expect(storage.set).toHaveBeenCalledWith(TOKEN_KEY, 'jwt-token')
  })

  it('deve retornar token e dados do usuário no login', async () => {
    const storage = makeStorage()
    const http = makeHttp({
      token: 'jwt-token',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
    })
    const gateway = new JwtAuthGateway(http, storage)

    const result = await gateway.login('admin@test.com', 'senha123')

    expect(result.token).toBe('jwt-token')
    expect(result.user.email).toBe('admin@test.com')
    expect(result.user.role).toBe('admin')
  })

  it('deve remover token do storage no logout', () => {
    const storage = makeStorage()
    const http = makeHttp({})
    const gateway = new JwtAuthGateway(http, storage)

    gateway.logout()

    expect(storage.remove).toHaveBeenCalledWith(TOKEN_KEY)
  })

  it('deve retornar token via getToken', () => {
    const storage = makeStorage()
    ;(storage.get as ReturnType<typeof vi.fn>).mockReturnValue('token-salvo')
    const http = makeHttp({})
    const gateway = new JwtAuthGateway(http, storage)

    expect(gateway.getToken()).toBe('token-salvo')
    expect(storage.get).toHaveBeenCalledWith(TOKEN_KEY)
  })

  it('deve retornar null via getToken quando não há token', () => {
    const storage = makeStorage()
    const http = makeHttp({})
    const gateway = new JwtAuthGateway(http, storage)

    expect(gateway.getToken()).toBeNull()
  })
})
