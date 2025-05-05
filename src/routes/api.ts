// routes/index.js
import express from 'express'
import userRoutes from './user'
import courseRoutes from './course'
// You can add other route imports here like:
// import productRoutes from './product.routes'

const router = express.Router()

// Mount resource-specific routes
router.use('/users', userRoutes)
router.use('/courses', courseRoutes)
// router.use('/categories', categoryRoutes)
// etc.

export default router
