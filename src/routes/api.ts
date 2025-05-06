// routes/index.js
import express from 'express'
import userRoutes from './user.route'
import courseRoutes from './course.route'
import orderRoutes from './order.route'
import notifiRoutes from './notification.route'
import analyticsRoutes from './analytics.route'
import layoutRoutes from './layout.route'
// You can add other route imports here like:
// import productRoutes from './product.routes'

const router = express.Router()

// Mount resource-specific routes
router.use('/users', userRoutes)
router.use('/courses', courseRoutes)
router.use('/order', orderRoutes)
router.use('/notification', notifiRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/layout', layoutRoutes)
// etc.

export default router
