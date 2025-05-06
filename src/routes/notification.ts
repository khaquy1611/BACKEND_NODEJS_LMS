import express from 'express'
import { getNotifications, updateNotification } from '~/controllers/notification.controller'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'

const router = express.Router()

router.get('/get-all-notifications', isAuthenticated, authorizeRole('admin'), getNotifications)
router.put('/update-notification/:id', isAuthenticated, authorizeRole('admin'), updateNotification)

export default router
