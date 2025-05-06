import express from 'express'
import { getCoursesAnalytics, getOrderAnalytics, getUsersAnalytics } from '~/controllers/analytics.controller'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'

const router = express.Router()

router.get('/get-users-analytics', isAuthenticated, authorizeRole('admin'), getUsersAnalytics)

router.get('/get-orders-analytics', isAuthenticated, authorizeRole('admin'), getOrderAnalytics)

router.get('/get-courses-analytics', isAuthenticated, authorizeRole('admin'), getCoursesAnalytics)

export default router
