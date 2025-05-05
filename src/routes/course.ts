import express from 'express'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'
import { editCourse, uploadCourse } from '~/controllers/course.controller'

const router = express.Router()

router.post('/create-course', isAuthenticated, authorizeRole('admin'), uploadCourse)
router.put('/edit-course/:id', isAuthenticated, authorizeRole('admin'), editCourse)

export default router
