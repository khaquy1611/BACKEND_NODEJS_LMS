import { Request, Response, NextFunction } from 'express'
import userModel, { IUser } from '../models/user.model'
import ErrorHandler from '~/errors/ErrorHandler'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'
import {
  IActivationRequest,
  IForgotPasswordRequest,
  ILoginRequest,
  IRegistrationBody,
  IResetPasswordRequest,
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
import { getAllUsersService, getUserById, updateUserRoleService } from '~/services/user.service'
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
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler(`${error.message}`, 400))
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(`${error.message}`, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(`${error.message}`, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(`${error.message}`, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(`${error.message}`, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
      return next(new ErrorHandler('Please login for access this resources!', 400))
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
    await redis.set(user._id, JSON.stringify(user), 'EX', 604800)
    res.status(200).json({
      success: true,
      message: 'Success',
      accessToken
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(`${error.message}`, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
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
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// forgot password
export const forgotPassword = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as IForgotPasswordRequest
    if (!email) {
      return next(new ErrorHandler('Please provide an email', 400))
    }
    const user = await userModel.findOne({ email })
    if (!user) {
      return next(new ErrorHandler('User with this email does not exist', 404))
    }
    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.RESET_PASSWORD_SECRET as string, { expiresIn: '15m' })
    await redis.set(`resetToken:${user._id}`, resetToken, 'EX', 60 * 15)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    const data = {
      user: { name: user.name },
      resetUrl
    }
    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Your Password',
        template: 'reset-password.ejs',
        data
      })

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      })
    } catch (error) {
      // If email sending fails, remove token from Redis
      await redis.del(`resetToken:${user._id}`)
      if (error instanceof Error) {
        return next(new ErrorHandler(`Failed to send email: ${error.message}`, 500))
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
  }
})

// Reset password using token
export const resetPassword = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken, password }: IResetPasswordRequest = req.body

    if (!resetToken || !password) {
      return next(new ErrorHandler('Reset token and new password are required', 400))
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.RESET_PASSWORD_SECRET as string) as JwtPayload
    } catch (error) {
      if (error instanceof Error) {
        return next(new ErrorHandler('Invalid or expired reset token', 400))
      }
      return next(new ErrorHandler('Invalid or expired reset token', 400))
    }

    if (!decoded || !decoded.id) {
      return next(new ErrorHandler('Invalid reset token', 400))
    }

    const userId = decoded.id

    // Check if reset token exists in Redis
    const storedToken = await redis.get(`resetToken:${userId}`)
    if (!storedToken || storedToken !== resetToken) {
      return next(new ErrorHandler('Reset token is invalid or has expired', 400))
    }

    // Find user
    const user = await userModel.findById(userId)
    if (!user) {
      return next(new ErrorHandler('User not found', 404))
    }

    // Update password
    user.password = password
    await user.save()

    // Remove reset token from Redis
    await redis.del(`resetToken:${userId}`)

    // Update user in Redis cache
    await redis.set(userId, JSON.stringify(user))

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
    return next(new ErrorHandler('An error occurred', 400))
  }
})

// get all users --- only for admin
export const getAllUsers = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    getAllUsersService(res)
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// update user role --- only for admin
export const updateUserRole = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, role } = req.body
    const isUserExist = await userModel.findOne({ email })
    if (isUserExist) {
      const id = isUserExist._id
      updateUserRoleService(res, id, role)
    } else {
      res.status(400).json({
        success: false,
        message: 'User not found'
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// Delete user --- only for admin
export const deleteUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await userModel.findById(id)

    if (!user) {
      return next(new ErrorHandler('User not found', 404))
    }

    await user.deleteOne({ id })

    await redis.del(id)

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
