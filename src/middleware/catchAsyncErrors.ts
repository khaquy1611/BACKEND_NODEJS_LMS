import { Request, Response, NextFunction } from 'express'

const catchAsyncErrors =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: Error) => {
      next(err)
    })
  }

export default catchAsyncErrors
