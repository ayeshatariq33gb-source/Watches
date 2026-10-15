import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { money, products } from '../data/products.js'
import { useStore } from '../context/useStore.js'
import { ProductCard } from '../components/ProductCard.jsx'
import { apiRequest } from '../api/client.js'
import { mapApiProduct } from '../api/products.js'
import { ProductReviews } from '../components/ProductReviews.jsx'

export function ProductPage() {
  const { slug } = useParams()
  const [remoteProducts, setRemoteProducts] = useState({})
  useEffect(() => {
    let active = true
    apiRequest(`/products/${encodeURIComponent(slug)}`).then(({ product: result }) => {
      if (active) setRemoteProducts((current) => ({ ...current, [slug]: mapApiProduct(result) }))
    }).catch(() => {})
    return () => { active = false }
  }, [slug])
  const product = remoteProducts[slug] || products.find((item) => item.slug === slug)
  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState(0)
  const [added, setAdded] = useState(false)
  if (!product) return <div className="empty-results"><h2>That timepiece has moved on.</h2><Link className="button button-dark" to="/collections">Explore the collection</Link></div>
  const related = products.filter((item) => item.id !== product.id).slice(0, 3)
  return <div className="product-page section-shell"><Link className="back-link" to="/collections"><ArrowLeft size={15} /> BACK TO THE COLLECTION</Link><div className="product-detail"><div className="detail-gallery"><div className="detail-main-image"><img src={product.gallery[selectedImage]} alt={`${product.name}, view ${selectedImage + 1}`} /><button className={`detail-wishlist ${isWishlisted(product.id) ? 'is-saved' : ''}`} aria-label="Toggle wishlist" onClick={() => toggleWishlist(product)}><Heart fill={isWishlisted(product.id) ? 'currentColor' : 'none'} /></button></div><div className="detail-thumbnails">{product.gallery.map((image, index) => <button key={image} className={selectedImage === index ? 'active' : ''} onClick={() => setSelectedImage(index)} aria-label={`Show image ${index + 1}`}><img src={image} alt="" /></button>)}</div></div><div className="detail-copy"><span className="eyebrow">{product.brand} · {product.type.toUpperCase()}</span><h1>{product.name}</h1><div className="detail-rating"><span><Star size={14} fill="currentColor" /> {product.rating}</span><a href="#reviews">{product.reviews} considered reviews</a></div><p className="detail-price">{money(product.price)} <span>USD</span></p><p className="detail-description">{product.description}</p><div className="variant-select"><span>FINISH <b>{selectedColor === 0 ? '01' : `0${selectedColor + 1}`}</b></span><div className="swatches large-swatches">{product.colors.map((color, index) => <button key={color} className={selectedColor === index ? 'selected' : ''} onClick={() => setSelectedColor(index)} aria-label={`Select finish ${index + 1}`}><i style={{ backgroundColor: color }} /></button>)}</div></div><div className="detail-buy-row"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></button></div><button className="button button-dark detail-add" onClick={() => { addToCart(product, quantity); setAdded(true); window.setTimeout(() => setAdded(false), 1800) }}><Check size={16} /> {added ? 'ADDED TO YOUR BAG' : 'ADD TO BAG · ' + money(product.price * quantity)}</button></div><div className="detail-assurances"><p><Truck size={16} /> Complimentary insured delivery</p><p><ShieldCheck size={16} /> Five-year international warranty</p><p><Check size={16} /> Authenticity, guaranteed</p></div><div className="specifications"><h2>Details, considered.</h2>{[['MOVEMENT', product.movement], ['CASE', product.case], ['DIAL', product.dial], ['WATER RESISTANCE', product.water]].map(([label, value]) => <div key={label}><span>{label}</span><p>{value}</p></div>)}</div></div></div><ProductReviews product={product} /><section className="related-products"><div className="section-heading"><div><span className="eyebrow">A NATURAL COMPANION</span><h2>More to <em>consider.</em></h2></div></div><div className="product-grid">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></section></div>
}