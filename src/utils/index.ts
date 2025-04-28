import dotenv from 'dotenv'
dotenv.config()
import nodemailer, { Transporter } from 'nodemailer'
import ejs from 'ejs'
import path from 'path'
import { EmailOptions } from '~/types'

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
