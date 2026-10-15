import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { money } from '../data/products.js'
import { useStore } from '../context/useStore.js'

export function CartPage() {
  const { cart, updateQuantity, removeFromCart, syncError } = useStore()
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  return <section className="section-shell cart-page">
    <span className="eyebrow">A MOMENT, MADE YOURS</span>
    <h1>Your <em>bag.</em></h1>
    {syncError && <p className="account-error" role="status">Your bag is saved here, but account sync needs attention: {syncError}</p>}
    {cart.length ? <div className="cart-layout">
      <div className="cart-items">{cart.map((item) => <article className="cart-item" key={item.id}>
        <Link to={`/product/${item.slug}`} className="cart-item-image"><img src={item.image} alt={item.name} /></Link>
        <div className="cart-item-copy"><span className="eyebrow">{item.brand}</span><Link to={`/product/${item.slug}`}><h2>{item.name}</h2></Link><p>{money(item.price)}</p>
          <div className="quantity-control"><button aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button></div>
        </div>
        <div className="cart-item-total"><strong>{money(item.price * item.quantity)}</strong><button className="remove-item" aria-label={`Remove ${item.name} from bag`} onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button></div>
      </article>)}</div>
      <aside className="order-summary"><span className="eyebrow">A FEW DETAILS</span><h2>Order summary</h2><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Shipping</span><span>Complimentary</span></div><div><span>Estimated taxes</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><strong>{money(subtotal)}</strong></div><Link className="button button-dark checkout-button" to="/checkout">CONTINUE TO CHECKOUT <span>→</span></Link><p>Secure order submission · Payment awaits approval</p><Link to="/collections" className="continue-shopping">CONTINUE EXPLORING</Link></aside>
+    </div> : <div className="empty-state"><ShoppingBag size={29} /><h2>Nothing in your bag. Yet.</h2><p>Take your time. The right one is worth waiting for.</p><Link to="/collections" className="button button-dark">Discover the collection</Link></div>}
+  </section>
}
