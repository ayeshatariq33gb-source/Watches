const express = require('express')
const controller = require('../controllers/catalogController')
const { protect } = require('../middleware/auth')
const databaseRequired = require('../middleware/databaseRequired')

const products = express.Router()
products.use(databaseRequired)
products.get('/', controller.listProducts)
products.get('/:slug/reviews', controller.listReviews)
products.post('/:productId/reviews', protect, controller.createReview)
products.get('/:slug', controller.getProduct)

const categories = express.Router()
categories.use(databaseRequired)
categories.get('/', controller.listCategories)

module.exports = { products, categories }