import { Request, Response } from 'express'

const getHomePage = (req: Request, res: Response) => {
  res.send('Hello Word!!')
}

const getABC = (req: Request, res: Response) => {
  res.send('Check ABC!')
}

const getSample = (req: Request, res: Response) => {
  res.render('sample', { title: 'Sample Page' })
}

export { getHomePage, getABC, getSample }
