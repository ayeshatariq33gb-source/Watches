const express = require('express')
const controller = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const databaseRequired = require('../middleware/databaseRequired')
const { authLimiter } = require('../middleware/rateLimits')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()
router.post('/register', authLimiter, databaseRequired, asyncHandler(controller.register))
router.post('/login', authLimiter, databaseRequired, asyncHandler(controller.login))
router.get('/me', databaseRequired, protect, asyncHandler(controller.me))
router.post('/logout', databaseRequired, protect, asyncHandler(controller.logout))

module.exports = router