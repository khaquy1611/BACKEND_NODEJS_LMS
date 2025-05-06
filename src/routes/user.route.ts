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
  updateProfilePicture,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/user.controller'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'
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
router.post('/password/forgot', forgotPassword)
router.post('/password/reset', resetPassword)

router.get('/get-users', isAuthenticated, authorizeRole('admin'), getAllUsers)

router.put('/update-user', isAuthenticated, authorizeRole('admin'), updateUserRole)

router.delete('/delete-user/:id', isAuthenticated, authorizeRole('admin'), deleteUser)

export default router
