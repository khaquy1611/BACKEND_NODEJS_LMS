import express from 'express'
import { createLayout, deleteLayout, editLayout, getLayoutByType } from '~/controllers/layout.controller'
import { authorizeRole, isAuthenticated } from '~/middleware/auth'

const router = express.Router()

router.post('/create-layout', isAuthenticated, authorizeRole('admin'), createLayout)

router.put('/edit-layout', isAuthenticated, authorizeRole('admin'), editLayout)

router.get('/get-layout/:type', getLayoutByType)

router.delete('/delete-layout/:type', deleteLayout)

export default router
