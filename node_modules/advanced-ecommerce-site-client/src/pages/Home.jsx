import React from 'react'
import { Link } from 'react-router-dom'

export default function Home({ products, addToCart, toggleWishlist, isInWishlist }) {
  // Show only 9 featured products (mix of most ordered and new)
  const featuredProducts = products
    .filter(p => p.mostOrdered || p.isNew)
    .slice(0, 9)

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
            <span className="font-bold">✨ New Arrivals 🎉</span>
          </div>
          <h1 className="text-6xl font-bold mb-6">
            Discover <span className="text-yellow-300">Amazing</span> Products
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-100">
            Shop the best collection of premium products with free shipping on orders over 10,000 XAF
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/products" className="btn btn-yellow text-lg px-8 py-3">
              Shop Now →
            </Link>
            <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 transition">
              Learn More
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">1000+</div>
              <div className="text-sm">Products</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">24h</div>
              <div className="text-sm">Shipping</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">5⭐</div>
              <div className="text-sm">Rated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Get your orders delivered within 24-48 hours</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">💳</div>
              <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">100% secure payment methods</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="font-bold text-lg mb-2">Easy Returns</h3>
              <p className="text-gray-600 text-sm">30-day return policy on all items</p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="font-bold text-lg mb-2">Gift Cards</h3>
              <p className="text-gray-600 text-sm">Perfect gift for your loved ones</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 text-lg">Handpicked selection of our most popular and newest items</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <div key={product.id} className="group bg-white rounded-xl shadow hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Image Container with Badges */}
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  {/* Variant thumbnails */}
                  {product.images && product.images.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-2 bg-white/70 rounded-lg p-2">
                      {product.images.slice(0,3).map(img => (
                        <img key={img.url} src={img.url} alt={img.color} className="w-8 h-8 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  {/* Status Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
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
                    {product.stock > 0 ? (
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        In Stock
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  {/* Quick Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button className="opacity-0 group-hover:opacity-100 bg-white text-purple-600 px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-purple-600 hover:text-white transition">
                      👁️ Quick View
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 group-hover:text-purple-600 transition">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-400">
                      {'⭐'.repeat(5)}
                    </div>
                    <span className="text-sm text-gray-500">(4.8)</span>
                  </div>

                  {/* Stock Indicator */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Available:</span>
                      <span className="font-bold">{product.stock} units</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-2xl font-bold text-purple-600">{product.price.toLocaleString()} XAF</span>
                      <p className="text-xs text-gray-500">Free shipping</p>
                    </div>
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className={`p-2 rounded-lg transition ${
                        isInWishlist(product.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                      }`}
                      title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      {isInWishlist(product.id) ? '❤️' : '🤍'}
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      product.stock > 0 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link 
              to="/products" 
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg hover:shadow-xl"
            >
              View All Products ({products.length}) →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-purple-100 text-purple-600 px-4 py-2 rounded-full font-bold mb-4">
              Why Choose Us
            </div>
            <h2 className="text-4xl font-bold mb-4">Experience Shopping Excellence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border-l-4 border-purple-600">
              <div className="text-3xl mb-3">✓</div>
              <h3 className="font-bold text-lg mb-2">Premium Quality</h3>
              <p className="text-gray-600 text-sm">Only the best products make it to our store</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border-l-4 border-indigo-600">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-bold text-lg mb-2">Best Prices</h3>
              <p className="text-gray-600 text-sm">Competitive pricing guaranteed</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border-l-4 border-blue-600">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-bold text-lg mb-2">Customer Support</h3>
              <p className="text-gray-600 text-sm">24/7 dedicated support team</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border-l-4 border-green-600">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-bold text-lg mb-2">Secure Shopping</h3>
              <p className="text-gray-600 text-sm">Your data is always protected</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-sm opacity-90">Quality Products</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-sm opacity-90">Happy Customers</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-sm opacity-90">Satisfaction Rate</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-90">Expert Support</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
