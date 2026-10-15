const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 20 },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true, validate: (items) => items.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', enum: ['USD'] },
  shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
  orderStatus: { type: String, enum: ['pending_approval', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending_approval' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  paymentMethod: { type: String, enum: ['demo_card', 'cash_on_delivery'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  paymentReference: { type: String, default: '' },
  cardBrand: { type: String, default: '' },
  cardLast4: { type: String, default: '' },
  adminNote: { type: String, maxlength: 500, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)