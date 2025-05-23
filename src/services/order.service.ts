import { Response } from 'express'
import catchAsyncErrors from '../middleware/catchAsyncErrors'
import OrderModel from '~/models/order.model'

// create new order
export const newOrder = catchAsyncErrors(async (data: any, res: Response) => {
  const order = await OrderModel.create(data)

  res.status(201).json({
    succcess: true,
    order
  })
})

// Get All Orders
export const getAllOrdersService = async (res: Response) => {
  const orders = await OrderModel.find().sort({ createdAt: -1 })

  res.status(201).json({
    success: true,
    orders
  })
}
