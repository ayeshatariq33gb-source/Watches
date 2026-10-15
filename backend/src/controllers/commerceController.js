const crypto = require('node:crypto')
const Cart = require('../models/Cart')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Wishlist = require('../models/Wishlist')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')
const { boundedNumber, objectId } = require('../utils/validation')

async function getOrCreateCart(userId) {
  return Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId, items: [] } }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true })
}

async function populateCart(cart) {
  const resolvedCart = await cart
  await resolvedCart.populate({ path: 'items.product', populate: { path: 'category', select: 'name slug' } })
  return resolvedCart
}

function cartPayload(cart) {
  const items = cart.items.filter((item) => item.product).map((item) => ({ product: require('../utils/serializers').serializeProduct(item.product), quantity: item.quantity }))
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  return { items, subtotal, itemCount: items.reduce((total, item) => total + item.quantity, 0) }
}

const getCart = asyncHandler(async (request, response) => {
  const cart = await populateCart(getOrCreateCart(request.user._id))
  response.json({ success: true, data: { cart: cartPayload(cart) } })
})

const addCartItem = asyncHandler(async (request, response) => {
  const productId = objectId(request.body.productId, 'product id')
  const quantity = boundedNumber(request.body.quantity ?? 1, 'quantity', { min: 1, max: 20 })
  if (!Number.isInteger(quantity)) throw new ApiError(400, 'quantity must be a whole number.')
  const product = await Product.findOne({ _id: productId, isActive: true }).select('stock')
  if (!product) throw new ApiError(404, 'Timepiece not found.')
  const cart = await getOrCreateCart(request.user._id)
  const item = cart.items.find((entry) => String(entry.product) === String(productId))
  const nextQuantity = (item?.quantity || 0) + quantity
  if (nextQuantity > 20) throw new ApiError(400, 'A maximum of 20 of each timepiece may be added.')
  if (nextQuantity > product.stock) throw new ApiError(409, 'There is not enough stock for that quantity.')
  if (item) item.quantity = nextQuantity
  else cart.items.push({ product: productId, quantity })
  await cart.save()
  await populateCart(cart)
  response.json({ success: true, data: { cart: cartPayload(cart) } })
})

const replaceCart = asyncHandler(async (request, response) => {
  if (!Array.isArray(request.body.items) || request.body.items.length > 50) throw new ApiError(400, 'items must be an array with no more than 50 entries.')
  const ids = request.body.items.map((item) => objectId(item.productId, 'product id'))
  if (new Set(ids.map(String)).size !== ids.length) throw new ApiError(400, 'Cart items must not contain duplicate products.')
  const items = []
  for (const [index, item] of request.body.items.entries()) {
    const quantity = boundedNumber(item.quantity, `items[${index}].quantity`, { min: 1, max: 20 })
    if (!Number.isInteger(quantity)) throw new ApiError(400, 'Cart quantities must be whole numbers.')
    const product = await Product.findOne({ _id: ids[index], isActive: true }).select('stock')
    if (!product || quantity > product.stock) throw new ApiError(409, 'A cart item is unavailable or has insufficient stock.')
    items.push({ product: product._id, quantity })
  }
  const cart = await Cart.findOneAndUpdate({ user: request.user._id }, { $set: { items } }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true })
  await populateCart(cart)
  response.json({ success: true, data: { cart: cartPayload(cart) } })
})

const updateCartItem = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const quantity = boundedNumber(request.body.quantity, 'quantity', { min: 0, max: 20 })
  if (!Number.isInteger(quantity)) throw new ApiError(400, 'quantity must be a whole number.')
  const cart = await getOrCreateCart(request.user._id)
  const item = cart.items.find((entry) => String(entry.product) === String(productId))
  if (!item) throw new ApiError(404, 'That timepiece is not in your cart.')
  if (quantity === 0) cart.items.pull({ product: productId })
  else {
    const product = await Product.findOne({ _id: productId, isActive: true }).select('stock')
    if (!product || quantity > product.stock) throw new ApiError(409, 'There is not enough stock for that quantity.')
    item.quantity = quantity
  }
  await cart.save()
  await populateCart(cart)
  response.json({ success: true, data: { cart: cartPayload(cart) } })
})

const removeCartItem = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const cart = await getOrCreateCart(request.user._id)
  cart.items.pull({ product: productId })
  await cart.save()
  await populateCart(cart)
  response.json({ success: true, data: { cart: cartPayload(cart) } })
})

const getWishlist = asyncHandler(async (request, response) => {
  const wishlist = await Wishlist.findOneAndUpdate({ user: request.user._id }, { $setOnInsert: { user: request.user._id, products: [] } }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }).populate({ path: 'products', populate: { path: 'category', select: 'name slug' } })
  const products = wishlist.products.filter(Boolean).map(require('../utils/serializers').serializeProduct)
  response.json({ success: true, data: { products } })
})

const addWishlistItem = asyncHandler(async (request, response) => {
  const productId = objectId(request.body.productId, 'product id')
  if (!(await Product.exists({ _id: productId, isActive: true }))) throw new ApiError(404, 'Timepiece not found.')
  const wishlist = await Wishlist.findOneAndUpdate({ user: request.user._id }, { $setOnInsert: { user: request.user._id }, $addToSet: { products: productId } }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }).populate({ path: 'products', populate: { path: 'category', select: 'name slug' } })
  response.json({ success: true, data: { products: wishlist.products.filter(Boolean).map(require('../utils/serializers').serializeProduct) } })
})

const replaceWishlist = asyncHandler(async (request, response) => {
  if (!Array.isArray(request.body.productIds) || request.body.productIds.length > 100) throw new ApiError(400, 'productIds must be an array with no more than 100 entries.')
  const ids = request.body.productIds.map((id) => objectId(id, 'product id'))
  if (new Set(ids.map(String)).size !== ids.length) throw new ApiError(400, 'Wishlist entries must not contain duplicates.')
  const count = await Product.countDocuments({ _id: { $in: ids }, isActive: true })
  if (count !== ids.length) throw new ApiError(400, 'A wishlist timepiece is unavailable.')
  const wishlist = await Wishlist.findOneAndUpdate({ user: request.user._id }, { $set: { products: ids } }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }).populate({ path: 'products', populate: { path: 'category', select: 'name slug' } })
  response.json({ success: true, data: { products: wishlist.products.filter(Boolean).map(require('../utils/serializers').serializeProduct) } })
})

const removeWishlistItem = asyncHandler(async (request, response) => {
  const productId = objectId(request.params.productId, 'product id')
  const wishlist = await Wishlist.findOneAndUpdate({ user: request.user._id }, { $pull: { products: productId } }, { returnDocument: 'after' }).populate({ path: 'products', populate: { path: 'category', select: 'name slug' } })
  response.json({ success: true, data: { products: wishlist?.products.filter(Boolean).map(require('../utils/serializers').serializeProduct) || [] } })
})

function passesLuhn(value) {
  let sum = 0
  let doubleDigit = false
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index])
    if (doubleDigit) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    doubleDigit = !doubleDigit
  }
  return sum % 10 === 0
}

function validateDemoCard(card) {
  if (!card || typeof card !== 'object') throw new ApiError(400, 'Card details are required for demo card payment.')
  const number = String(card.number || '').replace(/[\s-]/g, '')
  const cvc = String(card.cvc || '')
  const month = Number(card.expiryMonth)
  const yearInput = String(card.expiryYear || '')
  const year = yearInput.length === 2 ? 2000 + Number(yearInput) : Number(yearInput)
  if (!/^\d{13,19}$/.test(number) || !passesLuhn(number)) throw new ApiError(400, 'Enter a valid demo card number.')
  if (!/^\d{3,4}$/.test(cvc)) throw new ApiError(400, 'Enter a valid card security code.')
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) throw new ApiError(400, 'Enter a valid card expiration date.')
  const expiry = new Date(year, month, 1)
  if (expiry <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)) throw new ApiError(400, 'This demo card is expired.')
  if (card.cardholderName && String(card.cardholderName).trim().length > 100) throw new ApiError(400, 'Cardholder name is too long.')
  return { last4: number.slice(-4), brand: number.startsWith('4') ? 'Visa' : number.startsWith('5') ? 'Mastercard' : 'Card' }
}

function validShippingAddress(address) {
  return address && typeof address === 'object' && ['line1', 'city', 'postalCode', 'country'].every((field) => typeof address[field] === 'string' && address[field].trim())
}

const createOrder = asyncHandler(async (request, response) => {
  const { paymentMethod } = request.body
  if (!['demo_card', 'cash_on_delivery'].includes(paymentMethod)) throw new ApiError(400, 'paymentMethod must be demo_card or cash_on_delivery.')
  const shippingAddress = request.body.shippingAddress || request.user.address
  if (!validShippingAddress(shippingAddress)) throw new ApiError(400, 'Shipping address requires line1, city, postalCode, and country.')
  const cardDetails = paymentMethod === 'demo_card' ? validateDemoCard(request.body.card) : null
  const cart = await Cart.findOne({ user: request.user._id }).populate('items.product')
  if (!cart || !cart.items.length) throw new ApiError(400, 'Your cart is empty.')

  const reserved = []
  try {
    const orderItems = []
    for (const item of cart.items) {
      const quantity = item.quantity
      const product = item.product
      if (!product || !product.isActive) throw new ApiError(409, 'A timepiece in your cart is no longer available.')
      const updated = await Product.findOneAndUpdate({ _id: product._id, isActive: true, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { returnDocument: 'after' })
      if (!updated) throw new ApiError(409, `${product.name} no longer has enough stock.`)
      reserved.push({ id: product._id, quantity })
      orderItems.push({ product: product._id, name: product.name, slug: product.slug, image: product.image, unitPrice: product.price, quantity })
    }
    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const order = await Order.create({
      orderNumber: `AUR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      user: request.user._id,
      items: orderItems,
      subtotal,
      shippingAddress: Object.fromEntries(['line1', 'line2', 'city', 'region', 'postalCode', 'country'].filter((key) => shippingAddress[key] !== undefined).map((key) => [key, String(shippingAddress[key]).trim()])),
      paymentMethod,
      paymentStatus: 'pending',
      approvalStatus: 'pending',
      orderStatus: 'pending_approval',
      paymentReference: crypto.randomUUID(),
      cardBrand: cardDetails?.brand || '',
      cardLast4: cardDetails?.last4 || '',
    })
    cart.items = []
    await cart.save()
    response.status(201).json({ success: true, data: { order, message: 'Order submitted for review. Payment details are never stored.' } })
  } catch (error) {
    await Promise.all(reserved.map(({ id, quantity }) => Product.updateOne({ _id: id }, { $inc: { stock: quantity } })))
    throw error
  }
})

const getOrder = asyncHandler(async (request, response) => {
  const orderId = objectId(request.params.orderId, 'order id')
  const order = await Order.findOne({ _id: orderId, user: request.user._id }).lean()
  if (!order) throw new ApiError(404, 'Order not found.')
  response.json({ success: true, data: { order } })
})

const cancelOrder = asyncHandler(async (request, response) => {
  const orderId = objectId(request.params.orderId, 'order id')
  const order = await Order.findOne({ _id: orderId, user: request.user._id })
  if (!order) throw new ApiError(404, 'Order not found.')
  if (order.approvalStatus !== 'pending') throw new ApiError(409, 'Only orders awaiting approval can be cancelled.')
  order.approvalStatus = 'rejected'
  order.orderStatus = 'cancelled'
  order.adminNote = 'Cancelled by customer.'
  if (order.paymentMethod === 'demo_card') order.paymentStatus = 'rejected'
  await Promise.all(order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })))
  await order.save()
  response.json({ success: true, data: { order } })
})

module.exports = { getCart, addCartItem, replaceCart, updateCartItem, removeCartItem, getWishlist, addWishlistItem, replaceWishlist, removeWishlistItem, createOrder, getOrder, cancelOrder }