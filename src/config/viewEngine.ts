import path from 'path'
import { Application } from 'express'
import express from 'express'

const configViewEngine = (app: Application) => {
  app.set('views', path.join('./src', 'views'))
  app.set('view engine', 'ejs')

  app.use(express.static(path.join(__dirname, 'public'))) // static files
}

export default configViewEngine
