const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Session = require('../models/Session')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')

const protect = asyncHandler(async (request, response, next) => {
  const header = request.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new ApiError(401, 'Sign in to continue.')
  if (!process.env.JWT_SECRET) throw new ApiError(503, 'JWT_SECRET is not configured.')

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired.')
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const session = await Session.findOne({ tokenHash, user: payload.sub, expiresAt: { $gt: new Date() } })
  if (!session) throw new ApiError(401, 'Your session is no longer active.')
  const user = await User.findById(payload.sub)
  if (!user || !user.isActive) throw new ApiError(401, 'This account is unavailable.')
  request.user = user
  request.session = session
  next()
})

function allowRoles(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) return next(new ApiError(403, 'You do not have permission to access this resource.'))
    next()
  }
}

module.exports = { protect, allowRoles }