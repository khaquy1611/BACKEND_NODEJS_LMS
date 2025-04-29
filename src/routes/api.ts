import express from 'express'
import { registerUser, activateUser, loginUser, logoutUser, updateAccessToken } from '../controllers/user.controller'
import { isAuthenticated } from '~/middleware/auth'
const router = express.Router()

router.post('/register', registerUser)
router.post('/active-user', activateUser)
router.post('/login', loginUser)
router.get('/logout', isAuthenticated, logoutUser)
router.get('/refresh-token', updateAccessToken)

export default router
