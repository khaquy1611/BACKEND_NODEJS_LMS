import express from 'express'
import { createOrder, getAllOrders } from '~/controllers/order.controller'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'

const router = express.Router()

router.post('/create-order', isAuthenticated, createOrder)
router.get('/get-orders', isAuthenticated, authorizeRole('admin'), getAllOrders)

export default router
