const Category = require('../models/Category')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Review = require('../models/Review')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')
const { boundedNumber, objectId, requireFields } = require('../utils/validation')

const dashboard = asyncHandler(async (request, response) => {
  const [customers, products, orders, pendingPayments, lowStock, revenue] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.countDocuments({ paymentMethod: 'demo_card', paymentStatus: 'pending' }),
    Product.countDocuments({ isActive: true, stock: { $lte: 3 } }),
    Order.aggregate([{ $match: { paymentMethod: 'demo_card', paymentStatus: 'approved' } }, { $group: { _id: null, total: { $sum: '$subtotal' } } }]),
  ])
  response.json({ success: true, data: { customers, products, orders, pendingPayments, lowStock, approvedCardRevenue: revenue[0]?.total || 0 } })
})

const listCustomers = asyncHandler(async (request, response) => {
  const page = boundedNumber(request.query.page || 1, 'page', { min: 1, max: 100000 })
  const limit = boundedNumber(request.query.limit || 25, 'limit', { min: 1, max: 100 })
  const filter = { role: 'user' }
  if (request.query.q) {
    const term = String(request.query.q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [{ name: new RegExp(term, 'i') }, { email: new RegExp(term, 'i') }]
  }
  const [customers, total] = await Promise.all([User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(filter)])
  response.json({ success: true, data: { customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
})

const listProducts = asyncHandler(async (request, response) => {
  const filter = {}
  if (request.query.status === 'active') filter.isActive = true
  if (request.query.status === 'archived') filter.isActive = false
  const products = await Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).limit(250).lean()
  response.json({ success: true, data: { products } })
})

const updateCustomer = asyncHandler(async (request, response) => {
  const customerId = objectId(request.params.customerId, 'customer id')
  if (typeof request.body.isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false.')
  const customer = await User.findOneAndUpdate({ _id: customerId, role: 'user' }, { isActive: request.body.isActive }, { returnDocument: 'after' }).select('-password')
  if (!customer) throw new ApiError(404, 'Customer not found.')
  if (!customer.isActive) {
    const Session = require('../models/Session')
    await Session.deleteMany({ user: customer._id })
  }
  response.json({ success: true, data: { customer } })
})

function productInput(body, categoryId) {
  const fields = ['slug', 'brand', 'name', 'type', 'price', 'image']
  requireFields(body, fields)
  const result = { ...body, category: categoryId }
  delete result.categorySlug
  if (body.price !== undefined) result.price = boundedNumber(body.price, 'price', { min: 0, max: 10000000 })
  if (body.stock !== undefined) result.stock = boundedNumber(body.stock, 'stock', { min: 0, max: 1000000 })
  if (body.rating !== undefined) result.rating = boundedNumber(body.rating, 'rating', { min: 0, max: 5 })
  return result
}

async function resolveCategory(body) {
  const category = body.categorySlug
    ? await Category.findOne({ slug: String(body.categorySlug).toLowerCase(), isActive: true }).select('_id')
    : body.category && await Category.findOne({ _id: body.category, isActive: true }).select('_id')
  if (!category) throw new ApiError(400, 'Choose an existing category using categorySlug or category id.')
  return category._id
}

const createProduct = asyncHandler(async (request, response) => {
  const categoryId = await resolveCategory(request.body)
  const product = await Product.create(productInput(request.body, categoryId))
  await product.populate('category', 'name slug')
  response.status(201).json({ success: true, data: { product } })
})

const updateProduct = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const updates = { ...request.body }
  if (updates.categorySlug || updates.category) updates.category = await resolveCategory(updates)
  delete updates.categorySlug
  delete updates._id
  delete updates.createdAt
  delete updates.updatedAt
  delete updates.rating
  delete updates.reviewCount
  if (updates.price !== undefined) updates.price = boundedNumber(updates.price, 'price', { min: 0, max: 10000000 })
  if (updates.stock !== undefined) updates.stock = boundedNumber(updates.stock, 'stock', { min: 0, max: 1000000 })
  const product = await Product.findByIdAndUpdate(productId, updates, { returnDocument: 'after', runValidators: true }).populate('category', 'name slug')
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  response.json({ success: true, data: { product } })
})

const archiveProduct = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const product = await Product.findByIdAndUpdate(productId, { isActive: false }, { returnDocument: 'after' })
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  response.json({ success: true, data: { product, message: 'Timepiece archived.' } })
})

const updateInventory = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const stock = boundedNumber(request.body.stock, 'stock', { min: 0, max: 1000000 })
  if (!Number.isInteger(stock)) throw new ApiError(400, 'stock must be a whole number.')
  const product = await Product.findByIdAndUpdate(productId, { stock }, { returnDocument: 'after' }).select('name slug stock isActive')
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  response.json({ success: true, data: { product } })
})

const listCategories = asyncHandler(async (request, response) => {
  const categories = await Category.find().sort({ name: 1 }).lean()
  response.json({ success: true, data: { categories } })
})

const createCategory = asyncHandler(async (request, response) => {
  requireFields(request.body, ['name', 'slug'])
  const category = await Category.create({ name: request.body.name, slug: request.body.slug, description: request.body.description || '', image: request.body.image || '' })
  response.status(201).json({ success: true, data: { category } })
})

const updateCategory = asyncHandler(async (request, response) => {
  const categoryId = objectId(request.params.categoryId, 'category id')
  const updates = Object.fromEntries(Object.entries(request.body).filter(([key]) => ['name', 'slug', 'description', 'image', 'isActive'].includes(key)))
  const category = await Category.findByIdAndUpdate(categoryId, updates, { returnDocument: 'after', runValidators: true })
  if (!category) throw new ApiError(404, 'Category not found.')
  response.json({ success: true, data: { category } })
})

const listOrders = asyncHandler(async (request, response) => {
  const filter = {}
  if (request.query.status) filter.orderStatus = request.query.status
  if (request.query.paymentStatus) filter.paymentStatus = request.query.paymentStatus
  if (request.query.approvalStatus) filter.approvalStatus = request.query.approvalStatus
  const page = boundedNumber(request.query.page || 1, 'page', { min: 1, max: 100000 })
  const limit = boundedNumber(request.query.limit || 25, 'limit', { min: 1, max: 100 })
  const [orders, total] = await Promise.all([Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Order.countDocuments(filter)])
  response.json({ success: true, data: { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } })
})

async function restoreOrderStock(order) {
  await Promise.all(order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })))
}

const decideOrder = asyncHandler(async (request, response) => {
  const orderId = objectId(request.params.orderId, 'order id')
  const decision = request.body.decision
  if (!['approve', 'reject'].includes(decision)) throw new ApiError(400, 'decision must be approve or reject.')
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(404, 'Order not found.')
  if (order.approvalStatus !== 'pending') throw new ApiError(409, 'This order has already been reviewed.')
  order.approvalStatus = decision === 'approve' ? 'approved' : 'rejected'
  order.orderStatus = decision === 'approve' ? 'confirmed' : 'cancelled'
  order.adminNote = String(request.body.note || '').trim().slice(0, 500)
  if (order.paymentMethod === 'demo_card') order.paymentStatus = decision === 'approve' ? 'approved' : 'rejected'
  if (decision === 'reject') await restoreOrderStock(order)
  await order.save()
  response.json({ success: true, data: { order } })
})

const decidePayment = asyncHandler(async (request, response) => {
  const orderId = objectId(request.params.orderId, 'order id')
  const decision = request.body.decision
  if (!['approve', 'reject'].includes(decision)) throw new ApiError(400, 'decision must be approve or reject.')
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(404, 'Payment not found.')
  if (order.paymentMethod !== 'demo_card' || order.paymentStatus !== 'pending') throw new ApiError(409, 'Only pending demo-card payments can be reviewed here.')
  order.paymentStatus = decision === 'approve' ? 'approved' : 'rejected'
  order.approvalStatus = decision === 'approve' ? 'approved' : 'rejected'
  order.orderStatus = decision === 'approve' ? 'confirmed' : 'cancelled'
  order.adminNote = String(request.body.note || '').trim().slice(0, 500)
  if (decision === 'reject') await restoreOrderStock(order)
  await order.save()
  response.json({ success: true, data: { order } })
})

const updateOrderStatus = asyncHandler(async (request, response) => {
  const orderId = objectId(request.params.orderId, 'order id')
  const allowed = ['processing', 'shipped', 'delivered']
  if (!allowed.includes(request.body.orderStatus)) throw new ApiError(400, `orderStatus must be one of: ${allowed.join(', ')}.`)
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(404, 'Order not found.')
  if (order.approvalStatus !== 'approved') throw new ApiError(409, 'Approve the order before updating fulfillment.')
  const transitions = { confirmed: ['processing'], processing: ['shipped'], shipped: ['delivered'] }
  if (!transitions[order.orderStatus]?.includes(request.body.orderStatus)) throw new ApiError(409, 'That order status transition is not allowed.')
  order.orderStatus = request.body.orderStatus
  if (order.paymentMethod === 'cash_on_delivery' && order.orderStatus === 'delivered') order.paymentStatus = 'approved'
  await order.save()
  response.json({ success: true, data: { order } })
})

const listPayments = asyncHandler(async (request, response) => {
  const filter = { paymentMethod: 'demo_card' }
  if (request.query.status) filter.paymentStatus = request.query.status
  const payments = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(100).lean()
  response.json({ success: true, data: { payments: payments.map((order) => ({ orderId: order._id, orderNumber: order.orderNumber, user: order.user, amount: order.subtotal, status: order.paymentStatus, reference: order.paymentReference, cardBrand: order.cardBrand, cardLast4: order.cardLast4, createdAt: order.createdAt })) } })
})

const moderateReview = asyncHandler(async (request, response) => {
  const reviewId = objectId(request.params.reviewId, 'review id')
  if (typeof request.body.approved !== 'boolean') throw new ApiError(400, 'approved must be true or false.')
  const review = await Review.findByIdAndUpdate(reviewId, { isApproved: request.body.approved }, { returnDocument: 'after' }).populate('user', 'name')
  if (!review) throw new ApiError(404, 'Review not found.')
  const [summary] = await Review.aggregate([{ $match: { product: review.product, isApproved: true } }, { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } }])
  await Product.updateOne({ _id: review.product }, { rating: summary?.average || 0, reviewCount: summary?.count || 0 })
  response.json({ success: true, data: { review, rating: summary?.average || 0, reviewCount: summary?.count || 0 } })
})

const listReviews = asyncHandler(async (request, response) => {
  const filter = {}
  if (request.query.status === 'pending') filter.isApproved = false
  if (request.query.status === 'approved') filter.isApproved = true
  const reviews = await Review.find(filter).populate('user', 'name email').populate('product', 'name slug').sort({ createdAt: -1 }).limit(100).lean()
  response.json({ success: true, data: { reviews } })
})

module.exports = { dashboard, listCustomers, listProducts, updateCustomer, createProduct, updateProduct, archiveProduct, updateInventory, listCategories, createCategory, updateCategory, listOrders, decideOrder, decidePayment, updateOrderStatus, listPayments, moderateReview, listReviews }