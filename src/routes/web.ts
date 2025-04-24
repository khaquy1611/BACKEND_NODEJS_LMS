import express from 'express'
import { getHomePage, getABC, getSample } from '../controllers/homeController'
const router = express.Router()

router.get('/', getHomePage)

router.get('/abc', getABC)

router.get('/sample', getSample)

export default router
