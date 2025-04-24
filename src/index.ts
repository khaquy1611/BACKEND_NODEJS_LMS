import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import configViewEngine from './config/viewEngine'
import webRoutes from './routes/web'

const app = express()
const port = process.env.PORT || 3000
const hostName = process.env.HOST_NAME || 'localhost'
// config template engine
configViewEngine(app)
app.use('/api/v1', webRoutes)
app.listen(port, () => {
  console.log(`Example app listening on ${hostName}/${port}`)
})
