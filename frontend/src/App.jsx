import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SiteLayout } from './components/SiteLayout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import './App.css'
import './account.css'

const HomePage = lazy(() => import('./pages/HomePage.jsx').then((module) => ({ default: module.HomePage })))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage.jsx').then((module) => ({ default: module.CollectionsPage })))
const ProductPage = lazy(() => import('./pages/ProductPage.jsx').then((module) => ({ default: module.ProductPage })))
const SavedPage = lazy(() => import('./pages/SavedPage.jsx').then((module) => ({ default: module.SavedPage })))
const CartPage = lazy(() => import('./pages/CartPage.jsx').then((module) => ({ default: module.CartPage })))
const AccountPage = lazy(() => import('./pages/AccountPage.jsx').then((module) => ({ default: module.AccountPage })))
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage.jsx').then((module) => ({ default: module.UserDashboardPage })))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx').then((module) => ({ default: module.AdminDashboardPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx').then((module) => ({ default: module.CheckoutPage })))

export default function App() {
  return <BrowserRouter><AuthProvider><StoreProvider><Suspense fallback={<div className="route-loading" role="status">LOADING MAISON AUREL…</div>}><Routes><Route element={<SiteLayout />}><Route index element={<HomePage />} /><Route path="collections" element={<CollectionsPage />} /><Route path="product/:slug" element={<ProductPage />} /><Route path="wishlist" element={<SavedPage />} /><Route path="cart" element={<CartPage />} /><Route path="account" element={<AccountPage />} /><Route path="admin/login" element={<AccountPage />} /><Route element={<ProtectedRoute role="user" />}><Route path="dashboard" element={<UserDashboardPage />} /><Route path="checkout" element={<CheckoutPage />} /></Route><Route element={<ProtectedRoute role="admin" />}><Route path="admin" element={<AdminDashboardPage />} /></Route><Route path="*" element={<HomePage />} /></Route></Routes></Suspense></StoreProvider></AuthProvider></BrowserRouter>
}
