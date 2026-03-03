import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = '@jndrive_rider_token'
const USER_KEY = '@jndrive_rider_user'
const ACTIVE_RIDE_KEY = '@jndrive_rider_active_ride'

export interface StoredUser {
  id: string
  name: string
  email: string
  role: string
}

export interface StoredActiveRide {
  rideId: string
  status: string
  origin: { lat: number; lng: number; address: string }
  destination: { lat: number; lng: number; address: string }
  otp: string | null
  fare: number | null
  distance: number | null
  duration: number | null
  driverId?: string
  geometry?: [number, number][]
}

export async function saveAuth(token: string, user: StoredUser): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ])
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ACTIVE_RIDE_KEY])
}

export async function saveActiveRide(ride: StoredActiveRide): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_RIDE_KEY, JSON.stringify(ride))
}

export async function getActiveRide(): Promise<StoredActiveRide | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_RIDE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredActiveRide
  } catch {
    return null
  }
}

export async function clearActiveRide(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_RIDE_KEY)
}
