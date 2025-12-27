import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Receipt from '../components/Receipt'

export default function Cart({ cart, removeFromCart, updateQuantity, clearCart, subtotal, total }) {
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('Douala')
  const [shippingFees, setShippingFees] = useState({})
  const [selectedVariants, setSelectedVariants] = useState({})
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    agencies: ['', '', '']
  })
  const [orderReceipt, setOrderReceipt] = useState(null)

  useEffect(() => {
    axios.get('/api/shipping-fees').then(res => {
      setShippingFees(res.data || {})
      const keys = Object.keys(res.data || {})
      if (keys.length && !keys.includes(selectedRegion)) setSelectedRegion(keys[0])
    }).catch(() => {})
  }, [])

  // Calculate shipping based on selected region
  const regionShipping = Number(shippingFees[selectedRegion] ?? 0)
  const finalShipping = subtotal > 50000 && selectedRegion === 'Douala' ? 0 : regionShipping
  const finalTotal = subtotal + finalShipping

  // Check if region is out of city and show modal
  useEffect(() => {
    if (selectedRegion !== 'Douala' && cart.length > 0) {
      setShowSignupModal(true)
    }
  }, [selectedRegion, cart.length])

  const handleVariantChange = (itemId, variant) => {
    setSelectedVariants({ ...selectedVariants, [itemId]: variant })
  }

  const handleQuantityChange = (itemId, currentQty, change) => {
    const newQty = currentQty + change
    if (newQty > 0) {
      updateQuantity(itemId, newQty)
    }
  }

  const handleInputChange = (itemId, value) => {
    const newQty = parseInt(value) || 1
    updateQuantity(itemId, newQty)
  }

  const handleBuyerInfoChange = (field, value) => {
    setBuyerInfo({ ...buyerInfo, [field]: value })
  }

  const handleCheckout = async () => {
    if (!buyerInfo.name || !buyerInfo.email || !buyerInfo.phone || !buyerInfo.address) {
      alert('Please fill in all your information before checkout')
      return
    }
    const filledAgencies = buyerInfo.agencies.filter(a => a.trim() !== '')
    if (filledAgencies.length < 3) {
      alert('Please provide at least 3 nearby agencies for delivery')
      return
    }
    try {
      const payload = {
        buyer: { ...buyerInfo, agencies: filledAgencies },
        region: selectedRegion,
        shippingFee: finalShipping,
        totals: { subtotal, total: finalTotal },
        items: cart.map(item => {
          const variant = selectedVariants[item.id] || (item.images?.[0] ? { color: item.images[0].color, url: item.images[0].url } : { color: 'default', url: item.image })
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedVariant: variant.color,
            selectedImageUrl: variant.url,
            image: item.image
          }
        })
      }
      const resp = await axios.post('/api/orders', payload)
      setOrderReceipt(resp.data)
      clearCart()
    } catch (err) {
      alert('Failed to place order')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12">
      {/* Receipt Modal */}
      {orderReceipt && (
        <Receipt 
          order={orderReceipt} 
          onClose={() => setOrderReceipt(null)}
        />
      )}

      {/* Signup Modal for Out-of-City Customers */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Out-of-City Delivery</h2>
              <p className="text-gray-600">
                You've selected <span className="font-bold text-purple-600">{selectedRegion}</span>
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-purple-800 mb-2">📋 Track Your Order</h3>
              <p className="text-sm text-gray-700 mb-3">
                For deliveries outside Douala, we recommend signing up to track your package in real-time.
              </p>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                <li>✓ Real-time tracking updates</li>
                <li>✓ SMS & Email notifications</li>
                <li>✓ Estimated delivery date</li>
                <li>✓ Order history</li>
              </ul>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowSignupModal(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition"
              >
                Sign Up & Track Order
              </button>
              <button
                onClick={() => setShowSignupModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
            <h1 className="text-4xl font-bold flex items-center gap-3 justify-center">
              🛒 Shopping Cart
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {cart.length === 0 ? 'Your cart is empty' : `You have ${cart.length} ${cart.length === 1 ? 'item' : 'items'} in your cart`}
          </p>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link 
              to="/products" 
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Clear Cart Button */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Cart Items</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2 hover:underline transition"
                >
                  🗑️ Clear Cart
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="flex gap-4 p-4">
                    {/* Product Image */}
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                              {item.category}
                            </span>
                            {item.stock > 0 ? (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                                ✓ In Stock
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                                ✗ Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          title="Remove from cart"
                        >
                          <span className="text-2xl">×</span>
                        </button>
                      </div>

                      {/* Price and Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 font-semibold">Quantity:</span>
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-purple-600 hover:text-white transition-colors font-bold text-purple-600"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleInputChange(item.id, e.target.value)}
                              className="w-16 text-center bg-white border-0 rounded-lg font-semibold text-gray-800"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-purple-600 hover:text-white transition-colors font-bold text-purple-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {item.price.toLocaleString()} XAF × {item.quantity}
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            {(item.price * item.quantity).toLocaleString()} XAF
                          </div>
                        </div>

                        {/* Variant selection */}
                        {item.images && item.images.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Variant</label>
                            <div className="flex flex-wrap gap-3 items-center">
                              {item.images.map(img => (
                                <button key={img.url} onClick={() => handleVariantChange(item.id, { color: img.color, url: img.url })} className={`border rounded-lg overflow-hidden ${selectedVariants[item.id]?.url === img.url ? 'ring-2 ring-purple-600' : ''}`}>
                                  <img src={img.url} alt={img.color} className="w-20 h-20 object-cover" />
                                  <div className="text-xs text-center py-1">{img.color || 'default'}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping Button */}
              <Link
                to="/products"
                className="inline-block mt-6 text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2 hover:underline transition"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Buyer Information & Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Buyer Information Form */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Your Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={buyerInfo.name}
                      onChange={(e) => handleBuyerInfoChange('name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={buyerInfo.email}
                      onChange={(e) => handleBuyerInfoChange('email', e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={buyerInfo.phone}
                      onChange={(e) => handleBuyerInfoChange('phone', e.target.value)}
                      placeholder="+237 6XX XX XX XX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      value={buyerInfo.address}
                      onChange={(e) => handleBuyerInfoChange('address', e.target.value)}
                      placeholder="Street, Neighborhood, Building details..."
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  
                  {/* Nearby Agencies */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏢 Nearby Agencies (At least 3 required) *
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Provide 3 nearby agencies where you can collect your order
                    </p>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="mb-3">
                        <input
                          type="text"
                          value={buyerInfo.agencies[index] || ''}
                          onChange={(e) => {
                            const newAgencies = [...buyerInfo.agencies]
                            newAgencies[index] = e.target.value
                            handleBuyerInfoChange('agencies', newAgencies)
                          }}
                          placeholder={`Agency ${index + 1} (e.g., Express Union Bonanjo)`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🌍 Delivery Region *
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    >
                      {Object.keys(shippingFees).map((region) => (
                        <option key={region} value={region}>
                          {region} {Number(shippingFees[region] || 0) > 0 ? `(+${Number(shippingFees[region]).toLocaleString()} XAF)` : '(Free in city)'}
                        </option>
                      ))}
                    </select>
                    {selectedRegion !== 'Douala' && (
                      <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Out-of-city delivery - signup recommended for tracking</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
                
                {/* Summary Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-semibold">{subtotal.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping ({selectedRegion})</span>
                    <span className="font-semibold">
                      {finalShipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        <span>{finalShipping.toLocaleString()} XAF</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Free Shipping Progress */}
                  {selectedRegion === 'Douala' && finalShipping > 0 && subtotal < 50000 && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-2">
                        Add {(50000 - subtotal).toLocaleString()} XAF more for FREE shipping! 🚚
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((subtotal / 50000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {selectedRegion !== 'Douala' && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-blue-600 flex items-center gap-2">
                        <span>📍</span>
                        <span>Regional delivery: 3-5 business days</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Total</span>
                    <span className="text-3xl font-bold text-purple-600">
                      {finalTotal.toLocaleString()} XAF
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg mb-4"
                >
                  Complete Order 🔒
                </button>

                {/* Payment Methods */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">We accept</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <span className="bg-gray-100 px-3 py-1 rounded text-xs font-semibold text-gray-700">💳 Card</span>
                    <span className="bg-gray-100 px-3 py-1 rounded text-xs font-semibold text-gray-700">📱 Mobile Money</span>
                    <span className="bg-gray-100 px-3 py-1 rounded text-xs font-semibold text-gray-700">💰 Cash</span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">🔒</span>
                    <span>Secure Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
