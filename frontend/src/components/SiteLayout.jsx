import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useStore } from '../context/useStore.js'
import { useAuth } from '../context/useAuth.js'

export function SiteLayout() {
  const { cart, wishlist } = useStore()
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  if (location.pathname === '/admin/login' || (user?.role === 'admin' && location.pathname === '/admin')) {
    return <main className="admin-route-shell"><Outlet /></main>
  }
  function search(event) {
    event.preventDefault()
    navigate(`/collections${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
    setSearchOpen(false)
  }
  return <>
    <div className="top-note">COMPLIMENTARY WORLDWIDE SHIPPING ON ORDERS OVER $1,000 <ArrowRight size={12} /></div>
    <header className="site-header">
      <button className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        <NavLink onClick={() => setMenuOpen(false)} to="/">Home</NavLink><NavLink onClick={() => setMenuOpen(false)} to="/collections">Collections</NavLink><NavLink onClick={() => setMenuOpen(false)} to="/collections?category=Men">Men</NavLink><NavLink onClick={() => setMenuOpen(false)} to="/collections?category=Women">Women</NavLink><a onClick={() => setMenuOpen(false)} href="/#story">About</a><a onClick={() => setMenuOpen(false)} href="/#contact">Contact</a>
      </nav>
      <Link to="/" className="wordmark" aria-label="Maison Aurel home"><span>MAISON</span><strong>AUREL</strong></Link>
      <div className="header-actions"><button className="icon-button search-trigger" aria-label="Search watches" onClick={() => setSearchOpen(!searchOpen)}><Search /></button><Link to="/wishlist" className="icon-button" aria-label={`Wishlist, ${wishlist.length} saved watches`}><Heart /><span className="action-count">{wishlist.length}</span></Link><Link className="icon-button account-trigger" to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/account'} aria-label={user ? 'Open your account' : 'Sign in or create an account'}><UserRound /></Link><Link to="/cart" className="icon-button bag-button" aria-label={`Shopping bag, ${cartCount} items`}><ShoppingBag /><span className="action-count">{cartCount}</span></Link></div>
      {searchOpen && <form className="search-panel" onSubmit={search}><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" aria-label="Search the collection" /><button className="text-action" type="submit">SEARCH</button><button type="button" className="icon-button close-search" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button></form>}
    </header>
    <main><Outlet /></main>
    <Footer />
  </>
}

function Footer() {
  return <footer className="site-footer" id="contact"><div className="footer-main"><div className="footer-brand"><Link to="/" className="wordmark footer-wordmark"><span>MAISON</span><strong>AUREL</strong></Link><p>Time, considered.<br />Made to be kept.</p><div className="social-links"><a href="https://instagram.com" aria-label="Instagram">ig</a><a href="https://pinterest.com" aria-label="Pinterest">p</a><a href="https://facebook.com" aria-label="Facebook">f</a></div></div><div className="footer-column"><h3>EXPLORE</h3><Link to="/collections">All watches</Link><Link to="/collections?category=Men">For him</Link><Link to="/collections?category=Women">For her</Link><Link to="/collections?category=Limited">Limited editions</Link></div><div className="footer-column"><h3>MAISON AUREL</h3><a href="/#story">Our story</a><a href="/#craft">Our craft</a><a href="/#reviews">Journal</a><a href="mailto:concierge@maisonaurel.com">Contact us</a></div><div className="footer-column"><h3>HERE TO HELP</h3><a href="mailto:concierge@maisonaurel.com">Client care</a><a href="mailto:concierge@maisonaurel.com">Shipping & returns</a><a href="mailto:concierge@maisonaurel.com">Care & warranty</a><Link to="/cart">Your order</Link></div><div className="footer-contact"><h3>A NOTE FROM THE MAISON</h3><p>New releases, considered stories, and the occasional very good reason to look at the time.</p><a href="/#newsletter" className="footer-signup">Join our letters <ArrowRight size={16} /></a></div></div><div className="footer-bottom"><span>© 2026 MAISON AUREL. ALL RIGHTS RESERVED.</span><span>CRAFTED WITH INTENTION · SWISS MADE</span><a href="mailto:concierge@maisonaurel.com">PRIVACY & TERMS</a></div></footer>
}
