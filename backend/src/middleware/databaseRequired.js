const mongoose = require('mongoose')
const ApiError = require('../utils/ApiError')

module.exports = (request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    return next(new ApiError(503, 'Database is unavailable. Configure MONGODB_URI and start MongoDB.'))
  }
  next()
}