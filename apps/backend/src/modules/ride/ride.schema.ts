import { Schema, model, Document } from 'mongoose'

export type RideStatus =
  | 'pending'
  | 'searching_driver'
  | 'driver_assigned'
  | 'driver_en_route'
  | 'in_progress'
  | 'payment_pending'
  | 'paid'
  | 'completed'
  | 'cancelled'

export interface ICoordinate {
  lat: number
  lng: number
  address: string
}

export interface IRide extends Document {
  riderId: string
  driverId?: string
  origin: ICoordinate
  destination: ICoordinate
  status: RideStatus
  fare?: number
  distance?: number
  duration?: number
  paymentConfirmed?: boolean
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  cancelledBy?: 'rider' | 'driver' | 'admin'
  createdAt: Date
  updatedAt: Date
}

const CoordinateSchema = new Schema<ICoordinate>({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true },
})

const RideSchema = new Schema<IRide>(
  {
    riderId: { type: String, required: true },
    driverId: { type: String },
    origin: { type: CoordinateSchema, required: true },
    destination: { type: CoordinateSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'searching_driver', 'driver_assigned', 'driver_en_route', 'in_progress', 'payment_pending', 'paid', 'completed', 'cancelled'],
      default: 'pending',
    },
    fare: { type: Number },
    distance: { type: Number },
    duration: { type: Number },
    paymentConfirmed: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['rider', 'driver', 'admin'] },
  },
  { timestamps: true }
)

export const Ride = model<IRide>('Ride', RideSchema)
