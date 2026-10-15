const ApiError = require('../utils/ApiError')

function notFound(request, response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`))
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)
  let status = error.statusCode || error.status || 500
  let message = error.message || 'An unexpected server error occurred.'
  let details = error.details

  if (error.name === 'ValidationError') {
    status = 400
    message = 'Request validation failed.'
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
  } else if (error.code === 11000) {
    status = 409
    message = 'A record with that value already exists.'
    details = Object.keys(error.keyPattern || {})
  } else if (error.name === 'CastError') {
    status = 400
    message = `Invalid ${error.path}.`
  }

  if (status >= 500) console.error(error)
  response.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } })
}

module.exports = { notFound, errorHandler }