import express from 'express'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'
import {
  addAnwser,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  getAdminAllCourses,
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
router.put('/add-review/:id', isAuthenticated, addReview)

router.put('/add-reply', isAuthenticated, authorizeRole('admin'), addReplyToReview)
router.get('/get-admin-courses', isAuthenticated, authorizeRole('admin'), getAdminAllCourses)
router.delete('/delete-course/:id', isAuthenticated, authorizeRole('admin'), deleteCourse)

export default router
