import dotenv from 'dotenv'
dotenv.config()
import jwt, { Secret } from 'jsonwebtoken'
import { IActivationToken } from '~/types'

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString()
  const token = jwt.sign(
    {
      user,
      activationCode
    },
    process.env.ACTIVATION_TOKEN_SECRET as Secret,
    {
      expiresIn: '5m'
    }
  )
  return {
    token,
    activationCode
  }
}
