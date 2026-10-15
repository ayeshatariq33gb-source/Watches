import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { getBackendProductId } from '../api/store.js'
import { useAuth } from '../context/useAuth.js'

export function ProductReviews({ product }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState('5')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest(`/products/${encodeURIComponent(product.slug)}/reviews`).then(({ reviews: result }) => {
      if (active) setReviews(result)
    }).catch(() => {})
    return () => { active = false }
  }, [product.slug])

  async function submit(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try {
      const productId = product.backendId || await getBackendProductId(product.slug)
      const result = await apiRequest(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify({ rating: Number(rating), title, body }) })
      setNotice(result.message || 'Your review is awaiting moderation.')
      setTitle(''); setBody('')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <section className="product-reviews" id="reviews"><div className="product-reviews-heading"><span className="eyebrow">A NOTE FROM OUR CLIENTS</span><h2>Considered <em>opinions.</em></h2></div><div className="product-reviews-layout"><div className="product-review-list">{reviews.length ? reviews.map((review) => <article key={review._id}><div className="product-review-rating" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={12} fill="currentColor" />)}</div><h3>{review.title || 'A considered review'}</h3><p>{review.body}</p><span>{review.user?.name || 'Aurel client'}</span></article>) : <p className="reviews-empty">No published reviews yet. Your experience could be the first.</p>}</div><div className="review-form-wrap">{user ? <form className="review-form" onSubmit={submit}><h3>Share your experience</h3><label>YOUR RATING<select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}</select></label><label>REVIEW TITLE<input maxLength="120" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>YOUR REVIEW<textarea required minLength="10" maxLength="2000" rows="4" value={body} onChange={(event) => setBody(event.target.value)} /></label>{error && <p className="account-error" role="alert">{error}</p>}{notice && <p className="form-message" role="status">{notice}</p>}<button className="button button-dark" disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT FOR REVIEW'}</button></form> : <div className="review-sign-in"><h3>Worn this timepiece?</h3><p>Sign in to share a review. New reviews are checked before publication.</p><Link className="underlined-link" to="/account">SIGN IN TO REVIEW <span>→</span></Link></div>}</div></div></section>
}