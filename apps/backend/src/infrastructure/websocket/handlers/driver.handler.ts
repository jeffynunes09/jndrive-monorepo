import { Socket } from 'socket.io'
import { SocketEvents } from 'shared-events'
import { getIO, DriverSocketManager } from '../socket'
import { addDriverLocation, removeDriverLocation } from '../../redis/redis.client'
import { RideService } from '../../../modules/ride/ride.service'

const rideService = new RideService()

export function registerDriverHandlers(socket: Socket): void {
  socket.on(SocketEvents.DRIVER_ONLINE, async ({ driverId, lat, lng }: { driverId: string; lat: number; lng: number }) => {
    try {
      socket.data.driverId = driverId
      socket.join(`driver:${driverId}`)
      DriverSocketManager.add(driverId, socket)
      await addDriverLocation(driverId, lat, lng)
      console.log(`[WS] Driver ${driverId} online at (${lat}, ${lng})`)
    } catch (err: any) {
      console.error(`[WS] DRIVER_ONLINE error for ${driverId}:`, err.message)
    }
  })

  socket.on(SocketEvents.DRIVER_OFFLINE, async ({ driverId }: { driverId: string }) => {
    socket.leave(`driver:${driverId}`)
    DriverSocketManager.remove(driverId)
    await removeDriverLocation(driverId)
    console.log(`[WS] Driver ${driverId} offline`)
  })

  socket.on(SocketEvents.DRIVER_LOCATION_UPDATE, async ({ driverId, lat, lng }: { driverId: string; lat: number; lng: number }) => {
    await addDriverLocation(driverId, lat, lng)
    const riderId = socket.data.activeRideRiderId as string | undefined
    if (riderId) {
      getIO().to(`user:${riderId}`).emit(SocketEvents.DRIVER_LOCATION_BROADCAST, { lat, lng })
    }
  })

  // Atomic accept — only the first driver to respond wins
  socket.on(SocketEvents.RIDE_REQUEST_RESPONSE, async ({ rideId, driverId, accepted }: { rideId: string; driverId: string; accepted: boolean }) => {
    if (!accepted) {
      console.log(`[WS] Driver ${driverId} rejected ride ${rideId}`)
      return
    }

    const updated = await rideService.acceptRide(rideId, driverId)
    if (!updated) {
      // Another driver already accepted
      console.log(`[WS] Driver ${driverId} tried to accept ride ${rideId} but it was already taken`)
      return
    }

    socket.data.activeRideRiderId = updated.riderId

    getIO()
      .to(`user:${updated.riderId}`)
      .emit(SocketEvents.RIDE_STATUS_UPDATE, {
        rideId,
        status: 'driver_assigned',
        driverId,
      })

    console.log(`[WS] Driver ${driverId} accepted ride ${rideId}`)
  })

  // Driver starts the ride
  socket.on(SocketEvents.RIDE_START, async ({ rideId, driverId }: { rideId: string; driverId: string }) => {
    const updated = await rideService.startRide(rideId, driverId)
    if (!updated) {
      console.log(`[WS] RIDE_START failed for ride ${rideId} — invalid state or driver mismatch`)
      return
    }

    const riderId = socket.data.activeRideRiderId as string | undefined
    if (riderId) {
      getIO()
        .to(`user:${riderId}`)
        .emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'in_progress', driverId })
    }
    socket.emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'in_progress' })

    console.log(`[WS] Driver ${driverId} started ride ${rideId}`)
  })

  // Driver emits payment — simulates full payment flow
  socket.on(SocketEvents.RIDE_PAYMENT_REQUEST, async ({ rideId, driverId }: { rideId: string; driverId: string }) => {
    const io = getIO()
    const riderId = socket.data.activeRideRiderId as string | undefined

    // 1. payment_pending
    await rideService.update(rideId, { status: 'payment_pending' })
    io.to(`user:${riderId}`).emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'payment_pending' })
    socket.emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'payment_pending' })
    console.log(`[WS] Ride ${rideId} — payment pending`)

    // 2. paid (simulated after 1s)
    await new Promise(r => setTimeout(r, 1000))
    const paid = await rideService.processPayment(rideId)
    if (!paid) return

    io.to(`user:${riderId}`).emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'paid', paymentConfirmed: true })
    socket.emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'paid', paymentConfirmed: true })
    console.log(`[WS] Ride ${rideId} — payment confirmed`)

    // 3. completed (after 1s)
    await new Promise(r => setTimeout(r, 1000))
    const finished = await rideService.finishRide(rideId)
    if (!finished) return

    io.to(`user:${riderId}`).emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'completed' })
    socket.emit(SocketEvents.RIDE_STATUS_UPDATE, { rideId, status: 'completed' })
    console.log(`[WS] Ride ${rideId} — completed, driver ${driverId} free`)

    // Free driver for new rides
    delete socket.data.activeRideRiderId
  })

  socket.on('disconnect', async () => {
    const driverId = socket.data.driverId as string | undefined
    if (!driverId) return
    DriverSocketManager.remove(driverId)
    await removeDriverLocation(driverId)
    console.log(`[WS] Driver ${driverId} disconnected`)
  })
}
