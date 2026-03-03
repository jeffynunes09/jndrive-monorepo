import { Router } from 'express'
import { GeocodeController } from './geocode.controller'

const router = Router()
const controller = new GeocodeController()

// GET /api/geocode/forward?address=Rua das Flores, São Paulo
router.get('/forward', controller.forward.bind(controller))

// GET /api/geocode/reverse?lat=-19.93&lng=-43.95
router.get('/reverse', controller.reverse.bind(controller))

export default router
