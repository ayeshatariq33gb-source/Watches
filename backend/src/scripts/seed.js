require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const { connectDatabase } = require('../config/db')
const Category = require('../models/Category')
const Product = require('../models/Product')
const User = require('../models/User')
const { validEmail } = require('../utils/validation')

const image = (photo, width = 1000) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=85`
const categoryData = [
  { name: 'Men’s watches', slug: 'men', image: image('photo-1524805444758-089113d48a6d') },
  { name: 'Women’s watches', slug: 'women', image: image('photo-1508685096489-7aacd43bd3b1') },
  { name: 'Automatic', slug: 'automatic', image: image('photo-1523275335684-37898b6baf30') },
  { name: 'Chronographs', slug: 'chronographs', image: image('photo-1524592094714-0f0654e20314') },
  { name: 'Limited editions', slug: 'limited-editions', image: image('photo-1523170335258-f5ed11844a49') },
]
const productData = [
  { slug: 'aurelia-no-03', brand: 'MAISON AUREL', name: 'Aurelia No. 03', category: 'women', type: 'Dress', price: 4280, rating: 4.9, reviewCount: 38, image: image('photo-1523170335258-f5ed11844a49'), gallery: [image('photo-1523170335258-f5ed11844a49', 1200), image('photo-1524592094714-0f0654e20314', 1200), image('photo-1508685096489-7aacd43bd3b1', 1200)], colors: ['#c8a46b', '#dedbd2', '#252522'], badge: 'BESTSELLER', movement: 'Swiss automatic, calibre MA-03', case: '36 mm, polished 18k rose gold', dial: 'Sunray champagne, applied indices', water: '50 metres', description: 'An exercise in quiet confidence. The Aurelia brings a softened silhouette and considered detail together in a watch designed to be worn, and remembered.', stock: 12 },
  { slug: 'atelier-chronograph', brand: 'MAISON AUREL', name: 'Atelier Chronograph', category: 'men', type: 'Chronograph', price: 6850, rating: 4.8, reviewCount: 26, image: image('photo-1524805444758-089113d48a6d'), gallery: [image('photo-1524805444758-089113d48a6d', 1200), image('photo-1523275335684-37898b6baf30', 1200), image('photo-1524592094714-0f0654e20314', 1200)], colors: ['#252522', '#b89a64'], badge: 'NEW ARRIVAL', movement: 'Swiss automatic chronograph', case: '41 mm, brushed stainless steel', dial: 'Textured charcoal, twin subdials', water: '100 metres', description: 'Made for the beautifully unhurried. A precise mechanical heart sits beneath a deeply textured dial, framed by a case that feels as good as it looks.', stock: 8 },
  { slug: 'meridian-automatic', brand: 'MAISON AUREL', name: 'Meridian Automatic', category: 'men', type: 'Automatic', price: 5120, rating: 4.9, reviewCount: 51, image: image('photo-1523275335684-37898b6baf30'), gallery: [image('photo-1523275335684-37898b6baf30', 1200), image('photo-1524592094714-0f0654e20314', 1200), image('photo-1524805444758-089113d48a6d', 1200)], colors: ['#18201d', '#d0c6b2', '#252522'], badge: '', movement: 'Swiss automatic, 42-hour reserve', case: '39 mm, stainless steel', dial: 'Deep forest enamel', water: '100 metres', description: 'A modern heirloom with a little wanderlust. The Meridian pairs an in-house automatic movement with the understated elegance of a deep green enamel dial.', stock: 10 },
  { slug: 'petite-lune', brand: 'MAISON AUREL', name: 'Petite Lune', category: 'women', type: 'Dress', price: 3790, rating: 5, reviewCount: 19, image: image('photo-1508685096489-7aacd43bd3b1'), gallery: [image('photo-1508685096489-7aacd43bd3b1', 1200), image('photo-1523170335258-f5ed11844a49', 1200), image('photo-1524592094714-0f0654e20314', 1200)], colors: ['#d7c5a0', '#b1b0aa'], badge: 'NEW ARRIVAL · LIMITED', movement: 'Swiss quartz, moonphase', case: '32 mm, 18k gold vermeil', dial: 'Ivory mother-of-pearl', water: '30 metres', description: 'A small study in celestial beauty. A fine moonphase complication and mother-of-pearl dial catch the light differently at every hour.', stock: 6 },
  { slug: 'nocturne-edition', brand: 'MAISON AUREL', name: 'Nocturne Edition', category: 'limited-editions', type: 'Limited Edition', price: 9250, rating: 4.9, reviewCount: 12, image: image('photo-1524592094714-0f0654e20314'), gallery: [image('photo-1524592094714-0f0654e20314', 1200), image('photo-1524805444758-089113d48a6d', 1200), image('photo-1523275335684-37898b6baf30', 1200)], colors: ['#20211e', '#b89a64'], badge: 'LIMITED · 100 PIECES', movement: 'Swiss automatic, hand-finished', case: '40 mm, black ceramic', dial: 'Midnight lacquer with gold markers', water: '100 metres', description: 'One hundred pieces, and no more. The Nocturne is a singular expression of after-hours elegance, finished by hand and numbered individually.', stock: 3 },
  { slug: 'field-notes-01', brand: 'MAISON AUREL', name: 'Field Notes 01', category: 'men', type: 'Automatic', price: 4650, rating: 4.7, reviewCount: 31, image: image('photo-1518544801976-3e159e50e5bb'), gallery: [image('photo-1518544801976-3e159e50e5bb', 1200), image('photo-1523170335258-f5ed11844a49', 1200), image('photo-1524592094714-0f0654e20314', 1200)], colors: ['#474b3e', '#9c8265'], badge: 'NEW ARRIVAL', movement: 'Swiss automatic, 38-hour reserve', case: '40 mm, sandblasted steel', dial: 'Olive with luminous hands', water: '150 metres', description: 'For wherever the day leads. The Field Notes is a capable, beautifully legible companion with a robust movement and a quietly distinctive olive dial.', stock: 9 },
]

async function seed() {
  await connectDatabase()
  const categories = await Promise.all(categoryData.map((category) => Category.findOneAndUpdate({ slug: category.slug }, { $setOnInsert: category }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })))
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category._id]))
  await Promise.all(productData.map(({ category, ...product }) => Product.findOneAndUpdate({ slug: product.slug }, { $setOnInsert: { ...product, category: categoryBySlug.get(category) } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })))

  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD || ''
  if (adminEmail || adminPassword) {
    if (!validEmail(adminEmail)) console.warn('Admin bootstrap skipped: ADMIN_EMAIL is not a valid email address.')
    else {
      const existingAdmin = await User.findOne({ email: adminEmail })
      if (existingAdmin && existingAdmin.role !== 'admin') console.warn('Admin bootstrap skipped: ADMIN_EMAIL belongs to a non-admin account; no role changes were made.')
      else if (existingAdmin) console.log('Configured admin account already exists; it was left unchanged.')
      else if (adminPassword.length < 12) console.warn('Admin bootstrap skipped: set ADMIN_PASSWORD to at least 12 characters to create the initial admin.')
      else {
        const password = await bcrypt.hash(adminPassword, 12)
        await User.create({ name: 'Maison Aurel Administrator', email: adminEmail, password, role: 'admin' })
        console.log('Admin account created from the configured ADMIN_EMAIL.')
      }
    }
  }
  console.log(`Seeded ${categoryData.length} categories and ${productData.length} timepieces.`)
}

seed().catch((error) => { console.error(error.message); process.exitCode = 1 }).finally(() => mongoose.disconnect())