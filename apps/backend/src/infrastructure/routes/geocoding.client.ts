import axios from 'axios'

export interface GeocodeResult {
  lat: number
  lng: number
  address: string
}

function getBaseUrl(): string | null {
  const baseUrl = process.env.OPENAI_ROUTES_SERVICE
  if (!baseUrl) return null
  const { protocol, host } = new URL(baseUrl)
  return `${protocol}//${host}`
}

/**
 * Forward geocoding: endereço em texto → coordenadas
 * GET /geocode/search?api_key=KEY&text=ADDRESS&size=1
 */
export async function forwardGeocode(text: string): Promise<GeocodeResult | null> {
  const base = getBaseUrl()
  const apiKey = process.env.ORS_API_KEY
  if (!base || !apiKey) {
    console.warn('[Geocode] OPENAI_ROUTES_SERVICE ou ORS_API_KEY não configurado')
    return null
  }

  try {
    const response = await axios.get(`${base}/geocode/search`, {
      params: { api_key: apiKey, text, size: 1 },
      timeout: 6000,
    })

    const feature = response.data?.features?.[0]
    if (!feature) return null

    const [lng, lat] = feature.geometry.coordinates as [number, number]
    const address: string = feature.properties?.label ?? text

    return { lat, lng, address }
  } catch (err: any) {
    console.warn(`[Geocode] forward failed: ${err.message}`)
    return null
  }
}

/**
 * Reverse geocoding: coordenadas → endereço em texto
 * GET /geocode/reverse?api_key=KEY&point.lon=LNG&point.lat=LAT&size=1
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const base = getBaseUrl()
  const apiKey = process.env.ORS_API_KEY
  if (!base || !apiKey) {
    console.warn('[Geocode] OPENAI_ROUTES_SERVICE ou ORS_API_KEY não configurado')
    return null
  }

  try {
    const response = await axios.get(`${base}/geocode/reverse`, {
      params: { api_key: apiKey, 'point.lat': lat, 'point.lon': lng, size: 1 },
      timeout: 6000,
    })

    const feature = response.data?.features?.[0]
    if (!feature) return null

    return feature.properties?.label as string ?? null
  } catch (err: any) {
    console.warn(`[Geocode] reverse failed: ${err.message}`)
    return null
  }
}
