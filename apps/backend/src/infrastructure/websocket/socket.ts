import { Server, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import jwt from 'jsonwebtoken'
import { Server as HttpServer } from 'http'
import { registerRideHandlers } from './handlers/ride.handler'
import { registerDriverHandlers } from './handlers/driver.handler'
import { registerUserHandlers } from './handlers/user.handler'
import { RideService } from '../../modules/ride/ride.service'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production'
const rideService = new RideService()

let io: Server

export async function initWebSocket(httpServer: HttpServer): Promise<Server> {
  const pubClient = new Redis(process.env.REDIS_URL!)
  const subClient = pubClient.duplicate()
  subClient.on('error', (err) => console.error('❌ Redis sub error:', err.message))

  io = new Server(httpServer, {
    cors: { origin: '*' },
    adapter: createAdapter(pubClient, subClient),
  })

  io.on('connection', async (socket: Socket) => {
    console.log(`[WS] Connected: ${socket.id}`)

    const token = socket.handshake.auth?.token as string | undefined
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
        socket.data.userId = payload.userId
        socket.data.role = payload.role

        const activeRide = await rideService.findActiveRideForUser(payload.userId, payload.role)
        if (activeRide) {
          console.log(`rides`,activeRide)
          const room = payload.role === 'driver' ? `driver:${payload.userId}` : `user:${payload.userId}`
          socket.join(room)
        }
       const res = socket.emit('RIDE_RESTORE', activeRide ?? null)
       console.log(`res`,res)
      } catch {
        socket.emit('RIDE_RESTORE', null)
      }
    }

    registerRideHandlers(socket)
    registerDriverHandlers(socket)
    registerUserHandlers(socket)

    socket.on('disconnect', () => {
      console.log(`[WS] Disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('WebSocket not initialized')
  return io
}

const driverSockets = new Map<string, Socket>()

export const DriverSocketManager = {
  add: (driverId: string, socket: Socket) => driverSockets.set(driverId, socket),
  remove: (driverId: string) => driverSockets.delete(driverId),
  get: (driverId: string) => driverSockets.get(driverId),
  isConnected: (driverId: string) => driverSockets.has(driverId),
}
