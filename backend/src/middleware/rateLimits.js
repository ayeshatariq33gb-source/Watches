const { rateLimit } = require('express-rate-limit')

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: { message: 'Too many sign-in attempts. Please try again later.' } } })
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false })

module.exports = { authLimiter, apiLimiter }