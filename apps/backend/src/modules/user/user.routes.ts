import { Router } from 'express'
import { UserController } from './user.controller'
import { authMiddleware } from '../../infrastructure/middleware/auth.middleware'

const router = Router()
const controller = new UserController()

// Authenticated: own profile
router.get('/users/me', authMiddleware, controller.getMe.bind(controller))
router.patch('/users/me', authMiddleware, controller.updateMe.bind(controller))
router.post('/users/me/upload-url', authMiddleware, controller.getUploadUrl.bind(controller))

// Admin / general
router.post('/users', controller.create.bind(controller))
router.get('/users', controller.findAll.bind(controller))
router.get('/users/:id', controller.findById.bind(controller))
router.patch('/users/:id', controller.update.bind(controller))
router.delete('/users/:id', controller.delete.bind(controller))

export default router
