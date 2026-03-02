import { Socket } from 'socket.io'
import { RideService } from '../../../modules/ride/ride.service'
import { SocketEvents } from 'shared-events'
import { getIO } from '../socket'
import { IRide } from '../../../modules/ride/ride.schema'
import { data } from 'react-router-dom'

const rideService = new RideService()



export function registerRideHandlers(socket: Socket): void {
  socket.on(SocketEvents.RIDE_CREATE, async (payload) => {
    try {
      const { ride, driverIds } = await rideService.requestRide(payload)

      // rider joins their notification room
      if (payload.riderId) {
        socket.join(`user:${payload.riderId}`)
      }

      // notify nearby drivers directly (no worker needed for MVP)
      const io = getIO()
      for (const driverId of driverIds) {
        io.to(`driver:${driverId}`).emit(SocketEvents.RIDE_REQUEST, {
          rideId: ride.id,
          riderId: ride.riderId,
          origin: ride.origin,
          destination: ride.destination,
        })
      }

      console.log(`[WS] Ride ${ride.id} — drivers found: [${driverIds.join(', ')}]`)
      return {
        data: ride,
      } 
        
    } catch (err: any) {
      return{
         error: err.message || 'Failed to create ride'
      }
    }
  })

  socket.on(SocketEvents.RIDE_FIND_ALL, async (payload) => {
    try {
      const rides = await rideService.findAll(payload ?? {})
      return { data: rides }
    } catch (err: any) {
      return { error: err.message }
    }
  })

  socket.on(SocketEvents.RIDE_FIND_BY_ID, async ({ id }) => {
    try {
      const ride = await rideService.findById(id)
      if (!ride) return { error: 'Ride not found' }
      return { data: ride }
    } catch (err: any) {
      return { error: err.message }
    }
  })

  socket.on(SocketEvents.RIDE_UPDATE, async ({ id, ...data }) => {
    try {
      const ride = await rideService.update(id, data)
      if (!ride) return { error: 'Ride not found' }
      return { data: ride }
    } catch (err: any) {
      return { error: err.message }
    }
  })

  socket.on(SocketEvents.RIDE_DELETE, async ({ id }) => {
    try {
      const ride = await rideService.delete(id)
      if (!ride) return { error: 'Ride not found' }
      return { data: { deleted: true } }
    } catch (err: any) {
      return { error: err.message }
    }
  })
  socket.on(SocketEvents.USER_ONLINE,async ({ userId, role }: { userId: string; role: 'rider' | 'driver' }) => {
    socket.data.userId = userId
    socket.join(`${role}:${userId}`)
    console.log(`[WS] ${role} ${userId} joined room`)
  })
}
