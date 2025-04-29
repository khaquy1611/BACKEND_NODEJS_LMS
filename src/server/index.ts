import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import webRoutes from '~/routes/web'
import ErrorMiddleWare from '~/middleware/error'
import { v2 as cloudinary } from 'cloudinary'

const createServer = () => {
  const app = express()

  // Body parser middleware
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use(express.json({ limit: '50mb' }))

  // Cookie parser middleware
  app.use(cookieParser())

  // CORS configuration
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, etc)
        if (!origin) return callback(null, true)

        // Define allowed origins
        const allowedOrigins = [process.env.CLIENT_URL]

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
          callback(null, true)
        } else {
          callback(new Error('CORS policy violation: Origin not allowed'))
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Disposition'],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    })
  )
  // Clodinary config
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY
  })
  // API routes
  app.use('/api/v1', webRoutes)

  // Handle 404 routes
  app.use((req, res) => {
    const err = new Error(`Route ${req.originalUrl} not found`)
    res.status(404).json({
      message: err.message,
      status: 'fail',
      data: null
    })
  })
  // Error handling middleware
  app.use(ErrorMiddleWare)
  return app
}
export default createServer
