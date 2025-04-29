import express from 'express'
import { registerUser, activateUser } from '../controllers/user.controller'
const router = express.Router()

router.post('/register', registerUser)
router.post('/active-user', activateUser)

export default router
