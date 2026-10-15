const Order = require('../models/Order')
const asyncHandler = require('../utils/asyncHandler')

const listMine = asyncHandler(async (request, response) => {
  const orders = await Order.find({ user: request.user._id }).sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: { orders } })
})

module.exports = { listMine }