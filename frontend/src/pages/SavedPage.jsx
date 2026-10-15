import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/useStore.js'
import { ProductCard } from '../components/ProductCard.jsx'

export function SavedPage() {
  const { wishlist } = useStore()
  return <section className="section-shell saved-page"><span className="eyebrow">KEPT CLOSE</span><h1>Your <em>wishlist.</em></h1><p className="saved-intro">The timepieces you’re thinking about.</p>{wishlist.length ? <div className="product-grid">{wishlist.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="empty-state"><Heart size={28} /><h2>A little room for possibility.</h2><p>Save the watches you love, and find them here when the moment feels right.</p><Link to="/collections" className="button button-dark">Explore the collection</Link></div>}</section>
}