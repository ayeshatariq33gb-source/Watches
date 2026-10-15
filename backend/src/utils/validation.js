const mongoose = require('mongoose')
const ApiError = require('./ApiError')

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '')
  if (missing.length) throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`)
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function objectId(value, field = 'id') {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, `Invalid ${field}`)
  return value
}

function boundedNumber(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) throw new ApiError(400, `${field} must be between ${min} and ${max}`)
  return number
}

module.exports = { requireFields, validEmail, objectId, boundedNumber }