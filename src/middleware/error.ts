import { NextFunction, Request, Response } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'

const ErrorMiddleware = (
  err: Error & {
    statusCode?: number
    code?: number
    path?: string
    keyValue?: Record<string, unknown>
  },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details in development environment
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err)
  }

  // Set default error properties
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  // Handle different types of errors

  // CastError - MongoDB invalid ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`
    err = new ErrorHandler(message, 400)
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue || {})} entered`
    err = new ErrorHandler(message, 400)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Json web token is invalid. Try again'
    err = new ErrorHandler(message, 400)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Json web token is expired. Try again'
    err = new ErrorHandler(message, 400)
  }

  // Send response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestPath: req.originalUrl // Include the requested path
  })

  // Call next to continue to the next middleware (if any)
  next()
}

export default ErrorMiddleware
