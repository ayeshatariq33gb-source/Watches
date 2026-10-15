import { useCallback, useEffect, useState } from 'react'
import { Boxes, CircleDollarSign, ClipboardList, LogOut, Package, Plus, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'
import { money } from '../data/products.js'

const tabs = [
  { id: 'overview', label: 'Overview', Icon: ShieldCheck },
  { id: 'products', label: 'Products & inventory', Icon: Boxes },
  { id: 'orders', label: 'Orders', Icon: Package },
  { id: 'payments', label: 'Payments', Icon: CircleDollarSign },
  { id: 'customers', label: 'Customers', Icon: Users },
  { id: 'reviews', label: 'Reviews', Icon: ClipboardList },
]

function loadAdminData() {
  return Promise.all([
    apiRequest('/admin/dashboard'), apiRequest('/admin/products?status=active'), apiRequest('/admin/orders'), apiRequest('/admin/payments?status=pending'), apiRequest('/admin/customers?limit=100'), apiRequest('/admin/reviews?status=pending'), apiRequest('/admin/categories'),
  ])
}

export function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [reviews, setReviews] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [productForm, setProductForm] = useState({ slug: '', name: '', brand: 'MAISON AUREL', categorySlug: 'men', type: 'Automatic', price: '', image: '', stock: '0' })
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' })

  const applyAdminData = useCallback(([stats, productData, orderData, paymentData, customerData, reviewData, categoryData]) => {
    setOverview(stats); setProducts(productData.products); setOrders(orderData.orders); setPayments(paymentData.payments); setCustomers(customerData.customers); setReviews(reviewData.reviews); setCategories(categoryData.categories)
  }, [])
  const refresh = useCallback(async () => {
    try { applyAdminData(await loadAdminData()) } catch (requestError) { setError(requestError.message) }
  }, [applyAdminData])

  useEffect(() => {
    let active = true
    loadAdminData().then((data) => { if (active) applyAdminData(data) }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [applyAdminData])

  async function act(path, body, successMessage) {
    setError(''); setNotice('')
    try { await apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }); setNotice(successMessage); await refresh() }
    catch (requestError) { setError(requestError.message) }
  }

  async function createProduct(event) {
    event.preventDefault(); setError(''); setNotice('')
    try {
      await apiRequest('/admin/products', { method: 'POST', body: JSON.stringify({ ...productForm, price: Number(productForm.price), stock: Number(productForm.stock), image: productForm.image, gallery: [productForm.image] }) })
      setNotice('Timepiece added to the catalog.'); setProductForm({ slug: '', name: '', brand: 'MAISON AUREL', categorySlug: 'men', type: 'Automatic', price: '', image: '', stock: '0' }); await refresh()
    } catch (requestError) { setError(requestError.message) }
  }

  async function createCategory(event) {
    event.preventDefault(); setError(''); setNotice('')
    try { await apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(categoryForm) }); setNotice('Category created.'); setCategoryForm({ name: '', slug: '' }); await refresh() }
    catch (requestError) { setError(requestError.message) }
  }

  async function signOut() { await logout().catch(() => {}); navigate('/', { replace: true }) }
  const pendingOrders = orders.filter((order) => order.approvalStatus === 'pending')
  const loading = !overview && !error
  const nextStatus = { confirmed: 'processing', processing: 'shipped', shipped: 'delivered' }

  return <section className="admin-page"><div className="admin-topbar"><div><span className="eyebrow">MAISON AUREL · ADMINISTRATION</span><h1>Good day, <em>{user.name.split(' ')[0]}.</em></h1></div><button className="dashboard-logout" onClick={signOut}><LogOut size={15} /> SIGN OUT</button></div><div className="admin-shell"><nav className="admin-tabs" aria-label="Admin sections">{tabs.map(({ id, label, Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={15} />{label}</button>)}</nav>{error && <p className="account-error admin-message" role="alert">{error}</p>}{notice && <p className="form-message admin-message" role="status">{notice}</p>}{loading ? <div className="auth-loading">LOADING THE MAISON</div> : <div className="admin-content">{tab === 'overview' && <Overview overview={overview} pendingOrders={pendingOrders.length} products={products} orders={orders} onReviewOrders={() => setTab('orders')} />}{tab === 'products' && <ProductManagement products={products} productForm={productForm} setProductForm={setProductForm} createProduct={createProduct} categoryForm={categoryForm} setCategoryForm={setCategoryForm} createCategory={createCategory} categories={categories} act={act} />}{tab === 'orders' && <OrderManagement orders={orders} act={act} nextStatus={nextStatus} />}{tab === 'payments' && <PaymentManagement payments={payments} act={act} />}{tab === 'customers' && <CustomerManagement customers={customers} act={act} />}{tab === 'reviews' && <ReviewManagement reviews={reviews} act={act} />}</div>}</div></section>
}

function Overview({ overview, pendingOrders, products, orders, onReviewOrders }) {
  return <><div className="admin-stat-grid">{[['CUSTOMERS', overview?.customers || 0], ['ACTIVE TIMEPIECES', overview?.products || 0], ['ORDERS', overview?.orders || 0], ['CARD PAYMENTS TO REVIEW', overview?.pendingPayments || 0]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><div className="admin-overview-grid"><section className="admin-card"><div className="admin-card-heading"><h2>Needs your attention</h2><span>{pendingOrders + (overview?.pendingPayments || 0)}</span></div>{pendingOrders ? <p>{pendingOrders} orders are waiting for a decision.</p> : <p>No orders are waiting for approval.</p>}<button className="text-button" onClick={onReviewOrders}>REVIEW ORDERS →</button></section><section className="admin-card"><div className="admin-card-heading"><h2>Inventory watch</h2><span>{overview?.lowStock || 0} low</span></div>{products.filter((product) => product.stock <= 3).slice(0, 3).map((product) => <p className="admin-mini-row" key={product._id}><span>{product.name}</span><strong>{product.stock} left</strong></p>)}{!products.some((product) => product.stock <= 3) && <p>All active pieces are well stocked.</p>}</section><section className="admin-card"><div className="admin-card-heading"><h2>Approved card sales</h2><CircleDollarSign size={17} /></div><strong className="admin-revenue">{money(overview?.approvedCardRevenue || 0)}</strong><p>Demo-card orders marked approved.</p></section><section className="admin-card"><div className="admin-card-heading"><h2>Recent orders</h2><Package size={17} /></div>{orders.slice(0, 4).map((order) => <p className="admin-mini-row" key={order._id}><span>{order.orderNumber}</span><strong>{String(order.orderStatus || '').replaceAll('_', ' ')}</strong></p>)}</section></div></>
}

function ProductManagement({ products, productForm, setProductForm, createProduct, categoryForm, setCategoryForm, createCategory, categories, act }) {
  return <div className="admin-management"><div className="admin-management-heading"><div><span className="eyebrow">CATALOG & STOCK</span><h2>Timepieces</h2></div><span>{products.length} active</span></div><form className="admin-create-form" onSubmit={createProduct}><h3>ADD A TIMEPIECE</h3><div className="admin-form-grid">{[['slug', 'Product slug'], ['name', 'Name'], ['brand', 'Brand'], ['type', 'Type'], ['price', 'Price, USD'], ['image', 'Image URL'], ['stock', 'Initial stock']].map(([field, label]) => <label key={field}>{label}<input required value={productForm[field]} type={field === 'price' || field === 'stock' ? 'number' : 'text'} min={field === 'price' || field === 'stock' ? '0' : undefined} onChange={(event) => setProductForm({ ...productForm, [field]: event.target.value })} /></label>)}<label>Category<select value={productForm.categorySlug} onChange={(event) => setProductForm({ ...productForm, categorySlug: event.target.value })}>{categories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}</select></label></div><button className="button button-dark"><Plus size={15} /> ADD TIMEPIECE</button></form><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>TIMEPIECE</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>UPDATE</th><th>STATUS</th></tr></thead><tbody>{products.map((product) => <ProductRow key={product._id} product={product} act={act} />)}</tbody></table></div><form className="category-create-form" onSubmit={createCategory}><h3>ADD CATEGORY</h3><input required placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /><input required placeholder="url-slug" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} /><button className="text-button">CREATE CATEGORY →</button></form></div>
}

function ProductRow({ product, act }) {
  const [stock, setStock] = useState(product.stock)
  return <tr><td><strong>{product.name}</strong><small>{product.slug}</small></td><td>{product.category?.name}</td><td>{money(product.price)}</td><td><input className="stock-input" aria-label={`Stock for ${product.name}`} type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} /></td><td><button className="small-admin-button" onClick={() => act(`/admin/inventory/${product._id}`, { stock: Number(stock) }, 'Inventory updated.')}>SAVE STOCK</button></td><td>{product.isActive ? 'ACTIVE' : 'ARCHIVED'}</td></tr>
}

function OrderManagement({ orders, act, nextStatus }) {
  return <div className="admin-management"><div className="admin-management-heading"><div><span className="eyebrow">FULFILLMENT</span><h2>Orders</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>AMOUNT</th><th>PAYMENT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleDateString()}</small></td><td>{order.user?.name || 'Customer'}</td><td>{money(order.subtotal)}</td><td>{String(order.paymentMethod || '').replaceAll('_', ' ')} · {order.paymentStatus}</td><td>{String(order.orderStatus || '').replaceAll('_', ' ')}</td><td>{order.approvalStatus === 'pending' ? <div className="admin-actions"><button className="small-admin-button approve" onClick={() => act(`/admin/orders/${order._id}/decision`, { decision: 'approve' }, 'Order approved.')}>APPROVE</button><button className="small-admin-button reject" onClick={() => act(`/admin/orders/${order._id}/decision`, { decision: 'reject' }, 'Order rejected and stock restored.')}>REJECT</button></div> : nextStatus[order.orderStatus] ? <button className="small-admin-button" onClick={() => act(`/admin/orders/${order._id}/status`, { orderStatus: nextStatus[order.orderStatus] }, 'Fulfillment status updated.')}>MARK {nextStatus[order.orderStatus].toUpperCase()}</button> : '—'}</td></tr>)}</tbody></table></div></div>
}

function PaymentManagement({ payments, act }) {
  return <div className="admin-management"><div className="admin-management-heading"><div><span className="eyebrow">DEMO PAYMENT REVIEW</span><h2>Card payments</h2></div><span>No card numbers are stored.</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>REFERENCE</th><th>CARD</th><th>AMOUNT</th><th>DECISION</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.orderId}><td>{payment.orderNumber}</td><td>{payment.user?.name}</td><td>{payment.reference}</td><td>{payment.cardBrand} ···· {payment.cardLast4}</td><td>{money(payment.amount)}</td><td><div className="admin-actions"><button className="small-admin-button approve" onClick={() => act(`/admin/payments/${payment.orderId}/decision`, { decision: 'approve' }, 'Demo payment approved.')}>APPROVE</button><button className="small-admin-button reject" onClick={() => act(`/admin/payments/${payment.orderId}/decision`, { decision: 'reject' }, 'Demo payment rejected.')}>REJECT</button></div></td></tr>)}</tbody></table>{!payments.length && <p className="admin-no-results">No pending demo card payments.</p>}</div></div>
}

function CustomerManagement({ customers, act }) {
  return <div className="admin-management"><div className="admin-management-heading"><div><span className="eyebrow">CUSTOMER ACCOUNTS</span><h2>Customers</h2></div><span>{customers.length} shown</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>JOINED</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id}><td>{customer.name}</td><td>{customer.email}</td><td>{new Date(customer.createdAt).toLocaleDateString()}</td><td>{customer.isActive ? 'ACTIVE' : 'DISABLED'}</td><td><button className="small-admin-button" onClick={() => act(`/admin/customers/${customer._id}`, { isActive: !customer.isActive }, customer.isActive ? 'Customer disabled.' : 'Customer enabled.')}>{customer.isActive ? 'DISABLE' : 'ENABLE'}</button></td></tr>)}</tbody></table></div></div>
}

function ReviewManagement({ reviews, act }) {
  return <div className="admin-management"><div className="admin-management-heading"><div><span className="eyebrow">COMMUNITY</span><h2>Reviews to moderate</h2></div></div>{reviews.map((review) => <article className="review-moderation-row" key={review._id}><div><strong>{review.product?.name} · {review.rating}/5</strong><span>{review.user?.name} · {new Date(review.createdAt).toLocaleDateString()}</span><p>{review.body}</p></div><div className="admin-actions"><button className="small-admin-button approve" onClick={() => act(`/admin/reviews/${review._id}`, { approved: true }, 'Review published.')}>PUBLISH</button><button className="small-admin-button reject" onClick={() => act(`/admin/reviews/${review._id}`, { approved: false }, 'Review remains unpublished.')}>KEEP HIDDEN</button></div></article>)}{!reviews.length && <p className="admin-no-results">No reviews are waiting for moderation.</p>}</div>
}