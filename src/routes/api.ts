import express from 'express'
import { registerUser, activateUser, loginUser, logoutUser } from '../controllers/user.controller'
import { isAuthenticated } from '~/middleware/auth'
const router = express.Router()

router.post('/register', registerUser)
router.post('/active-user', activateUser)
router.post('/login', loginUser)
router.get('/logout', isAuthenticated, logoutUser)

export default router
