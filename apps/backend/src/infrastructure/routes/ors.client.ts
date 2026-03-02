import axios from 'axios'

export interface RouteResult {
  distance: number   // km
  duration: number   // minutes
  geometry: [number, number][]  // [lng, lat] pairs — ORS order
}

/**
 * Fetches a driving route from OpenRouteService.
 * Env var: OPENAI_ROUTES_SERVICE — base URL of the ORS instance.
 * Returns null if the service is unavailable (ride creation still proceeds).
 */
export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult | null> {
  const baseUrl = process.env.OPENAI_ROUTES_SERVICE
  if (!baseUrl) {
    console.warn('[ORS] OPENAI_ROUTES_SERVICE not set — skipping route calculation')
    return null
  }

  try {
    const response = await axios.post(
      `${baseUrl}/v2/directions/driving-car/geojson`,
      {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    )

    const feature = response.data?.features?.[0]
    if (!feature) return null

    const summary = feature.properties?.summary
    const coords: [number, number][] = feature.geometry?.coordinates ?? []

    return {
      distance: Math.round((summary.distance / 1000) * 100) / 100,  // m → km
      duration: Math.round(summary.duration / 60),                   // s → min
      geometry: coords,
    }
  } catch (err: any) {
    console.warn('[ORS] Route fetch failed:', err.message)
    return null
  }
}
