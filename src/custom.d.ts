import { IUser } from './models/user.mode'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}
