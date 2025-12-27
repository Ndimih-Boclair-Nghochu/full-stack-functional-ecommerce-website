import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import Home from './pages/Home'
import AllProducts from './pages/AllProducts'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    axios.get('/api/products').then(res => setProducts(res.data))
  }, [])

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const toggleWishlist = (product) => {
    const existing = wishlist.find(item => item.id === product.id)
    if (existing) {
      setWishlist(wishlist.filter(item => item.id !== product.id))
    } else {
      setWishlist([...wishlist, product])
    }
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-yellow-500 hover:text-yellow-600 transition">
            MyShop
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/" className="text-gray-700 hover:text-purple-600 font-semibold transition">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-purple-600 font-semibold transition">
              All Products
            </Link>
            <Link to="/wishlist" className="text-gray-700 hover:text-purple-600 font-semibold transition flex items-center gap-1">
              ❤️ Wishlist ({wishlist.length})
            </Link>
            <Link to="/admin" className="text-gray-700 hover:text-purple-600 font-semibold transition flex items-center gap-1">
              👤 Admin
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/cart" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
              🛒 Cart ({cart.length}) - {total.toLocaleString()} XAF
            </Link>
          </div>
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/products" element={<AllProducts addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/wishlist" element={<Wishlist wishlist={wishlist} addToCart={addToCart} toggleWishlist={toggleWishlist} />} />
        <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} subtotal={subtotal} total={total} />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>

      {/* Footer */}
      <footer className="py-10 text-center text-gray-600 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-4">
            <span className="text-2xl font-bold text-yellow-500">MyShop</span>
          </div>
          <p className="text-gray-500 mb-4">Your one-stop shop for premium electronics and accessories</p>
          <div className="flex justify-center gap-6 mb-4">
            <Link to="/" className="text-gray-600 hover:text-purple-600 transition">Home</Link>
            <Link to="/products" className="text-gray-600 hover:text-purple-600 transition">Products</Link>
          </div>
          <p className="text-sm text-gray-400">© 2025 MyShop. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
