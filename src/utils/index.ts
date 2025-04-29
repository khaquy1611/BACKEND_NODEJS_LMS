import { Response } from 'express'
import nodemailer, { Transporter } from 'nodemailer'
import ejs from 'ejs'
import path from 'path'
import { EmailOptions } from '~/types'
import { IUser } from '~/models/user.mode'
import dotenv from 'dotenv'
import { redis } from '~/config/redis'
import { accessTokenOptions, refreshTokenOptions } from '~/config'
dotenv.config()

export const sendEmail = async (options: EmailOptions) => {
  const transpoter: Transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD
    }
  })

  const { email, subject, template, data } = options

  // get the path to the email template file
  const templatePath = path.join(__dirname, '../mails', template)

  // Render the email template with EJS
  const html = await ejs.renderFile(templatePath, data)

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: subject,
    html: html
  }
  await transpoter.sendMail(mailOptions, (error: Error | null, info: nodemailer.SentMessageInfo) => {
    if (error) {
      console.error('Error sending email:', error)
    } else {
      console.log('Email sent:', info.response)
    }
  })
}

export const sendToken = async (user: IUser, statusCode: number, res: Response, message: string) => {
  const accessToken = user.SignAccessToken()
  const refreshToken = user.SignRefreshToken()

  redis.set(user._id.toString(), JSON.stringify(user))

  if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true
    refreshTokenOptions.secure = true
  }
  res.cookie('access_token', accessToken, accessTokenOptions)
  res.cookie('refresh_token', refreshToken, refreshTokenOptions)

  res.status(statusCode).json({
    success: true,
    message: message,
    user,
    accessToken
  })
}
