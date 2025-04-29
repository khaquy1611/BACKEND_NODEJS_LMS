import { IUser } from '~/models/user.mode'

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
