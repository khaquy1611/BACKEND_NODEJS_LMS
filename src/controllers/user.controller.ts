import { Request, Response, NextFunction } from 'express'
import userModel, { IUser } from './../models/user.mode'
import ErrorHandler from '~/errors/ErrorHandler'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import {
  IActivationRequest,
  ILoginRequest,
  IRegistrationBody,
  ISocialAuthBody,
  IUpdatePassWord,
  IUpdateUserInfo
} from '~/types'
import { createActivationToken, verifyActivationToken } from '~/helpers'
import path from 'path'
import ejs from 'ejs'
import { sendEmail, sendToken } from '~/utils'
import { redis } from '~/config/redis'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { accessTokenOptions, refreshTokenOptions } from '~/config'
import { getUserById } from '~/services/user.services'
import cloudinary from 'cloudinary'

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
    if (user) {
      res.status(201).json({
        success: true,
        message: 'User activated successfully'
      })
    }
  } catch (error: any) {
    return next(new ErrorHandler(`${error.message}`, 400))
  }
})

export const loginUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: ILoginRequest = req.body
    if (!email || !password) {
      return next(new ErrorHandler('Please provide email and password', 400))
    }
    const user = await userModel.findOne({ email }).select('+password')
    if (!user) {
      return next(new ErrorHandler('Invalid email or password', 400))
    }
    const isPasswordMatch = await user.comparePassword(password)
    if (!isPasswordMatch) {
      return next(new ErrorHandler('Invalid email or password', 400))
    }

    sendToken(user, 200, res, 'Login successful')
  } catch (error: any) {
    return next(new ErrorHandler(`${error.message}`, 400))
  }
})

// logout user
export const logoutUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie('access_token', '', { maxAge: 1 })
    res.cookie('refresh_token', '', { maxAge: 1 })
    const userId = req.user?._id || ''
    redis.del(userId)
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error: any) {
    return next(new ErrorHandler(`${error.message}`, 400))
  }
})

// refresh token
export const updateAccessToken = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refresh_token = req.cookies.refresh_token as string
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload
    const message = 'Could not refresh token'
    if (!decoded) {
      return next(new ErrorHandler(message, 400))
    }
    const session = await redis.get(decoded.id as string)
    if (!session) {
      return next(new ErrorHandler(message, 400))
    }
    const user = JSON.parse(session)
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: '5m'
    })

    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET as string, {
      expiresIn: '3d'
    })

    req.user = user

    res.cookie('access_token', accessToken, accessTokenOptions)
    res.cookie('refresh_token', refreshToken, refreshTokenOptions)
    res.status(200).json({
      success: true,
      message: 'Success',
      accessToken
    })
  } catch (error: any) {
    return next(new ErrorHandler(`${error.message}`, 400))
  }
})

// get user info
export const getUserInffo = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      return next(new ErrorHandler('User ID not found', 400))
    }
    getUserById(userId, res)
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// social auth
export const socialAuth = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, avatar } = req.body as ISocialAuthBody
    if (!email || !name) {
      return next(new ErrorHandler('Email and name are required for social authentication', 400))
    }
    const user = await userModel.findOne({ email })
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4)
      const newUser = await userModel.create({
        email,
        name,
        password: randomPassword,
        avatar: avatar || {}
      })
      sendToken(newUser, 200, res, 'success')
    } else {
      sendToken(user, 200, res, 'success')
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// update user info

export const updateUserInfo = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body as IUpdateUserInfo
    const userId = req.user?._id
    if (!userId) {
      return next(new ErrorHandler('User ID not found', 400))
    }
    const user = await userModel.findById(userId)
    if (!user) {
      return next(new ErrorHandler('User not found', 404))
    }

    if (email && user) {
      const isEmailExist = await userModel.findOne({ email })
      if (isEmailExist) {
        return next(new ErrorHandler('Email already exist', 400))
      }
      user.email = email
    }
    if (name && user) {
      user.name = name
    }
    await user?.save()
    await redis.set(userId.toString(), JSON.stringify(user))
    res.status(200).json({
      success: true,
      user
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// update user password
export const updatePassWord = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldPassWord, newPassWord } = req.body as IUpdatePassWord
    if (!oldPassWord || !newPassWord) {
      return next(new ErrorHandler('Please enter old or new password', 400))
    }
    const userId = req.user?._id
    if (!userId) {
      return next(new ErrorHandler('User ID not found', 400))
    }
    const user = await userModel.findById(userId).select('+password')
    if (!user) {
      return next(new ErrorHandler('User not found', 404))
    }
    if (user?.password === undefined) {
      return next(new ErrorHandler('Invalid User', 400))
    }
    const isPasswordMatch = await user?.comparePassword(oldPassWord)
    if (!isPasswordMatch) {
      return next(new ErrorHandler('Invalid old Password', 400))
    }
    user.password = newPassWord
    await user.save()
    await redis.set(userId, JSON.stringify(user))
    res.status(200).json({
      success: true,
      user
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// update profile avartar
export const updateProfilePicture = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { avatar } = req.body
    const userId = req.user?._id
    if (!userId) {
      return next(new ErrorHandler('User ID not found', 400))
    }
    const user = await userModel.findById(userId)
    if (!user) {
      return next(new ErrorHandler('User not found', 404))
    }
    if (avatar && user) {
      if (user?.avatar?.public_id) {
        // fisrt delete the old image
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id)

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: 'avatars',
          width: 150
        })
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        }
      } else {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: 'avatars',
          width: 150
        })
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        }
      }
    }
    await user?.save()
    await redis.set(userId, JSON.stringify(user))
    res.status(200).json({
      success: true,
      user
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})
