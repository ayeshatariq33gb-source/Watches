const Cart = require('../models/Cart')
const Order = require('../models/Order')
const Wishlist = require('../models/Wishlist')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')
const { publicUser } = require('./authController')

const dashboard = asyncHandler(async (request, response) => {
  const [orders, cart, wishlist] = await Promise.all([
    Order.find({ user: request.user._id }).sort({ createdAt: -1 }).limit(5).lean(),
    Cart.findOne({ user: request.user._id }).lean(),
    Wishlist.findOne({ user: request.user._id }).lean(),
  ])
  response.json({ success: true, data: { user: publicUser(request.user), recentOrders: orders, cartItemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0, wishlistCount: wishlist?.products.length || 0 } })
})

const updateProfile = asyncHandler(async (request, response) => {
  const allowed = ['name', 'phone', 'address']
  const updates = Object.fromEntries(Object.entries(request.body).filter(([key]) => allowed.includes(key)))
  if (!Object.keys(updates).length) throw new ApiError(400, 'Provide at least one profile field to update.')
  if (updates.name !== undefined && (String(updates.name).trim().length < 2 || String(updates.name).trim().length > 80)) throw new ApiError(400, 'Name must be between 2 and 80 characters.')
  if (updates.address !== undefined) {
    if (!updates.address || typeof updates.address !== 'object' || Array.isArray(updates.address)) throw new ApiError(400, 'Address must be an object.')
    const addressFields = ['line1', 'line2', 'city', 'region', 'postalCode', 'country']
    updates.address = Object.fromEntries(Object.entries(updates.address).filter(([key]) => addressFields.includes(key)))
  }
  Object.assign(request.user, updates)
  await request.user.save()
  response.json({ success: true, data: { user: publicUser(request.user) } })
})

const orderHistory = asyncHandler(async (request, response) => {
  const orders = await Order.find({ user: request.user._id }).sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: { orders } })
})

module.exports = { dashboard, updateProfile, orderHistory }