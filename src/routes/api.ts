import express from 'express'
import {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInffo,
  socialAuth,
  updateUserInfo,
  updatePassWord,
  updateProfilePicture
} from '../controllers/user.controller'
import { isAuthenticated } from '~/middleware/auth'
const router = express.Router()

router.post('/register', registerUser)
router.post('/active-user', activateUser)
router.post('/login', loginUser)
router.get('/logout', isAuthenticated, logoutUser)
router.get('/refresh-token', updateAccessToken)
router.get('/me', isAuthenticated, getUserInffo)
router.post('/socialAuth', socialAuth)
router.put('/update-user-info', isAuthenticated, updateUserInfo)
router.put('/update-user-password', isAuthenticated, updatePassWord)
router.put('/updated-profile', isAuthenticated, updateProfilePicture)

export default router
