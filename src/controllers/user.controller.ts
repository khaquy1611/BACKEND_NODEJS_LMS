import { Request, Response, NextFunction } from 'express'
import userModel, { IUser } from './../models/user.mode'
import ErrorHandler from '~/errors/ErrorHandler'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import { IActivationRequest, IRegistrationBody } from '~/types'
import { createActivationToken, verifyActivationToken } from '~/helpers'
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

export const activateUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activation_token, activation_code }: IActivationRequest = req.body
    const newUser = verifyActivationToken(activation_token, process.env.ACTIVATION_TOKEN_SECRET! as string) as {
      user: IUser
      activationCode: string
    }
    if (activation_code !== newUser.activationCode) {
      return next(new ErrorHandler('Invalid activation code', 400))
    }
    const { name, email, password } = newUser.user
    const existUser = await userModel.findOne({ email })
    if (existUser) {
      return next(new ErrorHandler('User already exists', 400))
    }
    const user = await userModel.create({
      name,
      email,
      password
    })
    res.status(201).json({
      success: true,
      message: 'User activated successfully',
      user
    })
  } catch (error: any) {
    return next(new ErrorHandler(`${error.message}`, 400))
  }
})
