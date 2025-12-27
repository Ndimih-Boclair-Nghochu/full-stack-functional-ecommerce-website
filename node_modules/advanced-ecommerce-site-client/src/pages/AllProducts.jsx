import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function AllProducts({ addToCart, toggleWishlist, isInWishlist }) {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    axios.get('/api/products').then(res => {
      setProducts(res.data)
      setFilteredProducts(res.data)
    })
  }, [])

  useEffect(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [selectedCategory, searchTerm, products])

  const categories = ['All', ...new Set(products.map(p => p.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link to="/" className="inline-block mb-4 text-yellow-300 hover:text-yellow-100 transition">
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-4">All Products</h1>
          <p className="text-xl text-gray-100">Discover our complete collection of amazing products</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Search Products</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-bold transition ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Showing <span className="font-bold text-purple-600">{filteredProducts.length}</span> of <span className="font-bold">{products.length}</span> products
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="group bg-white rounded-xl shadow hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Image Container with Badges */}
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  {/* Variant thumbnails */}
                  {product.images && product.images.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-2 bg-white/70 rounded-lg p-2">
                      {product.images.slice(0,3).map(img => (
                        <img key={img.url} src={img.url} alt={img.color} className="w-7 h-7 object-cover rounded border" />
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
                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button className="opacity-0 group-hover:opacity-100 bg-white text-purple-600 px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-purple-600 hover:text-white transition transform scale-90 group-hover:scale-100">
                      👁️ Quick View
                    </button>
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

                  {/* Stock Indicator */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Available:</span>
                      <span className="font-bold">{product.stock} units</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full transition-all" 
                        style={{ width: `${Math.min((product.stock / 200) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-xl font-bold text-purple-600">{product.price.toLocaleString()} XAF</span>
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
                    className={`w-full py-2.5 rounded-lg font-bold transition ${
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
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
