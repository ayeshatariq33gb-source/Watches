import { apiRequest } from './client.js'
import { mapApiProduct } from './products.js'

export async function getBackendProductId(slug) {
  const result = await apiRequest('/products?limit=100')
  const product = result.products.find((item) => item.slug === slug)
  if (!product) throw new Error('This product has not been added to the backend catalog yet. Run npm run seed.')
  return product.id || product._id
}

export async function fetchRemoteCart() {
  const { cart } = await apiRequest('/cart')
  return cart.items.map(({ product, quantity }) => ({ ...mapApiProduct(product), quantity }))
}

export async function fetchRemoteWishlist() {
  const { products } = await apiRequest('/wishlist')
  return products.map(mapApiProduct)
}

export async function addRemoteCartItem(slug, quantity) {
  const productId = await getBackendProductId(slug)
  await apiRequest('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) })
}

export async function updateRemoteCartItem(slug, quantity) {
  const productId = await getBackendProductId(slug)
  await apiRequest(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
}

export async function removeRemoteCartItem(slug) {
  const productId = await getBackendProductId(slug)
  await apiRequest(`/cart/items/${productId}`, { method: 'DELETE' })
}

export async function addRemoteWishlistItem(slug) {
  const productId = await getBackendProductId(slug)
  await apiRequest('/wishlist/items', { method: 'POST', body: JSON.stringify({ productId }) })
}

export async function removeRemoteWishlistItem(slug) {
  const productId = await getBackendProductId(slug)
  await apiRequest(`/wishlist/items/${productId}`, { method: 'DELETE' })
}

export async function replaceRemoteCart(items) {
  const products = await apiRequest('/products?limit=100')
  const entries = items.map((item) => {
    const product = products.products.find((entry) => entry.slug === item.slug)
    if (!product) throw new Error(`The ${item.name} timepiece is not in the backend catalog. Run npm run seed.`)
    return { productId: product.id || product._id, quantity: item.quantity }
  })
  const { cart } = await apiRequest('/cart', { method: 'PUT', body: JSON.stringify({ items: entries }) })
  return cart.items.map(({ product, quantity }) => ({ ...mapApiProduct(product), quantity }))
}

export async function replaceRemoteWishlist(items) {
  const products = await apiRequest('/products?limit=100')
  const productIds = items.map((item) => {
    const product = products.products.find((entry) => entry.slug === item.slug)
    if (!product) throw new Error(`The ${item.name} timepiece is not in the backend catalog. Run npm run seed.`)
    return product.id || product._id
  })
  const result = await apiRequest('/wishlist', { method: 'PUT', body: JSON.stringify({ productIds }) })
  return result.products.map(mapApiProduct)
}