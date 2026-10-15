import { useState } from 'react'
import { ArrowUpRight, Heart, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/useStore.js'
import { money } from '../data/products.js'

export function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const [added, setAdded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  function add() { addToCart(product); setAdded(true); window.setTimeout(() => setAdded(false), 1700) }
  return <article className="product-card" style={{ '--card-order': index }}><div className="product-image-wrap">{product.badge && <span className="product-badge">{product.badge}</span>}<Link to={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}><img src={imageFailed ? 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=75' : product.image} onError={() => setImageFailed(true)} alt={`${product.name} luxury watch`} loading={index > 2 ? 'lazy' : 'eager'} /></Link><button className={`wishlist-button ${isWishlisted(product.id) ? 'is-saved' : ''}`} aria-label={`${isWishlisted(product.id) ? 'Remove' : 'Add'} ${product.name} ${isWishlisted(product.id) ? 'from' : 'to'} wishlist`} onClick={() => toggleWishlist(product)}><Heart size={17} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} /></button><Link to={`/product/${product.slug}`} className="quick-view">DISCOVER <ArrowUpRight size={14} /></Link></div><div className="product-meta"><span>{product.brand}</span><span className="rating"><Star size={12} fill="currentColor" /> {product.rating}</span></div><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><div className="product-bottom"><div className="swatches" aria-label="Available colors">{product.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</div><span className="product-price">{money(product.price)}</span></div><button className={`add-to-bag ${added ? 'added' : ''}`} onClick={add}><ShoppingBag size={15} /> {added ? 'ADDED TO BAG' : 'ADD TO BAG'}</button></article>
}