import { NextFunction, Response } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'

const ErrorMiddleWare = (err: any, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'
  // wrong mongo db is error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`
    err = new ErrorHandler(message, 400)
  }
  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`
    err = new ErrorHandler(message, 400)
  }
  // wrong JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Json web token is invalid. Try again'
    err = new ErrorHandler(message, 400)
  }
  // jwt expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Json web token is expired. Try again'
    err = new ErrorHandler(message, 400)
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

export default ErrorMiddleWare
