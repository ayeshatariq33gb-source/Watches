const express = require('express')
const controller = require('../controllers/userController')
const { protect } = require('../middleware/auth')
const databaseRequired = require('../middleware/databaseRequired')

const router = express.Router()
router.use(databaseRequired, protect)
router.get('/dashboard', controller.dashboard)
router.patch('/me', controller.updateProfile)
router.get('/orders', controller.orderHistory)

module.exports = router