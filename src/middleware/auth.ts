import { Request, Response, NextFunction } from 'express'
import catchAsyncErrors from './catchAsyncErrors'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { redis } from '~/config/redis'
import ErrorHandler from '~/errors/ErrorHandler'

// authenticated user
export const isAuthenticated = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.access_token as string

  if (!accessToken) {
    return next(new ErrorHandler('Please login to access this resource', 401))
  }

  const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload
  if (!decoded) {
    return next(new ErrorHandler('Invalid or expired token', 401))
  }

  const user = await redis.get(decoded.id)
  if (!user) {
    return next(new ErrorHandler('Please login to access this resource', 401))
  }

  req.user = JSON.parse(user)

  next()
})

// validate user role
export const authorizeRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      return next(new ErrorHandler(`Role ${req.user?.role} is not allowed access to the resource`, 403))
    }
    next()
  }
}
