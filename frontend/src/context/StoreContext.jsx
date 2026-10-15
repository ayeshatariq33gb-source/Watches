import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StoreContext } from './store.js'
import { useAuth } from './useAuth.js'
import { addRemoteCartItem, addRemoteWishlistItem, fetchRemoteCart, fetchRemoteWishlist, removeRemoteCartItem, removeRemoteWishlistItem, replaceRemoteCart, replaceRemoteWishlist, updateRemoteCartItem } from '../api/store.js'

function readSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function StoreProvider({ children }) {
  const { token } = useAuth()
  const [cart, setCart] = useState(() => readSaved('maison-aurel-cart', []))
  const [wishlist, setWishlist] = useState(() => readSaved('maison-aurel-wishlist', []))
  const [syncError, setSyncError] = useState('')
  const [syncedToken, setSyncedToken] = useState('')
  const guestState = useRef({ cart, wishlist })
  useEffect(() => localStorage.setItem('maison-aurel-cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('maison-aurel-wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => { guestState.current = { cart, wishlist } }, [cart, wishlist])
  const reportSyncError = useCallback((error) => setSyncError(error.message || 'Could not sync with your account.'), [])

  useEffect(() => {
    function clearGuestState() {
      setCart([])
      setWishlist([])
      setSyncError('')
      setSyncedToken('')
    }
    window.addEventListener('maison-aurel:session-ended', clearGuestState)
    return () => window.removeEventListener('maison-aurel:session-ended', clearGuestState)
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    async function syncAccount() {
      try {
        const guestCart = guestState.current.cart
        const guestWishlist = guestState.current.wishlist
        let remoteCart = await fetchRemoteCart()
        if (!remoteCart.length && guestCart.length) remoteCart = await replaceRemoteCart(guestCart)
        if (active) setCart(remoteCart)

        let remoteWishlist = await fetchRemoteWishlist()
        if (!remoteWishlist.length && guestWishlist.length) remoteWishlist = await replaceRemoteWishlist(guestWishlist)
        if (active) { setWishlist(remoteWishlist); setSyncError('') }
      } catch (error) {
        if (active) reportSyncError(error)
      } finally {
        if (active) setSyncedToken(token)
      }
    }
    syncAccount()
    return () => { active = false }
  }, [token, reportSyncError])

  const addToCart = useCallback((product, quantity = 1) => {
    if (token) addRemoteCartItem(product.slug, quantity).then(() => setSyncError('')).catch(reportSyncError)
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { ...product, quantity }]
    })
  }, [token, reportSyncError])

  const updateQuantity = useCallback((id, quantity) => {
    const item = cart.find((entry) => entry.id === id)
    if (token && item) (quantity < 1 ? removeRemoteCartItem(item.slug) : updateRemoteCartItem(item.slug, quantity)).then(() => setSyncError('')).catch(reportSyncError)
    setCart((current) => {
      return quantity < 1 ? current.filter((entry) => entry.id !== id) : current.map((entry) => entry.id === id ? { ...entry, quantity } : entry)
    })
  }, [cart, token, reportSyncError])

  const removeFromCart = useCallback((id) => {
    const item = cart.find((entry) => entry.id === id)
    if (token && item) removeRemoteCartItem(item.slug).then(() => setSyncError('')).catch(reportSyncError)
    setCart((current) => current.filter((entry) => entry.id !== id))
  }, [cart, token, reportSyncError])

  const toggleWishlist = useCallback((product) => {
    const exists = wishlist.some((item) => item.id === product.id)
    if (token) (exists ? removeRemoteWishlistItem(product.slug) : addRemoteWishlistItem(product.slug)).then(() => setSyncError('')).catch(reportSyncError)
    setWishlist((current) => exists ? current.filter((item) => item.id !== product.id) : [...current, product])
  }, [wishlist, token, reportSyncError])

  const refreshCart = useCallback(async () => {
    const nextCart = await fetchRemoteCart()
    setCart(nextCart)
    return nextCart
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    if (token) replaceRemoteCart([]).catch(reportSyncError)
  }, [token, reportSyncError])

  const value = useMemo(() => ({
    cart, wishlist, syncError, isSyncing: Boolean(token && token !== syncedToken),
    addToCart, updateQuantity, removeFromCart, toggleWishlist, refreshCart, clearCart,
    isWishlisted: (id) => wishlist.some((item) => item.id === id),
  }), [cart, wishlist, syncError, token, syncedToken, addToCart, updateQuantity, removeFromCart, toggleWishlist, refreshCart, clearCart])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}