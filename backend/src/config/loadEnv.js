const path = require('node:path')
const dotenv = require('dotenv')

function loadEnv() {
  // Render par .env file nahi hoti, isliye try/catch ya check lagana zaroori hai
  const result = dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  
  if (result.parsed) {
    for (const [key, value] of Object.entries(result.parsed)) {
      if (!process.env[key]?.trim()) process.env[key] = value
    }
  }
}

module.exports = loadEnv