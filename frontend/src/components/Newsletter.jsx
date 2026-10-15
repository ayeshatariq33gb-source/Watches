import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    setError('')
    setSubscribed(true)
  }
  return <section className="newsletter-section" id="newsletter"><div className="newsletter-copy"><span className="eyebrow">A LETTER FROM THE MAISON</span><h2>Good things take <em>time.</em></h2><p>Notes on craft, new arrivals, and what inspires us. Only when it matters.</p></div><div className="newsletter-form-wrap">{subscribed ? <p className="subscribe-success" role="status"><Check size={18} /> You’re on the list. We’ll be in touch.</p> : <form className="newsletter-form" onSubmit={submit} noValidate><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="Your email address" aria-describedby={error ? 'newsletter-error' : undefined} /><button type="submit" aria-label="Subscribe to newsletter"><ArrowRight size={20} /></button>{error && <span className="form-error" id="newsletter-error" role="alert">{error}</span>}</form>}<span className="newsletter-privacy">A considered note, never noise. Unsubscribe whenever.</span></div></section>
}