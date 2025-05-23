/* eslint-disable @typescript-eslint/no-explicit-any */
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import { Request, Response, NextFunction } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'
import cloudinary from 'cloudinary'
import axios from 'axios'
import { createCourse, getAllCoursesService } from '~/services/course.service'
import CourseModel from '~/models/course.model'
import { redis } from '~/config/redis'
import { IAddAnswerData, IAddQuestionData, IAddReviewData } from '~/types'
import mongoose from 'mongoose'
import NotificationModel from '~/models/notification.model'
import { sendEmail } from '~/utils'

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

// get single course --- without purchasing
export const getSingleCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id

    const isCacheExist = await redis.get(courseId)

    if (isCacheExist) {
      const course = JSON.parse(isCacheExist)
      res.status(200).json({
        success: true,
        course
      })
    } else {
      const course = await CourseModel.findById(req.params.id).select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
      )

      await redis.set(courseId, JSON.stringify(course), 'EX', 604800) // 7days

      res.status(200).json({
        success: true,
        course
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// get all courses --- without purchasing
export const getAllCourses = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isCacheExist = await redis.get('allCourses')
    if (isCacheExist) {
      const courses = JSON.parse(isCacheExist)
      res.status(200).json({
        success: true,
        courses
      })
    } else {
      const courses = await CourseModel.find().select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
      )
      await redis.set('allCourses', JSON.stringify(courses))
      res.status(200).json({
        success: true,
        courses
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// get course content -- only for valid user
export const getCourseByUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses
    const courseId = req.params.id
    if (!courseId) {
      return next(new ErrorHandler('Params Id is missing', 404))
    }

    const courseExists = userCourseList?.find((course: { _id: string }) => course._id.toString() === courseId)

    if (!courseExists) {
      return next(new ErrorHandler('You are not eligible to access this course', 404))
    }

    const course = await CourseModel.findById(courseId)
    if (!course) {
      return next(new ErrorHandler('Cannot find the data course by Id', 404))
    }

    const content = course?.courseData

    res.status(200).json({
      success: true,
      content
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
// add question in course

export const addQuestion = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, courseId, contentId }: IAddQuestionData = req.body
    const course = await CourseModel.findById(courseId)
    if (!course) {
      return next(new ErrorHandler('Cannot find the data course by Id', 404))
    }
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler('Invalid content id', 400))
    }
    const couseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))

    if (!couseContent) {
      return next(new ErrorHandler('Invalid content id', 400))
    }

    const newQuestion: any = {
      user: req.user,
      question,
      questionReplies: []
    }

    // add this question to our course content
    couseContent.questions.push(newQuestion)

    await NotificationModel.create({
      user: req.user?._id,
      title: 'New Question Received',
      message: `You have a new question in ${couseContent.title}`
    })

    // save the updated course
    await course?.save()

    res.status(200).json({
      success: true,
      course
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// add answer in course question
export const addAnwser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body

    const course = await CourseModel.findById(courseId)

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler('Invalid content id', 400))
    }

    const couseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))

    if (!couseContent) {
      return next(new ErrorHandler('Invalid content id', 400))
    }

    const question = couseContent?.questions?.find((item: any) => item._id.equals(questionId))

    if (!question) {
      return next(new ErrorHandler('Invalid question id', 400))
    }

    // create a new answer object
    const newAnswer: any = {
      user: req.user,
      answer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // add this answer to our course content
    question?.questionReplies?.push(newAnswer)

    await course?.save()

    if (req.user?._id === question.user._id) {
      // create a notification
      await NotificationModel.create({
        user: req.user?._id,
        title: 'New Question Reply Received',
        message: `You have a new question reply in ${couseContent.title}`
      })
    } else {
      const data = {
        name: question.user.name,
        title: couseContent.title
      }

      // Kiểm tra xem email có tồn tại
      if (!question.user.email) {
        return next(new ErrorHandler('Cannot send email, User not found', 400))
      } else {
        try {
          await sendEmail({
            email: question.user.email,
            subject: 'Question Reply',
            template: 'question-reply.ejs',
            data
          })
        } catch (error) {
          if (error instanceof Error) {
            return next(new ErrorHandler(error.message, 400))
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      course
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

export const addReview = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses

    const courseId = req.params.id

    // check if courseId already exists in userCourseList based on _id
    const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId.toString())

    if (!courseExists) {
      return next(new ErrorHandler('You are not eligible to access this course', 404))
    }

    const course = await CourseModel.findById(courseId)

    const { review, rating } = req.body as IAddReviewData

    const reviewData: any = {
      user: req.user,
      rating,
      comment: review
    }

    course?.reviews.push(reviewData)

    let avg = 0

    course?.reviews.forEach((rev: any) => {
      avg += rev.rating
    })

    if (course) {
      course.ratings = avg / course.reviews.length // one example we have 2 reviews one is 5 another one is 4 so math working like this = 9 / 2  = 4.5 ratings
    }

    await course?.save()

    await redis.set(courseId, JSON.stringify(course), 'EX', 604800) // 7days
    // create notification
    await NotificationModel.create({
      user: req.user?._id,
      title: 'New Review Received',
      message: `${req.user?.name} has given a review in ${course?.name}`
    })

    res.status(200).json({
      success: true,
      course
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// add reply in review
export const addReplyToReview = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comment, courseId, reviewId } = req.body as IAddReviewData

    const course = await CourseModel.findById(courseId)

    if (!course) {
      return next(new ErrorHandler('Course not found', 404))
    }

    const review = course?.reviews?.find((rev: any) => rev._id.toString() === reviewId)

    if (!review) {
      return next(new ErrorHandler('Review not found', 404))
    }

    const replyData: any = {
      user: req.user,
      comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (!review.commentReplies) {
      review.commentReplies = []
    }

    review.commentReplies?.push(replyData)

    await course?.save()

    await redis.set(courseId, JSON.stringify(course), 'EX', 604800) // 7days

    res.status(200).json({
      success: true,
      course
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// get all courses --- only for admin
export const getAdminAllCourses = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    getAllCoursesService(res)
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// Delete Course --- only for admin
export const deleteCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const course = await CourseModel.findById(id)

    if (!course) {
      return next(new ErrorHandler('course not found', 404))
    }

    await course.deleteOne({ id })

    await redis.del(id)

    res.status(200).json({
      success: true,
      message: 'course deleted successfully'
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// generate video url
export const generateVideoUrl = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.body
    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      { ttl: 300 },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`
        }
      }
    )
    res.json(response.data)
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
