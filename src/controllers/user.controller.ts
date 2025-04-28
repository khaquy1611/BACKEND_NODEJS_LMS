import { Request, Response, NextFunction } from 'express'
import userModel from './../models/user.mode'
import ErrorHandler from '~/errors/ErrorHandler'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import { IRegistrationBody } from '~/types'
import { createActivationToken } from '~/helpers'
import path from 'path'
import ejs from 'ejs'
import { sendEmail } from '~/utils'

export const registerUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password }: IRegistrationBody = req.body
    const isEmailExist = await userModel.findOne({ email })
    if (isEmailExist) {
      return next(new ErrorHandler('Email already exists', 400))
    }

    const user: IRegistrationBody = {
      name,
      email,
      password
    }
    const activationToken = createActivationToken(user)
    const data = { user: { name: user.name }, activationToken }
    const html = await ejs.renderFile(path.join(__dirname, '../mails/activation-email.ejs'), data)
    try {
      await sendEmail({
        email: user.email,
        subject: 'Activate your account',
        template: 'activation-email.ejs',
        data,
        html
      })
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to activate your account.',
        accessToken: activationToken.token
      })
    } catch (error: any) {
      return next(new ErrorHandler(`${error.message}`, 400))
    }
  } catch (error: any) {
    return next(new ErrorHandler(`${error.message}`, 400))
  }
})
