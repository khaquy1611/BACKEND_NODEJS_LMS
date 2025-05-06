import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import { Request, Response, NextFunction } from 'express'
import { IOrder } from '~/models/order.model'
import CourseModel, { ICourse } from '~/models/course.model'
import { sendEmail } from '~/utils'
import ErrorHandler from '~/errors/ErrorHandler'
import { redis } from '~/config/redis'
import NotificationModel from '~/models/notification.model'
import userModel from '~/models/user.model'
import { newOrder } from '~/services/order.service'

// create order
export const createOrder = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, payment_info } = req.body as IOrder
    const user = await userModel.findById(req.user?._id)
    const courseExistInUser = user?.courses.some((course: { _id: string }) => course._id.toString() === courseId)

    if (courseExistInUser) {
      return next(new ErrorHandler('You have already purchased this course', 400))
    }

    const course: ICourse | null = await CourseModel.findById(courseId)

    if (!course) {
      return next(new ErrorHandler('Course not found', 404))
    }

    const data: any = {
      courseId: course._id,
      userId: user?._id,
      payment_info
    }

    const mailData = {
      order: {
        _id: course?._id.toString().slice(0, 6),
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    }

    try {
      if (user) {
        await sendEmail({
          email: user.email,
          subject: 'Order Confirmation',
          template: 'order-confirmation.ejs',
          data: mailData
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(error.message, 400))
      }
    }

    if (course?._id) {
      user?.courses.push({ _id: course._id.toString() })
    }

    if (req.user?._id) {
      await redis.set(req.user._id.toString(), JSON.stringify(user))
    }

    await user?.save()

    await NotificationModel.create({
      user: user?._id,
      title: 'New Order',
      message: `You have a new order from ${course?.name}`
    })

    course.purchased = course.purchased + 1

    await course.save()

    newOrder(data, res, next)
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
