const { before, after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-thirty-two-characters-long'
process.env.JWT_EXPIRES_IN = '1h'
process.env.FRONTEND_URL = 'http://localhost:5173'

const app = require('../src/app')
const Category = require('../src/models/Category')
const Product = require('../src/models/Product')
const User = require('../src/models/User')

let mongo
let category
let product

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } })
  await mongoose.connect(mongo.getUri())
  category = await Category.create({ name: 'Men’s watches', slug: 'men' })
  product = await Product.create({
    slug: 'test-meridian', brand: 'MAISON AUREL', name: 'Test Meridian', category: category._id,
    type: 'Automatic', price: 1200, image: 'https://example.test/watch.jpg', gallery: ['https://example.test/watch.jpg'], stock: 8,
  })
})

after(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})

test('customer and administrator storefront workflow', async () => {
  const health = await request(app).get('/api/v1/health').expect(200)
  assert.equal(health.body.data.database, 'connected')

  const registration = await request(app).post('/api/v1/auth/register').send({ name: 'Alex Aurel', email: 'alex@example.test', password: 'secure-test-password' }).expect(201)
  const customerToken = registration.body.data.token
  assert.equal(registration.body.data.user.role, 'user')
  assert.equal(registration.body.data.user.password, undefined)

  await request(app).get('/api/v1/users/dashboard').expect(401)
  await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${customerToken}`).expect(403)
  await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${customerToken}`).expect(200)
  await request(app).patch('/api/v1/users/me').set('Authorization', `Bearer ${customerToken}`).send({ phone: '+41 22 000 0000', address: { line1: '1 Watchmaker Lane', city: 'Geneva', postalCode: '1201', country: 'Switzerland' }, role: 'admin' }).expect(200)

  const catalog = await request(app).get('/api/v1/products?q=Meridian').expect(200)
  assert.equal(catalog.body.data.products.length, 1)
  assert.equal(catalog.body.data.products[0].category, 'Men')

  const cartResponse = await request(app).post('/api/v1/cart/items').set('Authorization', `Bearer ${customerToken}`).send({ productId: product._id, quantity: 2 }).expect(200)
  assert.equal(cartResponse.body.data.cart.subtotal, 2400)
  const updatedCart = await request(app).patch(`/api/v1/cart/items/${product._id}`).set('Authorization', `Bearer ${customerToken}`).send({ quantity: 3 }).expect(200)
  assert.equal(updatedCart.body.data.cart.subtotal, 3600)
  await request(app).delete(`/api/v1/cart/items/${product._id}`).set('Authorization', `Bearer ${customerToken}`).expect(200)
  assert.equal((await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`).expect(200)).body.data.cart.itemCount, 0)
  await request(app).post('/api/v1/cart/items').set('Authorization', `Bearer ${customerToken}`).send({ productId: product._id, quantity: 2 }).expect(200)
  await request(app).post('/api/v1/wishlist/items').set('Authorization', `Bearer ${customerToken}`).send({ productId: product._id }).expect(200)
  assert.equal((await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${customerToken}`).expect(200)).body.data.products.length, 1)
  await request(app).delete(`/api/v1/wishlist/items/${product._id}`).set('Authorization', `Bearer ${customerToken}`).expect(200)
  await request(app).post('/api/v1/wishlist/items').set('Authorization', `Bearer ${customerToken}`).send({ productId: product._id }).expect(200)

  const address = { line1: '1 Watchmaker Lane', city: 'Geneva', postalCode: '1201', country: 'Switzerland' }
  const codOrder = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${customerToken}`).send({ paymentMethod: 'cash_on_delivery', shippingAddress: address }).expect(201)
  assert.equal(codOrder.body.data.order.approvalStatus, 'pending')
  assert.equal(codOrder.body.data.order.paymentStatus, 'pending')
  assert.equal(await Product.findById(product._id).then((record) => record.stock), 6)
  assert.equal((await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`).expect(200)).body.data.cart.items.length, 0)
  assert.equal((await request(app).get('/api/v1/users/orders').set('Authorization', `Bearer ${customerToken}`).expect(200)).body.data.orders.length, 1)

  const admin = await User.create({ name: 'Store Administrator', email: 'admin@example.test', password: 'another-secure-test-password', role: 'admin' })
  const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: admin.email, password: 'another-secure-test-password' }).expect(200)
  const adminToken = adminLogin.body.data.token
  await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${adminToken}`).expect(200)
  const categoryResponse = await request(app).post('/api/v1/admin/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Test Editions', slug: 'test-editions' }).expect(201)
  await request(app).patch(`/api/v1/admin/categories/${categoryResponse.body.data.category._id}`).set('Authorization', `Bearer ${adminToken}`).send({ description: 'Integration-test category' }).expect(200)
  const managedProduct = await request(app).post('/api/v1/admin/products').set('Authorization', `Bearer ${adminToken}`).send({ slug: 'admin-created-piece', brand: 'MAISON AUREL', name: 'Admin Created Piece', categorySlug: 'men', type: 'Automatic', price: 800, image: 'https://example.test/admin.jpg', stock: 2 }).expect(201)
  await request(app).patch(`/api/v1/admin/inventory/${managedProduct.body.data.product._id}`).set('Authorization', `Bearer ${adminToken}`).send({ stock: 5 }).expect(200)
  await request(app).patch(`/api/v1/admin/products/${managedProduct.body.data.product._id}`).set('Authorization', `Bearer ${adminToken}`).send({ price: 850 }).expect(200)
  await request(app).delete(`/api/v1/admin/products/${managedProduct.body.data.product._id}`).set('Authorization', `Bearer ${adminToken}`).expect(200)
  assert.equal((await request(app).get('/api/v1/admin/customers').set('Authorization', `Bearer ${adminToken}`).expect(200)).body.data.customers.length, 1)
  await request(app).patch(`/api/v1/admin/orders/${codOrder.body.data.order._id}/decision`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'approve' }).expect(200)
  await request(app).patch(`/api/v1/admin/orders/${codOrder.body.data.order._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ orderStatus: 'processing' }).expect(200)
  await request(app).patch(`/api/v1/admin/orders/${codOrder.body.data.order._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ orderStatus: 'shipped' }).expect(200)
  await request(app).patch(`/api/v1/admin/orders/${codOrder.body.data.order._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ orderStatus: 'delivered' }).expect(200)
  const deliveredCod = await request(app).get('/api/v1/admin/orders?status=delivered').set('Authorization', `Bearer ${adminToken}`).expect(200)
  assert.equal(deliveredCod.body.data.orders[0].paymentStatus, 'approved')

  await request(app).post('/api/v1/cart/items').set('Authorization', `Bearer ${customerToken}`).send({ productId: product._id, quantity: 1 }).expect(200)
  const cardOrder = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${customerToken}`).send({ paymentMethod: 'demo_card', shippingAddress: address, card: { number: '4242 4242 4242 4242', expiryMonth: '12', expiryYear: '2030', cvc: '123', cardholderName: 'Alex Aurel' } }).expect(201)
  assert.equal(cardOrder.body.data.order.paymentStatus, 'pending')
  assert.equal(cardOrder.body.data.order.cardLast4, '4242')
  assert.equal('cardNumber' in cardOrder.body.data.order, false)
  assert.equal('cvc' in cardOrder.body.data.order, false)
  assert.equal((await request(app).get('/api/v1/admin/payments?status=pending').set('Authorization', `Bearer ${adminToken}`).expect(200)).body.data.payments.length, 1)
  await request(app).patch(`/api/v1/admin/payments/${cardOrder.body.data.order._id}/decision`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'approve' }).expect(200)
  const finalDashboard = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${adminToken}`).expect(200)
  assert.equal(finalDashboard.body.data.approvedCardRevenue, 1200)

  const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set('Authorization', `Bearer ${customerToken}`).send({ rating: 5, title: 'Quietly excellent', body: 'A precise and beautifully finished watch.' }).expect(201)
  assert.equal(review.body.data.review.isApproved, false)
  await request(app).patch(`/api/v1/admin/reviews/${review.body.data.review._id}`).set('Authorization', `Bearer ${adminToken}`).send({ approved: true }).expect(200)
  assert.equal((await Product.findById(product._id)).rating, 5)

  await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${customerToken}`).expect(200)
  await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${customerToken}`).expect(401)
})
