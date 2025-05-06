import { Request, Response } from 'express'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import CourseModel from '~/models/course.model'

export const createCourse = catchAsyncErrors(async (req: Request, res: Response) => {
  const course = await CourseModel.create(req.body)
  res.status(201).json({
    success: true,
    message: 'Create course success',
    course
  })
})

// Get All Courses
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 })

  res.status(201).json({
    success: true,
    courses
  })
}
