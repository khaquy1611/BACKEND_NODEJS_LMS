import dotenv from 'dotenv'
dotenv.config()
import jwt, { Secret } from 'jsonwebtoken'
import { DecodedToken, IActivationToken } from '~/types'

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

export const verifyActivationToken = (token: string, secret: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, secret) as DecodedToken
    return decoded
  } catch (error: any) {
    throw new Error('Invalid or expired activation token')
  }
}
