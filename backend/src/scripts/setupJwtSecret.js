const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')

const envPath = path.resolve(__dirname, '../../.env')
if (!fs.existsSync(envPath)) throw new Error('backend/.env is missing. Copy .env.example, then add your MongoDB connection string first.')

const existingText = fs.readFileSync(envPath, 'utf8')
const existing = dotenv.parse(existingText)
if (existing.JWT_SECRET) {
  if (existing.JWT_SECRET.length < 32) throw new Error('JWT_SECRET exists but is too short. Replace it with a randomly generated value of at least 32 characters.')
  console.log('JWT_SECRET is already configured.')
} else {
  const secret = crypto.randomBytes(48).toString('base64url')
  const newline = existingText && !existingText.endsWith('\n') ? '\n' : ''
  fs.writeFileSync(envPath, `${existingText}${newline}JWT_SECRET=${secret}\n`, 'utf8')
  console.log('Generated a 48-byte JWT_SECRET in backend/.env. The value was not printed.')
}