import React from 'react'

export default function Receipt({ order, onClose, onDownload }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      window.print()
    }
  }

  if (!order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">🧾 RECEIPT</h1>
              <p className="text-purple-100">Order Confirmation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-3xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-purple-200 mb-1">Order ID</p>
              <p className="font-mono font-bold text-lg">{order.id}</p>
            </div>
            <div>
              <p className="text-purple-200 mb-1">Date</p>
              <p className="font-semibold">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8">
          {/* Customer Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span> Customer Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-semibold text-gray-800">{order.buyer?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">{order.buyer?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold text-gray-800">{order.buyer?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivery Region</p>
                <p className="font-semibold text-gray-800">{order.region || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                <p className="font-semibold text-gray-800">{order.buyer?.address || 'N/A'}</p>
              </div>
              {order.buyer?.agencies && order.buyer.agencies.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Nearby Collection Agencies</p>
                  <div className="flex flex-wrap gap-2">
                    {order.buyer.agencies.map((agency, idx) => (
                      <span key={idx} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {agency}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📦</span> Order Items
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Variant</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Qty</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Price</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.selectedImageUrl || item.image || '/placeholder.png'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {item.selectedVariant || 'Default'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold">{item.quantity}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold">{item.price?.toLocaleString()} XAF</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-gray-800">
                          {(item.price * item.quantity).toLocaleString()} XAF
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💰</span> Order Summary
            </h2>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-800">
                    {order.totals?.subtotal?.toLocaleString() || '0'} XAF
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Shipping Fee</span>
                  <span className="font-bold text-gray-800">
                    {order.shippingFee > 0 ? `${order.shippingFee.toLocaleString()} XAF` : 'FREE'}
                  </span>
                </div>
                {order.shippingFee === 0 && order.totals?.subtotal > 50000 && (
                  <div className="text-sm text-green-600 flex items-center gap-2">
                    <span>🎉</span>
                    <span>Free shipping applied (order over 50,000 XAF in {order.region})</span>
                  </div>
                )}
                <div className="border-t-2 border-purple-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">TOTAL</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {order.totals?.total?.toLocaleString() || '0'} XAF
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span> Order Status
            </h2>
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`px-6 py-3 rounded-full text-white font-bold text-lg ${
                order.status === 'pending' ? 'bg-yellow-500' :
                order.status === 'processing' ? 'bg-blue-500' :
                order.status === 'shipped' ? 'bg-indigo-500' :
                order.status === 'delivered' ? 'bg-green-500' :
                'bg-red-500'
              }`}>
                {order.status?.toUpperCase() || 'PENDING'}
              </span>
              <div className="text-sm text-gray-600">
                {order.status === 'pending' && 'Your order is being processed'}
                {order.status === 'processing' && 'Your order is being prepared'}
                {order.status === 'shipped' && 'Your order is on the way'}
                {order.status === 'delivered' && 'Your order has been delivered'}
                {order.status === 'cancelled' && 'Your order has been cancelled'}
              </div>
            </div>
            
            {/* Delivery Agency */}
            {order.deliveryAgency && (order.status === 'delivered' || order.status === 'cancelled') && (
              <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  {order.status === 'delivered' ? '📍 Delivered to Agency:' : '📍 Available at Agency:'}
                </p>
                <p className="text-lg font-bold text-purple-600">{order.deliveryAgency}</p>
              </div>
            )}
          </div>

          {/* Cancellation Notice */}
          {order.status === 'cancelled' && (
            <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> Order Cancelled
              </h2>
              <p className="text-red-800 mb-3">
                Your order has been cancelled. Please contact our customer service with this receipt to process your refund.
              </p>
              <div className="bg-white border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">📞 Customer Service</p>
                <p className="text-sm text-gray-700">Email: support@myshop.com</p>
                <p className="text-sm text-gray-700">Phone: +237 XXX XXX XXX</p>
                <p className="text-sm text-red-600 mt-2 font-semibold">
                  Keep this receipt as proof for your refund request
                </p>
              </div>
            </div>
          )}

          {/* Footer Message */}
          <div className={`border rounded-lg p-6 ${
            order.status === 'cancelled' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className="text-center text-gray-700 mb-2">
              <span className={`font-bold ${order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}`}>
                {order.status === 'cancelled' ? 'Refund Processing Information' : 'Thank you for your purchase!'}
              </span>
            </p>
            <p className="text-center text-sm text-gray-600">
              For any questions or concerns, please contact our customer support.
            </p>
            <p className="text-center text-xs text-gray-500 mt-4">
              This is an official receipt for Order ID: {order.id}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-6 rounded-b-2xl flex gap-4 justify-end print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center gap-2"
          >
            <span>🖨️</span> Print Receipt
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition flex items-center gap-2"
          >
            <span>💾</span> Download PDF
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed > div {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .fixed > div, .fixed > div * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
