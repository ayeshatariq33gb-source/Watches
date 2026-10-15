import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { apiRequest } from '../api/client.js'
import { mapApiProduct } from '../api/products.js'
import { products } from '../data/products.js'
import { ProductCard } from '../components/ProductCard.jsx'

const filterOptions = ['All watches', 'Men', 'Women', 'Automatic', 'Chronograph', 'Limited']

export function CollectionsPage() {
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const [query, setQuery] = useState(params.get('q') || '')
  const [catalog, setCatalog] = useState(products)
  const category = params.get('category') || 'All watches'
  useEffect(() => {
    let active = true
    apiRequest('/products?limit=100').then(({ products: remoteProducts }) => {
      if (active && remoteProducts.length) setCatalog(remoteProducts.map(mapApiProduct))
    }).catch(() => {})
    return () => { active = false }
  }, [])
  const visibleProducts = useMemo(() => {
    const filtered = catalog.filter((product) => (category === 'All watches' || product.category === category || product.type === category) && `${product.name} ${product.brand} ${product.category} ${product.type}`.toLowerCase().includes(query.toLowerCase()))
    if (sort === 'price-low') return filtered.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') return filtered.sort((a, b) => b.price - a.price)
    if (sort === 'newest') return filtered.sort((a, b) => Number(Boolean(b.badge?.includes('NEW'))) - Number(Boolean(a.badge?.includes('NEW'))))
    return filtered
  }, [catalog, category, query, sort])
  function chooseCategory(option) {
    const next = new URLSearchParams(params)
    if (option === 'All watches') next.delete('category')
    else next.set('category', option)
    setParams(next)
  }
  return <div className="collection-page"><div className="collection-banner"><div className="collection-banner-image" /><span className="eyebrow">MAISON AUREL · THE COLLECTION</span><h1>Objects for <em>the hours.</em></h1><p>Thoughtfully made. Meant to be kept.</p></div><div className="section-shell collection-content"><div className="collection-toolbar"><div className="filter-tabs" aria-label="Filter by category">{filterOptions.map((option) => <button key={option} className={category === option ? 'active' : ''} onClick={() => chooseCategory(option)}>{option}</button>)}</div><div className="collection-tools"><label className="catalog-search"><Search size={15} /><input aria-label="Search products" placeholder="Find a timepiece" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="sort-select"><SlidersHorizontal size={15} /><span className="sr-only">Sort products</span><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">New arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div></div><div className="result-count">{visibleProducts.length} TIMEPIECE{visibleProducts.length === 1 ? '' : 'S'} <span>·</span> COMPLIMENTARY SHIPPING</div>{visibleProducts.length ? <div className="product-grid catalog-grid">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="empty-results"><span className="eyebrow">NOT THIS TIME</span><h2>No watches found.</h2><p>Try a different search or explore the full collection.</p><button className="button button-dark" onClick={() => { setQuery(''); chooseCategory('All watches') }}>Clear filters</button></div>}</div></div>
}