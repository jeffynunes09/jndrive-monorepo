// Shared configuration constants

export const AppConfig = {
  NEARBY_DRIVERS_RADIUS_KM: 5,
  BASE_FARE: 5.0,       // R$ fixo de bandeirada
  FARE_PER_KM: 2.5,     // R$ por km rodado
  FARE_PER_MIN: 0.3,    // R$ por minuto de duração
  DEBOUNCE_TIME_MS: 500,
  PRE_BOOK_RIDE_WINDOW_MIN: 20,
  DRIVER_HEARTBEAT_TIMEOUT_S: 45,
  RIDE_REQUEST_TIMEOUT_S: 30,
} as const

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const
