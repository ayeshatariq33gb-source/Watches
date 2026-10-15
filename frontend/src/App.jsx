import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SiteLayout } from './components/SiteLayout.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { CollectionsPage } from './pages/CollectionsPage.jsx'
import { ProductPage } from './pages/ProductPage.jsx'
import { SavedPage } from './pages/SavedPage.jsx'
import { CartPage } from './pages/CartPage.jsx'
import { AccountPage } from './pages/AccountPage.jsx'
import { UserDashboardPage } from './pages/UserDashboardPage.jsx'
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx'
import { CheckoutPage } from './pages/CheckoutPage.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import './App.css'
import './account.css'

export default function App() {
  return <BrowserRouter><AuthProvider><StoreProvider><Routes><Route element={<SiteLayout />}><Route index element={<HomePage />} /><Route path="collections" element={<CollectionsPage />} /><Route path="product/:slug" element={<ProductPage />} /><Route path="wishlist" element={<SavedPage />} /><Route path="cart" element={<CartPage />} /><Route path="account" element={<AccountPage />} /><Route element={<ProtectedRoute role="user" />}><Route path="dashboard" element={<UserDashboardPage />} /><Route path="checkout" element={<CheckoutPage />} /></Route><Route element={<ProtectedRoute role="admin" />}><Route path="admin" element={<AdminDashboardPage />} /></Route><Route path="*" element={<HomePage />} /></Route></Routes></StoreProvider></AuthProvider></BrowserRouter>
}
