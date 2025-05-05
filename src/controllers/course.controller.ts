import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import { Request, Response, NextFunction } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'
import cloudinary from 'cloudinary'
import { createCourse } from '~/services/course.service'
import CourseModel from '~/models/course.model'

// upload course
export const uploadCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    const thumbnail = data.thumbnail
    if (thumbnail) {
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: 'courses'
      })
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url
      }
    }
    createCourse(req, res, next)
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// edit course
export const editCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    const thumbnail = data.thumbnail
    if (thumbnail) {
      await cloudinary.v2.uploader.destroy(thumbnail.public_id)
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: 'courses'
      })
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url
      }
    }
    const courseId = req?.params?.id
    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      {
        $set: data
      },
      { new: true }
    )
    res.status(201).json({
      success: true,
      course
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
