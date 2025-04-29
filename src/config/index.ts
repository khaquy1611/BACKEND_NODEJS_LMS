import { ITokenOptions } from '~/types'
import dotenv from 'dotenv'
dotenv.config()

const accessTokenExpire = parseInt((process.env.ACCESS_TOKEN_EXPIRE as string) || '300', 10)
const refreshTokenExpire = parseInt((process.env.REFRESH_TOKEN_EXPIRE as string) || '1200', 10)

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax'
}

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax'
}
