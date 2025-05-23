/* eslint-disable @typescript-eslint/no-explicit-any */
import { IUser } from '~/models/user.model'

export interface IRegistrationBody {
  name: string
  email: string
  password: string
  avatar?: string
}

export interface IActivationToken {
  token: string
  activationCode: string
}

export interface EmailOptions {
  email: string
  subject: string
  template: string
  html?: string
  data: { [key: string]: any }
}

export interface IActivationRequest {
  activation_token: string
  activation_code: string
}

export interface DecodedToken {
  user: IUser
  activationCode: string
}

export interface ILoginRequest {
  email: string
  password: string
}

export interface ITokenOptions {
  expires: Date
  maxAge: number
  httpOnly: boolean
  sameSite: 'lax' | 'strict' | 'none' | undefined
  secure?: boolean
}

export interface ISocialAuthBody {
  email: string
  name: string
  avatar: string
}

export interface IUpdateUserInfo {
  name?: string
  email?: string
}

export interface IUpdatePassWord {
  oldPassWord: string
  newPassWord: string
}

export interface IForgotPasswordRequest {
  email: string
}

export interface IResetPasswordRequest {
  resetToken: string
  password: string
}

export interface AppError {
  message: string
}

export interface IAddQuestionData {
  question: string
  courseId: string
  contentId: string
}

export interface IAddAnswerData {
  answer: string
  courseId: string
  contentId: string
  questionId: string
}

export interface IAddReviewData {
  comment: string
  courseId: string
  reviewId: string
  review: string
  rating: number
  userId: string
}

export interface MonthData {
  month: string
  count: number
}
