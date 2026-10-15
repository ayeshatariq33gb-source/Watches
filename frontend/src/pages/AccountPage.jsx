import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export function AccountPage() {
  const { login, register, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <NavigateByRole user={user} />
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (mode === 'register' && form.password.length < 8) { setError('Choose a password with at least 8 characters.'); return }
    setBusy(true)
    try {
      const signedIn = mode === 'register' ? await register(form) : await login({ email: form.email, password: form.password })
      navigate(location.state?.from || (signedIn.role === 'admin' ? '/admin' : '/dashboard'), { replace: true })
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return <section className="account-page section-shell"><div className="account-panel"><span className="eyebrow">WELCOME TO THE MAISON</span><h1>{mode === 'login' ? 'Good to have you <em>back.</em>' : 'Begin your <em>story.</em>'}</h1><p className="account-intro">{mode === 'login' ? 'Sign in to see your orders and saved timepieces.' : 'Create an account to keep your Maison close.'}</p><div className="account-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>SIGN IN</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>CREATE ACCOUNT</button></div><form className="account-form" onSubmit={submit} noValidate>{mode === 'register' && <label>YOUR NAME<input autoComplete="name" required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}<label>EMAIL ADDRESS<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>PASSWORD<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="account-error" role="alert">{error}</p>}<button className="button button-dark account-submit" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight size={16} /></button></form><p className="account-fineprint">Your account is protected with encrypted sessions. Demo store accounts are managed by this shop.</p><Link className="account-back" to="/collections">CONTINUE AS A GUEST</Link></div></section>
}

function NavigateByRole({ user }) {
  return <Link className="account-existing" to={user.role === 'admin' ? '/admin' : '/dashboard'}>Continue to your account <ArrowRight size={15} /></Link>
}