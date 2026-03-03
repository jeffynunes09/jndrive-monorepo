import { Worker, Job } from 'bullmq'
import { Queues } from '../infrastructure/queue/queue'
import { RideService } from '../modules/ride/ride.service'
import { getIO } from '../infrastructure/websocket/socket'

interface RideExpiryJob {
  rideId: string
}

const rideService = new RideService()

export const rideExpiryWorker = new Worker<RideExpiryJob>(
  Queues.RIDE_EXPIRY,
  async (job: Job<RideExpiryJob>) => {
    const { rideId } = job.data

    const ride = await rideService.findById(rideId)
    if (!ride || ride.status !== 'searching_driver') return

    await rideService.update(rideId, {
      status: 'cancelled',
      cancelledBy: 'admin',
      cancelledAt: new Date(),
    })

    const io = getIO()
    io.to(`user:${ride.riderId}`).emit('RIDE_STATUS_UPDATE', {
      rideId,
      status: 'cancelled',
    })

    console.log(`[Worker] Corrida ${rideId} cancelada automaticamente por timeout`)
  },
  { connection: { url: process.env.REDIS_URL } }
)

rideExpiryWorker.on('failed', (job, err) => {
  console.error(`[Worker] RideExpiry job ${job?.id} falhou:`, err.message)
})
