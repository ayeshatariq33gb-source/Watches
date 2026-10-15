const path = require('node:path')
const dotenv = require('dotenv')

function loadEnv() {
  const result = dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  for (const [key, value] of Object.entries(result.parsed || {})) {
    if (!process.env[key]?.trim()) process.env[key] = value
  }
}

module.exports = loadEnv