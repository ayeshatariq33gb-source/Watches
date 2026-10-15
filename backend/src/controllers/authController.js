const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Session = require('../models/Session')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')
const { requireFields, validEmail } = require('../utils/validation')

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, createdAt: user.createdAt }
}

async function createSession(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new ApiError(503, 'JWT_SECRET must be configured with at least 32 characters.')
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn, issuer: 'maison-aurel-api', audience: 'maison-aurel-client' })
  const payload = jwt.decode(token)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  await Session.create({ user: user._id, tokenHash, expiresAt: new Date(payload.exp * 1000) })
  return token
}

const register = asyncHandler(async (request, response) => {
  const { name, email, password } = request.body
  requireFields(request.body, ['name', 'email', 'password'])
  if (String(name).trim().length < 2 || String(name).trim().length > 80) throw new ApiError(400, 'Name must be between 2 and 80 characters.')
  if (!validEmail(email)) throw new ApiError(400, 'Enter a valid email address.')
  if (String(password).length < 8 || String(password).length > 128) throw new ApiError(400, 'Password must be between 8 and 128 characters.')
  const user = await User.create({ name, email, password })
  const token = await createSession(user)
  response.status(201).json({ success: true, data: { user: publicUser(user), token } })
})

const login = asyncHandler(async (request, response) => {
  const { email, password } = request.body
  requireFields(request.body, ['email', 'password'])
  if (!validEmail(email)) throw new ApiError(400, 'Enter a valid email address.')
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password')
  if (!user || !user.isActive || !(await user.comparePassword(String(password)))) throw new ApiError(401, 'Email or password is incorrect.')
  const token = await createSession(user)
  response.json({ success: true, data: { user: publicUser(user), token } })
})

const logout = asyncHandler(async (request, response) => {
  await Session.deleteOne({ _id: request.session._id })
  response.json({ success: true, data: { message: 'Signed out successfully.' } })
})

const me = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { user: publicUser(request.user) } })
})

module.exports = { register, login, logout, me, publicUser }