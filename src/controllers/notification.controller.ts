import { NextFunction, Request, Response } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import NotificationModel from '~/models/notification.model'
import cron from 'node-cron'

// get all Notifications
export const getNotifications = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await NotificationModel.find().sort({
      createdAt: -1
    })

    res.status(201).json({
      success: true,
      notifications
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// update notification status --- only admin
export const updateNotification = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await NotificationModel.findById(req.params.id)
    if (!notification) {
      return next(new ErrorHandler('Notification not found', 404))
    } else {
      if (notification.status) {
        notification.status = 'read'
      }
    }

    await notification.save()

    const notifications = await NotificationModel.find().sort({
      createdAt: -1
    })

    res.status(201).json({
      success: true,
      notifications
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// delete notification --- only admin
cron.schedule('0 0 0 * * *', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await NotificationModel.deleteMany({ status: 'read', createdAt: { $lt: thirtyDaysAgo } })
  console.log('Deleted read notifications')
})
