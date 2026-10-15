import { useEffect, useState } from 'react'
import { LogOut, PackageCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'
import { money } from '../data/products.js'

export function UserDashboardPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', line1: user.address?.line1 || '', line2: user.address?.line2 || '', city: user.address?.city || '', region: user.address?.region || '', postalCode: user.address?.postalCode || '', country: user.address?.country || '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest('/users/orders').then(({ orders: result }) => { if (active) setOrders(result) }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const { user: updated } = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ name: form.name, phone: form.phone, address: { line1: form.line1, line2: form.line2, city: form.city, region: form.region, postalCode: form.postalCode, country: form.country } }) })
      updateUser(updated); setMessage('Your details have been saved.')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function signOut() {
    await logout().catch(() => {})
    navigate('/', { replace: true })
  }

  return <section className="section-shell dashboard-page"><div className="dashboard-header"><div><span className="eyebrow">YOUR MAISON</span><h1>Good day, <em>{user.name.split(' ')[0]}.</em></h1><p>Welcome to your personal Aurel account.</p></div><button className="dashboard-logout" onClick={signOut}><LogOut size={15} /> SIGN OUT</button></div><div className="dashboard-layout"><form className="dashboard-card profile-form" onSubmit={saveProfile}><div className="dashboard-card-heading"><UserRound size={17} /><h2>Your details</h2></div><label>FULL NAME<input required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>EMAIL ADDRESS<input value={user.email} disabled /></label><label>PHONE<input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><h3>DELIVERY ADDRESS</h3><label>ADDRESS LINE 1<input value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} /></label><label>ADDRESS LINE 2<input value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value })} /></label><div className="form-row"><label>CITY<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>REGION<input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} /></label></div><div className="form-row"><label>POSTAL CODE<input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></label><label>COUNTRY<input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} /></label></div>{error && <p className="account-error" role="alert">{error}</p>}{message && <p className="form-message" role="status">{message}</p>}<button className="button button-dark">{busy ? 'SAVING…' : 'SAVE DETAILS'}</button></form><div className="dashboard-card orders-card"><div className="dashboard-card-heading"><PackageCheck size={17} /><h2>Your orders</h2></div>{orders.length ? <div className="order-history">{orders.map((order) => <article key={order._id}><div><strong>{order.orderNumber}</strong><span>{new Date(order.createdAt).toLocaleDateString()}</span></div><div><span className="status-label">{order.approvalStatus === 'pending' ? 'AWAITING APPROVAL' : order.orderStatus.replaceAll('_', ' ').toUpperCase()}</span><strong>{money(order.subtotal)}</strong></div></article>)}</div> : <div className="dashboard-empty"><p>Your next favorite is out there.</p><a href="/collections">EXPLORE THE COLLECTION →</a></div>}</div></div></section>
}