import React from 'react'
import { Link } from 'react-router-dom'

export default function Wishlist({ wishlist, addToCart, toggleWishlist }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 via-red-600 to-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">❤️ My Wishlist</h1>
          <p className="text-xl text-gray-100">Your favorite products saved for later</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {wishlist.length > 0 ? (
          <>
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} in Your Wishlist
              </h2>
              <Link 
                to="/products" 
                className="text-purple-600 hover:text-purple-700 font-semibold transition"
              >
                Continue Shopping →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map(product => (
                <div key={product.id} className="group bg-white rounded-xl shadow hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                  {/* Remove Button */}
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-3 right-3 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition"
                    title="Remove from Wishlist"
                  >
                    <span className="text-2xl">❌</span>
                  </button>

                  {/* Image Container with Badges */}
                  <div className="relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    {/* Status Badges */}
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      {product.isNew && (
                        <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                          🆕 New
                        </span>
                      )}
                      {product.mostOrdered && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          🔥 Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 transition line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex text-yellow-400 text-sm">
                        {'⭐'.repeat(5)}
                      </div>
                      <span className="text-xs text-gray-500">(4.8)</span>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-3">
                      {product.stock > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-sm font-bold">✓ In Stock</span>
                          <span className="text-gray-500 text-xs">({product.stock} available)</span>
                        </div>
                      ) : (
                        <span className="text-red-600 text-sm font-bold">✗ Out of Stock</span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-purple-600">{product.price.toLocaleString()} XAF</span>
                      <p className="text-xs text-gray-500">Free shipping</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          addToCart(product)
                          toggleWishlist(product)
                        }}
                        disabled={product.stock === 0}
                        className={`flex-1 py-2.5 rounded-lg font-bold transition ${
                          product.stock > 0 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Shop?</h3>
              <p className="text-gray-600 mb-6">Add all wishlist items to your cart or continue browsing</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    wishlist.forEach(product => {
                      if (product.stock > 0) {
                        addToCart(product)
                      }
                    })
                    // Clear wishlist after adding to cart
                    wishlist.forEach(product => toggleWishlist(product))
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition"
                >
                  🛒 Add All to Cart
                </button>
                <Link
                  to="/products"
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">💔</div>
            <h2 className="text-3xl font-bold text-gray-700 mb-4">Your Wishlist is Empty</h2>
            <p className="text-gray-500 mb-8 text-lg">Save your favorite items here for easy access later</p>
            <Link 
              to="/products" 
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
