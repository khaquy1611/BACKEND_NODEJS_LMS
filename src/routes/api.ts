// routes/index.js
import express from 'express'
import userRoutes from './user'
import courseRoutes from './course'
import orderRoutes from './order'
import notifiRoutes from './notification'
// You can add other route imports here like:
// import productRoutes from './product.routes'

const router = express.Router()

// Mount resource-specific routes
router.use('/users', userRoutes)
router.use('/courses', courseRoutes)
router.use('/order', orderRoutes)
router.use('/notification', notifiRoutes)
// etc.

export default router
