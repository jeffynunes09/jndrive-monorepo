import { Platform } from 'react-native'
import { RideDTO } from '../../../packages/shared-types/src/index'

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')

export interface AuthResult {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Erro inesperado')
  }

  return data as T
}

export function register(params: {
  name: string
  email: string
  password: string
  phone?: string
}): Promise<AuthResult> {
  return post<AuthResult>('/api/auth/register', { ...params, role: 'rider' })
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${API_URL}${path}?${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Erro inesperado')
  return data as T
}

export function login(params: { email: string; password: string }): Promise<AuthResult> {
  return post<AuthResult>('/api/auth/login', params)
}

export function getHistoryRides(params: { riderId?: string; driverId?: string }): Promise<RideDTO[]> {
  const clean: Record<string, string> = {}
  if (params.riderId) clean.riderId = params.riderId
  if (params.driverId) clean.driverId = params.driverId
  return get<RideDTO[]>('/api/rides', clean)
}
