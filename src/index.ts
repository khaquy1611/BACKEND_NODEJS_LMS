import createServer from './server'
import dotenv from 'dotenv'
dotenv.config()
import connectDB from './config/database'

const app = createServer()
const port = process.env.PORT || 3000
const hostName = process.env.HOST_NAME || 'localhost'

app.listen(port, () => {
  console.log(`Example app listening on ${hostName}:${port}`)
  connectDB()
})
