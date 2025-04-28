// routes/index.js
import express from 'express'
import userRoutes from './api'
// You can add other route imports here like:
// import productRoutes from './product.routes'

const router = express.Router()

// Mount resource-specific routes
router.use('/users', userRoutes)
// router.use('/products', productRoutes)
// router.use('/categories', categoryRoutes)
// etc.

export default router
