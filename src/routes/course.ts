import express from 'express'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'
import {
  addAnwser,
  addQuestion,
  editCourse,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  uploadCourse
} from '~/controllers/course.controller'

const router = express.Router()

router.post('/create-course', isAuthenticated, authorizeRole('admin'), uploadCourse)
router.put('/edit-course/:id', isAuthenticated, authorizeRole('admin'), editCourse)
router.get('/get-course/:id', getSingleCourse)
router.get('/get-course', getAllCourses)
router.get('/get-course-content/:id', isAuthenticated, getCourseByUser)
router.put('/add-question', isAuthenticated, addQuestion)
router.put('/add-answer', isAuthenticated, addAnwser)

export default router
