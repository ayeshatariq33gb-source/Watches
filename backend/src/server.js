require('./config/loadEnv')()
const app = require('./app')
const mongoose = require('mongoose')
const { connectDatabase } = require('./config/db')

function startServer() {
  const port = Number(process.env.PORT || 5000)
  const server = app.listen(port, () => {
    console.log(`Maison Aurel API listening on http://localhost:${port}/api/v1`)
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is missing. Health and validation routes are available; database routes will return 503.')
      return
    }
    connectDatabase().then(() => console.log('MongoDB connected.')).catch((error) => {
      console.error(`MongoDB connection failed: ${error.message}`)
    })
  })

  const shutdown = async () => {
    server.close()
    await mongoose.disconnect()
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
  return server
}

if (require.main === module) startServer()

module.exports = { startServer }