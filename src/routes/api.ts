import express from 'express'
import { registerUser, activateUser, loginUser, logoutUser } from '../controllers/user.controller'
const router = express.Router()

router.post('/register', registerUser)
router.post('/active-user', activateUser)
router.post('/login', loginUser)
router.get('/logout', logoutUser)

export default router
