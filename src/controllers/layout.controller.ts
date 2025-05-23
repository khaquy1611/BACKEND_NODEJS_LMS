import { Request, Response, NextFunction } from 'express'
import ErrorHandler from '~/errors/ErrorHandler'
import LayoutModel from '~/models/layout.model'
import cloudinary from 'cloudinary'
import catchAsyncErrors from '~/middleware/catchAsyncErrors'

// create layout
export const createLayout = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body
    const isTypeExist = await LayoutModel.findOne({ type })
    if (isTypeExist) {
      return next(new ErrorHandler(`${type} already exist`, 400))
    }
    if (type === 'Banner') {
      const { image, title, subTitle } = req.body
      const myCloud = await cloudinary.v2.uploader.upload(image, {
        folder: 'layout'
      })
      const banner = {
        type: 'Banner',
        banner: {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
          },
          title,
          subTitle
        }
      }
      await LayoutModel.create(banner)
    }
    if (type === 'FAQ') {
      const { faq } = req.body
      const faqItems = await Promise.all(
        faq.map(async (item: any) => {
          return {
            question: item.question,
            answer: item.answer
          }
        })
      )
      await LayoutModel.create({ type: 'FAQ', faq: faqItems })
    }
    if (type === 'Categories') {
      const { categories } = req.body
      const categoriesItems = await Promise.all(
        categories.map(async (item: any) => {
          return {
            title: item.title
          }
        })
      )
      await LayoutModel.create({
        type: 'Categories',
        categories: categoriesItems
      })
    }

    res.status(200).json({
      success: true,
      message: 'Layout created successfully'
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// Edit layout
export const editLayout = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body
    if (type === 'Banner') {
      const bannerData: any = await LayoutModel.findOne({ type: 'Banner' })

      const { image, title, subTitle } = req.body

      const data = image.startsWith('https')
        ? bannerData
        : await cloudinary.v2.uploader.upload(image, {
            folder: 'layout'
          })

      const banner = {
        type: 'Banner',
        image: {
          public_id: image.startsWith('https') ? bannerData.banner.image.public_id : data?.public_id,
          url: image.startsWith('https') ? bannerData.banner.image.url : data?.secure_url
        },
        title,
        subTitle
      }

      await LayoutModel.findByIdAndUpdate(bannerData._id, { banner })
    }

    if (type === 'FAQ') {
      const { faq } = req.body
      const FaqItem = await LayoutModel.findOne({ type: 'FAQ' })
      const faqItems = await Promise.all(
        faq.map(async (item: any) => {
          return {
            question: item.question,
            answer: item.answer
          }
        })
      )
      await LayoutModel.findByIdAndUpdate(FaqItem?._id, {
        type: 'FAQ',
        faq: faqItems
      })
    }
    if (type === 'Categories') {
      const { categories } = req.body
      const categoriesData = await LayoutModel.findOne({
        type: 'Categories'
      })
      const categoriesItems = await Promise.all(
        categories.map(async (item: any) => {
          return {
            title: item.title
          }
        })
      )
      await LayoutModel.findByIdAndUpdate(categoriesData?._id, {
        type: 'Categories',
        categories: categoriesItems
      })
    }

    res.status(200).json({
      success: true,
      message: 'Layout Updated successfully'
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// get layout by type
export const getLayoutByType = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params
    const layout = await LayoutModel.findOne({ type })
    res.status(201).json({
      success: true,
      layout
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})

// delete layout
export const deleteLayout = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params

    const layoutExists = await LayoutModel.findOne({ type })

    if (!layoutExists) {
      return next(new ErrorHandler(`${type} layout not found`, 404))
    }

    // If it's a Banner layout, delete the image from cloudinary first
    if (type === 'Banner' && layoutExists.banner && layoutExists.banner.image) {
      await cloudinary.v2.uploader.destroy(layoutExists.banner.image.public_id)
    }

    // Delete the layout from the database
    await LayoutModel.findOneAndDelete({ type })

    res.status(200).json({
      success: true,
      message: `${type} layout deleted successfully`
    })
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
})
