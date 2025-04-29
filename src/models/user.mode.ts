import dotenv from 'dotenv'
dotenv.config()
import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// Regex pattern cho email
const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  password: string
  avatar: {
    public_id: string
    url: string
  }
  role: string
  isVerified: boolean
  course: Array<{ courseId: string }>
  comparePassword: (password: string) => Promise<boolean>
  SignAccessToken: () => string
  SignRefreshToken: () => string
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      trim: true,
      maxLength: [30, 'Name cannot exceed 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      match: [emailRegexPattern, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minLength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    avatar: {
      public_id: {
        type: String
      },
      url: {
        type: String
      },
      role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      course: [
        {
          courseId: {
            type: String
          }
        }
      ]
    }
  },
  { timestamps: true }
)
// Hash password before saving to database
userSchema.pre('save', async function (this: IUser, next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Sign access token
userSchema.methods.SignAccessToken = function (this: IUser): string {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET! || '', { expiresIn: '40s' })
}
// Sign refresh token
userSchema.methods.SignRefreshToken = function (this: IUser): string {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET! || '', { expiresIn: '40s' })
}
// compare password
userSchema.methods.comparePassword = async function (this: IUser, password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password)
}

const userModel: Model<IUser> = mongoose.model('User', userSchema)
export default userModel
