import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Receipt from '../components/Receipt'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [subAdmins, setSubAdmins] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [showSubAdminForm, setShowSubAdminForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingSubAdminId, setEditingSubAdminId] = useState(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [shippingFees, setShippingFees] = useState({})
  const [shippingForm, setShippingForm] = useState({})
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [orders, setOrders] = useState([])
  const [newTown, setNewTown] = useState('')
  const [newTownFee, setNewTownFee] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [mainShopTown, setMainShopTown] = useState('Douala')

  const shippingKeys = Object.keys(shippingForm || {})

  const [productForm, setProductForm] = useState({
    name: '', price: '', description: '', stock: '', 
    category: 'Electronics', image: '', mostOrdered: false, isNew: false,
    availableRegions: ['ALL'],
    images: [{ color: 'default', url: '' }]
  })

  const [subAdminForm, setSubAdminForm] = useState({
    name: '', email: '', password: '', permissions: ['products']
  })

  const [settingsForm, setSettingsForm] = useState({
    email: '', currentPassword: '', newPassword: ''
  })

  const token = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }
    setAdminEmail(localStorage.getItem('adminEmail') || '')
    fetchProducts()
    fetchSubAdmins()
    fetchShippingFees()
    fetchOrders()
  }, [token, navigate])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin')
      }
    }
  }

  const fetchSubAdmins = async () => {
    try {
      const response = await axios.get('/api/admin/sub-admins', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubAdmins(response.data)
    } catch (err) {
      console.error('Failed to fetch sub-admins:', err)
    }
  }

  const fetchShippingFees = async () => {
    try {
      const response = await axios.get('/api/admin/shipping-fees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShippingFees(response.data)
      setShippingForm(response.data)
    } catch (err) {
      console.error('Failed to fetch shipping fees:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(response.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingProductId) {
        await axios.put(`/api/admin/products/${editingProductId}`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Product updated successfully' })
      } else {
        await axios.post('/api/admin/products', productForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Product created successfully' })
      }
      setProductForm({ name: '', price: '', description: '', stock: '', category: 'Electronics', image: '', mostOrdered: false, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: '' }] })
      setEditingProductId(null)
      setShowProductForm(false)
      fetchProducts()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save product' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleSubAdminSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingSubAdminId) {
        await axios.put(`/api/admin/sub-admins/${editingSubAdminId}`, 
          { name: subAdminForm.name, permissions: subAdminForm.permissions },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMessage({ type: 'success', text: 'Sub-admin updated successfully' })
      } else {
        await axios.post('/api/admin/sub-admins', subAdminForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessage({ type: 'success', text: 'Sub-admin created successfully' })
      }
      setSubAdminForm({ name: '', email: '', password: '', permissions: ['products'] })
      setEditingSubAdminId(null)
      setShowSubAdminForm(false)
      fetchSubAdmins()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save sub-admin' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Product deleted successfully' })
      fetchProducts()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete product' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDeleteSubAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return
    try {
      await axios.delete(`/api/admin/sub-admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage({ type: 'success', text: 'Sub-admin deleted successfully' })
      fetchSubAdmins()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete sub-admin' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      stock: product.stock || '',
      category: product.category || 'Electronics',
      image: product.image || '',
      mostOrdered: !!product.mostOrdered,
      isNew: !!product.isNew,
      availableRegions: product.availableRegions && product.availableRegions.length ? product.availableRegions : ['ALL'],
      images: product.images && product.images.length ? product.images : [{ color: 'default', url: product.image || '' }]
    })
    setEditingProductId(product.id)
    setShowProductForm(true)
  }

  const handleEditSubAdmin = (subAdmin) => {
    setSubAdminForm({ name: subAdmin.name, email: subAdmin.email, password: '', permissions: subAdmin.permissions })
    setEditingSubAdminId(subAdmin.id)
    setShowSubAdminForm(true)
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put('/api/admin/settings', 
        { email: settingsForm.email || undefined, password: settingsForm.newPassword || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (settingsForm.email) {
        localStorage.setItem('adminEmail', settingsForm.email)
        setAdminEmail(settingsForm.email)
      }
      setMessage({ type: 'success', text: 'Settings updated successfully' })
      setSettingsForm({ email: '', currentPassword: '', newPassword: '' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminEmail')
    navigate('/admin')
  }

  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    electronics: products.filter(p => p.category === 'Electronics').length,
    accessories: products.filter(p => p.category === 'Accessories').length,
    totalSubAdmins: subAdmins.length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-300 text-sm mt-1">Manage your e-commerce platform</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-300">Logged in as</p>
              <p className="font-semibold">{adminEmail}</p>
            </div>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['overview', 'products', 'shipping', 'orders', 'sub-admins', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-semibold border-b-2 transition ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'products' && '📦 Products'}
                {tab === 'shipping' && '🚚 Shipping'}
                {tab === 'orders' && '🧾 Orders'}
                {tab === 'sub-admins' && '👥 Sub-Admins'}
                {tab === 'settings' && '⚙️ Settings'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mx-6 mt-4 p-4 rounded-lg font-semibold ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard icon="📦" label="Total Products" value={stats.totalProducts} color="blue" />
              <StatCard icon="💰" label="Inventory Value" value={`XAF ${stats.totalValue.toLocaleString()}`} color="green" />
              <StatCard icon="🖥️" label="Electronics" value={stats.electronics} color="purple" />
              <StatCard icon="🎯" label="Accessories" value={stats.accessories} color="orange" />
              <StatCard icon="👥" label="Sub-Admins" value={stats.totalSubAdmins} color="red" />
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => { setActiveTab('products'); setShowProductForm(true); }} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
                      ➕ Add New Product
                    </button>
                    <button onClick={() => { setActiveTab('sub-admins'); setShowSubAdminForm(true); }} 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition">
                      ➕ Add Sub-Admin
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-4">Platform Status</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> <strong>All Systems</strong> Operational</p>
                    <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> <strong>Database</strong> Connected</p>
                    <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> <strong>API</strong> Running</p>
                    <p className="text-gray-600 mt-4">Last updated: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
              {!showProductForm && (
                <button onClick={() => { setShowProductForm(true); setEditingProductId(null); setProductForm({ name: '', price: '', description: '', stock: '', category: 'Electronics', image: '', mostOrdered: false, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: '' }] }); }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                  ➕ Add Product
                </button>
              )}
            </div>

            {showProductForm && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <input type="number" placeholder="Price (XAF)" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} required className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} required className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option>Electronics</option>
                    <option>Accessories</option>
                  </select>
                  <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} required className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"></textarea>
                  <input type="url" placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({...productForm, image: e.target.value})} required className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.mostOrdered} onChange={(e) => setProductForm({...productForm, mostOrdered: e.target.checked})} className="w-5 h-5" />
                      <span>🔥 Most Ordered</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.isNew} onChange={(e) => setProductForm({...productForm, isNew: e.target.checked})} className="w-5 h-5" />
                      <span>🆕 New Product</span>
                    </label>
                  </div>
                  {/* Availability Regions */}
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-2">Availability by Region</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.availableRegions.includes('ALL')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProductForm({ ...productForm, availableRegions: ['ALL'] })
                            } else {
                              setProductForm({ ...productForm, availableRegions: [] })
                            }
                          }}
                          className="w-5 h-5"
                        />
                        <span className="font-semibold">All Regions</span>
                      </label>
                      {shippingKeys.map(region => (
                        <label key={region} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!productForm.availableRegions.includes('ALL') && productForm.availableRegions.includes(region)}
                            onChange={(e) => {
                              const current = new Set(productForm.availableRegions.filter(r => r !== 'ALL'))
                              if (e.target.checked) current.add(region)
                              else current.delete(region)
                              setProductForm({ ...productForm, availableRegions: Array.from(current) })
                            }}
                            className="w-5 h-5"
                          />
                          <span>{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Images per color */}
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-2">Images (per color variant)</label>
                    <div className="space-y-3">
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                          <input type="text" placeholder="Color" value={img.color} onChange={(e) => {
                            const arr = [...productForm.images]; arr[idx] = { ...arr[idx], color: e.target.value }; setProductForm({ ...productForm, images: arr })
                          }} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                          <input type="url" placeholder="Image URL" value={img.url} onChange={(e) => {
                            const arr = [...productForm.images]; arr[idx] = { ...arr[idx], url: e.target.value }; setProductForm({ ...productForm, images: arr })
                          }} className="md:col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                          <div className="flex gap-2">
                            <label className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg font-semibold cursor-pointer">
                              Upload
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  const resp = await axios.post('/api/admin/upload', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
                                  const arr = [...productForm.images]; arr[idx] = { ...arr[idx], url: resp.data.url }; setProductForm({ ...productForm, images: arr })
                                  setMessage({ type: 'success', text: 'Image uploaded' })
                                  setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                                } catch (err) {
                                  setMessage({ type: 'error', text: 'Upload failed' })
                                  setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                                }
                              }} />
                            </label>
                            {productForm.images.length > 1 && (
                              <button type="button" onClick={() => {
                                const arr = [...productForm.images]; arr.splice(idx, 1); setProductForm({ ...productForm, images: arr })
                              }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold">Remove</button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setProductForm({ ...productForm, images: [...productForm.images, { color: '', url: '' }] })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Add Image</button>
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">
                      {editingProductId ? 'Update Product' : 'Create Product'}
                    </button>
                    <button type="button" onClick={() => { setShowProductForm(false); setEditingProductId(null); }} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <div className="flex gap-2 mb-2">
                      {product.mostOrdered && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">🔥 Popular</span>}
                      {product.isNew && <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">🆕 New</span>}
                    </div>
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{product.description}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">XAF {product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock} | {product.category}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEditProduct(product)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHIPPING TAB */}
        {activeTab === 'shipping' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Shipping Fees (Cameroon)</h2>
              <button onClick={fetchShippingFees} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold">Refresh</button>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8">
              {/* Main Shop Location Section */}
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🏪 Main Shop Location</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-80">
                    <label className="block font-semibold text-gray-700 mb-2">Select Main Town</label>
                    <select 
                      value={mainShopTown} 
                      onChange={(e) => setMainShopTown(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    >
                      {shippingKeys.length === 0 ? (
                        <option>No towns available</option>
                      ) : (
                        shippingKeys.map(town => (
                          <option key={town} value={town}>{town}</option>
                        ))
                      )}
                    </select>
                    <p className="text-sm text-gray-600 mt-2">
                      💡 This is where your main shop is based. Free shipping available for orders over 50,000 XAF in this town.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-1">Current Main Location</p>
                    <p className="text-2xl font-bold text-purple-600">{mainShopTown}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                setLoadingShipping(true)
                try {
                  const payload = {}
                  for (const region of shippingKeys) {
                    const val = Number(shippingForm[region] ?? 0)
                    payload[region] = isNaN(val) ? 0 : val
                  }
                  await axios.put('/api/admin/shipping-fees', payload, { headers: { Authorization: `Bearer ${token}` } })
                  setMessage({ type: 'success', text: 'Shipping fees updated' })
                  fetchShippingFees()
                } catch (err) {
                  setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update fees' })
                } finally {
                  setLoadingShipping(false)
                  setTimeout(() => setMessage({ type: '', text: '' }), 3000)
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {shippingKeys.map(region => (
                    <div key={region} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block font-semibold text-gray-700">{region}</label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete ${region}? This will remove it permanently.`)) {
                              try {
                                const updated = { ...shippingForm }
                                delete updated[region]
                                await axios.put('/api/admin/shipping-fees', updated, { headers: { Authorization: `Bearer ${token}` } })
                                setMessage({ type: 'success', text: `Deleted ${region}` })
                                if (mainShopTown === region) setMainShopTown(Object.keys(updated)[0] || 'Douala')
                                fetchShippingFees()
                              } catch (err) {
                                setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete town' })
                              } finally {
                                setTimeout(() => setMessage({ type: '', text: '' }), 3000)
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition text-sm font-semibold"
                          title={`Delete ${region}`}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <input type="number" value={shippingForm[region] ?? 0} onChange={(e) => setShippingForm({ ...shippingForm, [region]: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      <p className="text-sm text-gray-500 mt-1">XAF</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3">Add New Town</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Town name" value={newTown} onChange={(e) => setNewTown(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="number" placeholder="Fee (XAF)" value={newTownFee} onChange={(e) => setNewTownFee(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <button type="button" onClick={async () => {
                      if (!newTown) return
                      try {
                        await axios.put('/api/admin/shipping-fees', { [newTown]: Number(newTownFee || 0) }, { headers: { Authorization: `Bearer ${token}` } })
                        setMessage({ type: 'success', text: `Added ${newTown}` })
                        setNewTown(''); setNewTownFee(''); fetchShippingFees()
                      } catch (err) {
                        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add town' })
                      } finally {
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
                      }
                    }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">Add Town</button>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="submit" disabled={loadingShipping} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50">Save Fees</button>
                  <button type="button" onClick={() => setShippingForm(shippingFees)} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition">Reset</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <button onClick={fetchOrders} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold">Refresh</button>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Buyer</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Region</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Items</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Total</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-600">No orders yet.</td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{order.buyer?.name}</div>
                          <div className="text-sm text-gray-600">{order.buyer?.phone}</div>
                          <div className="text-sm text-gray-600">{order.buyer?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{order.region}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{order.items?.length} item(s)</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">XAF {(order.totals?.total || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <select value={order.status} onChange={async (e) => {
                            const newStatus = e.target.value
                            let deliveryAgency = order.deliveryAgency || ''
                            
                            // If status is delivered or cancelled, ask for agency
                            if (newStatus === 'delivered' || newStatus === 'cancelled') {
                              const agencies = order.buyer?.agencies || []
                              if (agencies.length > 0) {
                                const agencyOptions = agencies.map((ag, i) => `${i + 1}. ${ag}`).join('\n')
                                const choice = prompt(`Select delivery agency:\n${agencyOptions}\n\nEnter the number (1-${agencies.length}):`)
                                const index = parseInt(choice) - 1
                                if (index >= 0 && index < agencies.length) {
                                  deliveryAgency = agencies[index]
                                } else {
                                  alert('Invalid selection. Please try again.')
                                  return
                                }
                              }
                            }
                            
                            try {
                              const resp = await axios.put(`/api/admin/orders/${order.id}`, { status: newStatus, deliveryAgency }, { headers: { Authorization: `Bearer ${token}` } })
                              setOrders(orders.map(o => o.id === order.id ? resp.data : o))
                            } catch (err) { setMessage({ type: 'error', text: 'Failed to update status' }); setTimeout(() => setMessage({ type: '', text: '' }), 2000) }
                          }} className="px-3 py-2 border border-gray-300 rounded-lg">
                            {['pending','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => setViewOrder(order)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition">View</button>
                          <button onClick={() => setReceiptOrder(order)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition">Receipt</button>
                          <button onClick={async () => {
                            if (!window.confirm('Delete this order?')) return
                            try {
                              await axios.delete(`/api/admin/orders/${order.id}`, { headers: { Authorization: `Bearer ${token}` } })
                              setOrders(orders.filter(o => o.id !== order.id))
                            } catch (err) { setMessage({ type: 'error', text: 'Failed to delete' }); setTimeout(() => setMessage({ type: '', text: '' }), 2000) }
                          }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {receiptOrder && (
          <Receipt 
            order={receiptOrder} 
            onClose={() => setReceiptOrder(null)}
          />
        )}

        {/* Order Detail Modal */}
        {viewOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative">
              <button onClick={() => setViewOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Buyer</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Name:</span> {viewOrder.buyer?.name}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {viewOrder.buyer?.email}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {viewOrder.buyer?.phone}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Address:</span> {viewOrder.buyer?.address}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Region:</span> {viewOrder.region}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Summary</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Subtotal:</span> XAF {(viewOrder.totals?.subtotal || 0).toLocaleString()}</p>

                  <p className="text-sm text-gray-700"><span className="font-semibold">Shipping:</span> XAF {(viewOrder.shippingFee || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Total:</span> XAF {(viewOrder.totals?.total || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> {viewOrder.status}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-3">Items</h4>
                <div className="space-y-3">
                  {viewOrder.items?.map(it => (
                    <div key={`${it.id}-${it.selectedImageUrl}`} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                      <img src={it.selectedImageUrl || it.image} alt={it.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{it.name}</div>
                        <div className="text-sm text-gray-600">Variant: {it.selectedVariant || 'default'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{it.price.toLocaleString()} XAF × {it.quantity}</div>
                        <div className="font-bold text-gray-900">XAF {(it.price * it.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-ADMINS TAB */}
        {activeTab === 'sub-admins' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h2>
              {!showSubAdminForm && (
                <button onClick={() => { setShowSubAdminForm(true); setEditingSubAdminId(null); setSubAdminForm({ name: '', email: '', password: '', permissions: ['products'] }); }} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                  ➕ Add Sub-Admin
                </button>
              )}
            </div>

            {showSubAdminForm && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{editingSubAdminId ? 'Edit Sub-Admin' : 'Add New Sub-Admin'}</h3>
                <form onSubmit={handleSubAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="Name" value={subAdminForm.name} onChange={(e) => setSubAdminForm({...subAdminForm, name: e.target.value})} required className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600" />
                  {!editingSubAdminId && (
                    <>
                      <input type="email" placeholder="Email" value={subAdminForm.email} onChange={(e) => setSubAdminForm({...subAdminForm, email: e.target.value})} required className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600" />
                      <input type="password" placeholder="Password" value={subAdminForm.password} onChange={(e) => setSubAdminForm({...subAdminForm, password: e.target.value})} required className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600" />
                    </>
                  )}
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-3">Permissions (Sub-admins cannot access financial data)</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={subAdminForm.permissions.includes('products')} onChange={(e) => {
                          if (e.target.checked) {
                            setSubAdminForm({...subAdminForm, permissions: [...subAdminForm.permissions, 'products']})
                          } else {
                            setSubAdminForm({...subAdminForm, permissions: subAdminForm.permissions.filter(p => p !== 'products')})
                          }
                        }} className="w-5 h-5" />
                        <span className="font-semibold">📦 Manage Products</span>
                        <span className="text-gray-600">(Add, Edit, Delete)</span>
                      </label>
                      <p className="text-sm text-gray-600 ml-7">✓ Products management</p>
                      <p className="text-sm text-gray-600 ml-7">✗ Financial data (Orders, Revenue)</p>
                      <p className="text-sm text-gray-600 ml-7">✗ Admin settings</p>
                      <p className="text-sm text-gray-600 ml-7">✗ Sub-admin management</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">
                      {editingSubAdminId ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                    </button>
                    <button type="button" onClick={() => { setShowSubAdminForm(false); setEditingSubAdminId(null); }} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Permissions</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-600">
                        No sub-admins created yet. Add one to manage products.
                      </td>
                    </tr>
                  ) : (
                    subAdmins.map(subAdmin => (
                      <tr key={subAdmin.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{subAdmin.name}</td>
                        <td className="px-6 py-4 text-gray-600">{subAdmin.email}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            📦 Products
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => handleEditSubAdmin(subAdmin)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteSubAdmin(subAdmin.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Change Email & Password */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Update Credentials</h3>
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">New Email</label>
                    <input type="email" placeholder="Leave empty to keep current email" value={settingsForm.email} onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">New Password</label>
                    <input type="password" placeholder="Leave empty to keep current password" value={settingsForm.newPassword} onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">
                    Update Settings
                  </button>
                </form>
              </div>

              {/* Security Info */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Security Information</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                    <p className="font-semibold text-blue-900">🔒 Your Account</p>
                    <p className="text-blue-800 text-sm mt-2">Email: {adminEmail}</p>
                    <p className="text-blue-800 text-sm">Role: Super Admin</p>
                    <p className="text-blue-800 text-sm">Full access to all features and financial data</p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
                    <p className="font-semibold text-yellow-900">⚠️ Sub-Admin Restrictions</p>
                    <p className="text-yellow-800 text-sm mt-2">✗ Cannot access financial data</p>
                    <p className="text-yellow-800 text-sm">✗ Cannot modify admin settings</p>
                    <p className="text-yellow-800 text-sm">✗ Cannot manage other sub-admins</p>
                    <p className="text-yellow-800 text-sm">✓ Can manage products only</p>
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

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  }
  return (
    <div className={`border ${colors[color]} rounded-xl p-6`}>
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-gray-600 text-sm font-semibold">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  )
}
