import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Receipt from '../components/Receipt'

export default function OrderTracking() {
  const [orders, setOrders] = useState([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!email && !phone) {
      alert('Please enter your email or phone number')
      return
    }
    setLoading(true)
    try {
      const response = await axios.get('/api/orders/search', {
        params: { email, phone }
      })
      setOrders(response.data || [])
      setSearched(true)
    } catch (err) {
      alert('Failed to fetch orders. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12">
      {/* Receipt Modal */}
      {selectedOrder && (
        <Receipt 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
            <h1 className="text-4xl font-bold flex items-center gap-3 justify-center">
              📦 Track Your Orders
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Enter your email or phone number to view your order history and download receipts
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Your Orders</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : '🔍 Search Orders'}
              </button>
            </div>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            💡 Tip: You can use either your email or phone number to search
          </p>
        </div>

        {/* Orders List */}
        {searched && (
          <div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600">
                  We couldn't find any orders matching your information. Please check your email or phone number and try again.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Orders ({orders.length})
                  </h2>
                </div>
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <p className="text-sm text-purple-100 mb-1">Order ID</p>
                            <p className="font-mono font-bold text-lg">{order.id}</p>
                            <p className="text-sm text-purple-100 mt-2">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-purple-100 mb-1">Total Amount</p>
                            <p className="text-2xl font-bold">{order.totals?.total?.toLocaleString()} XAF</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* Cancellation Warning */}
                        {order.status === 'cancelled' && (
                          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                              <span>⚠️</span> Order Cancelled
                            </h3>
                            <p className="text-red-800 text-sm mb-2">
                              Your order has been cancelled. Contact customer service with your receipt to process your refund.
                            </p>
                            <p className="text-red-900 font-semibold text-sm">
                              📞 Customer Service: support@myshop.com
                            </p>
                          </div>
                        )}

                        {/* Delivery Agency Info */}
                        {order.deliveryAgency && (order.status === 'delivered' || order.status === 'cancelled') && (
                          <div className="mb-6 bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                            <p className="text-sm font-semibold text-purple-900 mb-1">
                              {order.status === 'delivered' ? '📍 Delivered to:' : '📍 Available at:'}
                            </p>
                            <p className="text-lg font-bold text-purple-600">{order.deliveryAgency}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Delivery Region</p>
                            <p className="font-semibold text-gray-900">{order.region}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Items</p>
                            <p className="font-semibold text-gray-900">{order.items?.length} item(s)</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Status</p>
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(order.status)}`}>
                              {order.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="mb-6">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Order Items:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {order.items?.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <img
                                  src={item.selectedImageUrl || item.image || '/placeholder.png'}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                            {order.items?.length > 4 && (
                              <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg">
                                <p className="text-sm font-semibold text-gray-600">+{order.items.length - 4} more</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-2"
                          >
                            <span>🧾</span> View Receipt
                          </button>
                          {order.status === 'pending' && (
                            <button
                              className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
                              title="Contact support to cancel"
                            >
                              Need Help?
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        {!searched && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 mt-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>💡</span> How to Track Your Order
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
              <div>
                <p className="font-bold mb-2">1. Enter Your Info</p>
                <p>Provide the email or phone number you used when placing your order.</p>
              </div>
              <div>
                <p className="font-bold mb-2">2. View Your Orders</p>
                <p>See all your orders with current status and delivery information.</p>
              </div>
              <div>
                <p className="font-bold mb-2">3. Download Receipt</p>
                <p>Access and download your order receipt anytime you need it.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
