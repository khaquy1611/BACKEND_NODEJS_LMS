import { Response } from 'express'
import userModel from '~/models/user.mode'

// get user by id
export const getUserById = async (id: string | undefined, res: Response) => {
  const user = await userModel.findById(id)
  res.status(201).json({
    success: true,
    user
  })
}
