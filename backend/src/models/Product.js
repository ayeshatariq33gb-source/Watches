const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  brand: { type: String, required: true, trim: true, maxlength: 80 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  type: { type: String, required: true, trim: true, maxlength: 60, index: true },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },
  image: { type: String, required: true, trim: true },
  gallery: [{ type: String, trim: true }],
  colors: [{ type: String, trim: true }],
  badge: { type: String, trim: true, default: '' },
  movement: { type: String, trim: true, default: '' },
  case: { type: String, trim: true, default: '' },
  dial: { type: String, trim: true, default: '' },
  water: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  stock: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

productSchema.index({ name: 'text', brand: 'text', description: 'text' })

module.exports = mongoose.model('Product', productSchema)