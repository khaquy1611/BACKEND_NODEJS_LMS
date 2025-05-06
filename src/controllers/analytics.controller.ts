import { Request, Response, NextFunction } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import CourseModel from '~/models/course.model'
import OrderModel from '~/models/order.model'
import userModel from '~/models/user.model'
import { generateLast12MothsData } from '~/utils/analytics.generator'

// get users analytics --- only for admin
export const getUsersAnalytics = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await generateLast12MothsData(userModel)

    res.status(200).json({
      success: true,
      users
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// get courses analytics --- only for admin
export const getCoursesAnalytics = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await generateLast12MothsData(CourseModel)

    res.status(200).json({
      success: true,
      courses
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// get order analytics --- only for admin
export const getOrderAnalytics = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await generateLast12MothsData(OrderModel)

    res.status(200).json({
      success: true,
      orders
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
