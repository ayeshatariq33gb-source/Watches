const Category = require('../models/Category')
const Product = require('../models/Product')
const Review = require('../models/Review')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')
const { boundedNumber, objectId } = require('../utils/validation')
const { serializeProduct } = require('../utils/serializers')

const listProducts = asyncHandler(async (request, response) => {
  const page = boundedNumber(request.query.page || 1, 'page', { min: 1, max: 100000 })
  const limit = boundedNumber(request.query.limit || 24, 'limit', { min: 1, max: 100 })
  const filter = { isActive: true }
  if (request.query.category) {
    const normalizedCategory = String(request.query.category).toLowerCase().replace(/\s+/g, '-')
    if (normalizedCategory === 'men' || normalizedCategory === 'women') {
      const category = await Category.findOne({ slug: normalizedCategory, isActive: true }).select('_id')
      if (!category) return response.json({ success: true, data: { products: [], pagination: { page, limit, total: 0, pages: 0 } } })
      filter.category = category._id
    } else if (normalizedCategory === 'limited' || normalizedCategory === 'limited-edition' || normalizedCategory === 'limited-editions') {
      const category = await Category.findOne({ slug: 'limited-editions', isActive: true }).select('_id')
      if (!category) return response.json({ success: true, data: { products: [], pagination: { page, limit, total: 0, pages: 0 } } })
      filter.category = category._id
    } else if (normalizedCategory === 'automatic') filter.type = /^automatic$/i
    else if (normalizedCategory === 'chronograph' || normalizedCategory === 'chronographs') filter.type = /^chronograph$/i
    else {
      const category = await Category.findOne({ slug: normalizedCategory, isActive: true }).select('_id')
      if (!category) return response.json({ success: true, data: { products: [], pagination: { page, limit, total: 0, pages: 0 } } })
      filter.category = category._id
    }
  }
  if (request.query.type) filter.type = new RegExp(`^${String(request.query.type).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  if (request.query.q) filter.$text = { $search: String(request.query.q).slice(0, 100) }
  if (request.query.minPrice !== undefined || request.query.maxPrice !== undefined) {
    filter.price = {}
    if (request.query.minPrice !== undefined) filter.price.$gte = boundedNumber(request.query.minPrice, 'minPrice')
    if (request.query.maxPrice !== undefined) filter.price.$lte = boundedNumber(request.query.maxPrice, 'maxPrice')
    if (filter.price.$gte !== undefined && filter.price.$lte !== undefined && filter.price.$gte > filter.price.$lte) throw new ApiError(400, 'minPrice cannot exceed maxPrice.')
  }
  const sortMap = { featured: { createdAt: -1 }, newest: { createdAt: -1 }, 'price-low': { price: 1 }, 'price-high': { price: -1 }, rating: { rating: -1 } }
  const sort = sortMap[request.query.sort || 'featured']
  if (!sort) throw new ApiError(400, 'Unsupported sort option.')
  const [records, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ])
  response.json({ success: true, data: { products: records.map(serializeProduct), pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
})

const getProduct = asyncHandler(async (request, response) => {
  const product = await Product.findOne({ slug: request.params.slug, isActive: true }).populate('category', 'name slug').lean()
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  response.json({ success: true, data: { product: serializeProduct(product) } })
})

const listCategories = asyncHandler(async (request, response) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean()
  response.json({ success: true, data: { categories } })
})

const listReviews = asyncHandler(async (request, response) => {
  const product = await Product.findOne({ slug: request.params.slug, isActive: true }).select('_id')
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  const reviews = await Review.find({ product: product._id, isApproved: true }).populate('user', 'name').sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: { reviews } })
})

const createReview = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const { rating, title, body } = request.body
  const numericRating = boundedNumber(rating, 'rating', { min: 1, max: 5 })
  if (!Number.isInteger(numericRating)) throw new ApiError(400, 'rating must be a whole number from 1 to 5.')
  if (typeof body !== 'string' || body.trim().length < 10 || body.trim().length > 2000) throw new ApiError(400, 'Review text must be between 10 and 2000 characters.')
  const product = await Product.findOne({ _id: productId, isActive: true })
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  const review = await Review.create({ product: product._id, user: request.user._id, rating: numericRating, title: String(title || '').trim(), body: body.trim() })
  response.status(201).json({ success: true, data: { review, message: 'Your review is awaiting moderation.' } })
})

module.exports = { listProducts, getProduct, listCategories, listReviews, createReview }