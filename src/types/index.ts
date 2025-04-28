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
