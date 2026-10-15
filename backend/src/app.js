require('./config/loadEnv')()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const commerceRoutes = require('./routes/commerceRoutes')
const adminRoutes = require('./routes/adminRoutes')
const { products, categories } = require('./routes/catalogRoutes')
const { apiLimiter } = require('./middleware/rateLimits')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const app = express()
const allowedOrigins = new Set((process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean))

app.disable('x-powered-by')
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true)
  return callback(new Error('This origin is not allowed by CORS.'))
}, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '20kb', strict: true }))
app.use(apiLimiter)

app.get('/api/v1/health', (request, response) => {
  const connected = mongoose.connection.readyState === 1
  response.status(connected ? 200 : 503).json({ success: connected, data: { service: 'maison-aurel-api', database: connected ? 'connected' : 'unavailable', configuration: { mongoUriSet: Boolean(process.env.MONGODB_URI), jwtSecretSet: Boolean(process.env.JWT_SECRET) } } })
})
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/products', products)
app.use('/api/v1/categories', categories)
app.use('/api/v1', commerceRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use(notFound)
app.use(errorHandler)

module.exports = app