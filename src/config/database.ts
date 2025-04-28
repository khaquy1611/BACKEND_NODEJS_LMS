import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()
const dbUrl = process.env.DB_MONGO_URL || ''

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl).then((data) => {
      console.log(`Database connected with: ${data.connection.host}`)
    })
  } catch (error: unknown) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : error)
    setTimeout(connectDB, 5000) // Retry connection after 5 seconds
    process.exit(1) // Exit the process with failure
  }
}

export default connectDB
