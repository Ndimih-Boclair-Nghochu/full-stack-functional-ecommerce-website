import React, { useState, useRef } from 'react'
import axios from 'axios'

export default function PointOfSale({ token }) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  })
  const [items, setItems] = useState([])
  const [itemInput, setItemInput] = useState({
    itemName: '',
    price: '',
    quantity: 1,
    properties: []
  })
  const [propertyInput, setPropertyInput] = useState({
    name: '',
    value: ''
  })
  const [editingPropertyIndex, setEditingPropertyIndex] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Add property to current item
  const addProperty = () => {
    if (!propertyInput.name || !propertyInput.value) {
      setMessage({ type: 'error', text: 'Please fill in property name and value' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }
    
    if (editingPropertyIndex !== null) {
      // Update existing property
      const updatedProperties = [...itemInput.properties]
      updatedProperties[editingPropertyIndex] = { name: propertyInput.name, value: propertyInput.value }
      setItemInput({
        ...itemInput,
        properties: updatedProperties
      })
      setEditingPropertyIndex(null)
    } else {
      // Add new property
      setItemInput({
        ...itemInput,
        properties: [...itemInput.properties, { name: propertyInput.name, value: propertyInput.value }]
      })
    }
    setPropertyInput({ name: '', value: '' })
  }

  // Edit property
  const editProperty = (index) => {
    const property = itemInput.properties[index]
    setPropertyInput({ name: property.name, value: property.value })
    setEditingPropertyIndex(index)
  }

  // Cancel edit
  const cancelEditProperty = () => {
    setPropertyInput({ name: '', value: '' })
    setEditingPropertyIndex(null)
  }

  // Remove property from current item
  const removeProperty = (index) => {
    setItemInput({
      ...itemInput,
      properties: itemInput.properties.filter((_, i) => i !== index)
    })
    if (editingPropertyIndex === index) {
      cancelEditProperty()
    }
  }

  // Add item to receipt
  const addItem = () => {
    if (!itemInput.itemName || !itemInput.price) {
      setMessage({ type: 'error', text: 'Please fill in item name and price' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }
    
    if (editingItemId !== null) {
      // Update existing item
      setItems(items.map(item =>
        item.id === editingItemId ? {
          ...item,
          name: itemInput.itemName,
          price: parseFloat(itemInput.price),
          quantity: parseInt(itemInput.quantity) || 1,
          properties: itemInput.properties
        } : item
      ))
      setEditingItemId(null)
      setMessage({ type: 'success', text: 'Item updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    } else {
      // Add new item
      setItems([...items, {
        id: Date.now(),
        name: itemInput.itemName,
        price: parseFloat(itemInput.price),
        quantity: parseInt(itemInput.quantity) || 1,
        properties: itemInput.properties
      }])
    }
    
    setItemInput({ itemName: '', price: '', quantity: 1, properties: [] })
  }

  // Edit item
  const editItem = (id) => {
    const item = items.find(i => i.id === id)
    if (item) {
      setItemInput({
        itemName: item.name,
        price: item.price.toString(),
        quantity: item.quantity,
        properties: [...item.properties]
      })
      setEditingItemId(id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Cancel edit
  const cancelEditItem = () => {
    setItemInput({ itemName: '', price: '', quantity: 1, properties: [] })
    setEditingItemId(null)
    setPropertyInput({ name: '', value: '' })
    setEditingPropertyIndex(null)
  }

  // Remove item
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id))
    if (editingItemId === id) {
      cancelEditItem()
    }
  }

  // Update quantity
  const updateQuantity = (id, quantity) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, quantity: parseInt(quantity) || 1 } : item
    ))
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const total = subtotal - discountAmount

  // Generate receipt
  const generateReceipt = async () => {
    if (!customerInfo.name) {
      setMessage({ type: 'error', text: 'Please enter customer name' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one item' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }

    setLoading(true)
    try {
      // Fetch platform name
      let platformName = 'NBNShop'
      try {
        const res = await axios.get('/api/platform-name')
        platformName = res.data.platformName || 'NBNShop'
      } catch (err) {
        console.error('Could not fetch platform name')
      }

      const receiptData = {
        id: `RCP-${Date.now()}`,
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone
        },
        items: items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          properties: item.properties || []
        })),
        totals: {
          subtotal,
          discount: discountAmount,
          total
        },
        discountPercent,
        createdAt: new Date().toLocaleString(),
        platformName
      }

      console.log('Generated Receipt:', receiptData)
      setGeneratedReceipt(receiptData)
      setShowReceipt(true)
      setMessage({ type: 'success', text: 'Receipt generated successfully!' })

      // Save receipt to backend
      try {
        await axios.post('/api/pos/save-receipt', { receipt: receiptData }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Receipt saved to database')
      } catch (err) {
        console.error('Error saving receipt:', err)
      }

      // Reset form
      setTimeout(() => {
        setItems([])
        setCustomerInfo({ name: '', phone: '' })
        setDiscountPercent(0)
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate receipt' })
    } finally {
      setLoading(false)
    }
  }

  // Print receipt
  const printReceipt = () => {
    const printWindow = window.open('', '', 'width=400,height=600')
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, monospace; padding: 20px; max-width: 400px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 5px 0; }
            .header p { margin: 2px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 15px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .totals { margin: 15px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-amount { font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${generatedReceipt.platformName}</h2>
            <p>RECEIPT</p>
            <p>ID: ${generatedReceipt.id}</p>
            <p>${generatedReceipt.createdAt}</p>
          </div>
          
          <div class="divider"></div>
          
          <p><strong>Customer:</strong> ${generatedReceipt.customer.name}</p>
          ${generatedReceipt.customer.phone ? `<p><strong>Phone:</strong> ${generatedReceipt.customer.phone}</p>` : ''}
          
          <div class="divider"></div>
          
          <div class="items">
            <strong>Items:</strong>
            ${generatedReceipt.items.map(item => 
              `<div class="item">
                <div>
                  <span>${item.quantity}x ${item.name}</span>
                  ${item.properties && item.properties.length > 0 ? 
                    `<div style="font-size: 10px; margin-top: 2px; color: #666;">${item.properties.map(p => p.name + ': ' + p.value).join(', ')}</div>` 
                    : ''}
                </div>
                <span>XAF ${(item.price * item.quantity).toLocaleString()}</span>
              </div>`
            ).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>XAF ${generatedReceipt.totals.subtotal.toLocaleString()}</span>
            </div>
            ${generatedReceipt.discountPercent > 0 ? `
              <div class="total-row">
                <span>Discount (${generatedReceipt.discountPercent}%):</span>
                <span>-XAF ${generatedReceipt.totals.discount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="total-row total-amount">
              <span>TOTAL:</span>
              <span>XAF ${generatedReceipt.totals.total.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-lg font-semibold text-sm border-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-300'
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {showReceipt && generatedReceipt ? (
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
          <div className="max-w-md mx-auto">
            {/* Receipt Preview */}
            <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm border border-gray-300 mb-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">{generatedReceipt.platformName}</h2>
                <p className="font-bold">RECEIPT</p>
                <p className="text-xs">ID: {generatedReceipt.id}</p>
                <p className="text-xs">{generatedReceipt.createdAt}</p>
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <p><strong>Customer:</strong></p>
              <p>{generatedReceipt.customer.name}</p>
              {generatedReceipt.customer.phone && (
                <p>Phone: {generatedReceipt.customer.phone}</p>
              )}
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <p className="font-bold mb-2">Items:</p>
              {generatedReceipt.items.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{item.quantity}x {item.name}</span>
                    <span>XAF {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  {item.properties && item.properties.length > 0 && (
                    <div className="text-xs text-gray-500 pl-2 border-l-2 border-gray-300">
                      {item.properties.map((prop, pidx) => (
                        <div key={pidx}>{prop.name}: {prop.value}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>XAF {generatedReceipt.totals.subtotal.toLocaleString()}</span>
                </div>
                {generatedReceipt.discountPercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({generatedReceipt.discountPercent}%):</span>
                    <span>-XAF {generatedReceipt.totals.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>TOTAL:</span>
                  <span>XAF {generatedReceipt.totals.total.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <div className="text-center text-xs">
                <p>Thank you for your purchase!</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={printReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-bold transition"
              >
                ✓ Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Add Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Add Items</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g., iPhone 15 Pro"
                    value={itemInput.itemName}
                    onChange={(e) => setItemInput({ ...itemInput, itemName: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price (XAF)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={itemInput.price}
                      onChange={(e) => setItemInput({ ...itemInput, price: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={itemInput.quantity}
                      onChange={(e) => setItemInput({ ...itemInput, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-blue-200 pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">📋 Item Properties (Optional)</h4>
                  <p className="text-xs text-gray-600 mb-3">Add properties like Color, Size, Storage, etc.</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Property Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Color"
                        value={propertyInput.name}
                        onChange={(e) => setPropertyInput({ ...propertyInput, name: e.target.value })}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Value</label>
                      <input
                        type="text"
                        placeholder="e.g., Gold"
                        value={propertyInput.value}
                        onChange={(e) => setPropertyInput({ ...propertyInput, value: e.target.value })}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={addProperty}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-xs font-bold transition mb-3"
                  >
                    {editingPropertyIndex !== null ? '✏️ Update Property' : '+ Add Property'}
                  </button>

                  {editingPropertyIndex !== null && (
                    <button
                      onClick={cancelEditProperty}
                      className="w-full bg-gray-400 hover:bg-gray-500 text-white py-1.5 rounded text-xs font-bold transition mb-3"
                    >
                      ✕ Cancel Edit
                    </button>
                  )}

                  {itemInput.properties.length > 0 && (
                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-200 mb-3">
                      {itemInput.properties.map((prop, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold">{prop.name}: {prop.value}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editProperty(idx)}
                              className="text-blue-600 hover:text-blue-700 font-bold"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => removeProperty(idx)}
                              className="text-red-600 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={addItem}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition"
                >
                  {editingItemId !== null ? '✏️ Update Item' : '+ Add Item'}
                </button>

                {editingItemId !== null && (
                  <button
                    onClick={cancelEditItem}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-bold transition mt-2"
                  >
                    ✕ Cancel Edit
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
                <h4 className="font-bold text-gray-900 mb-3">Receipt Items ({items.length})</h4>
                {items.map((item) => (
                  <div key={item.id} className={`bg-gray-50 p-3 rounded-lg border-2 ${editingItemId === item.id ? 'border-blue-600 bg-blue-50' : 'border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          XAF {item.price.toLocaleString()} × 
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-12 ml-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                          />
                          = XAF {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => editItem(item.id)}
                          className="text-blue-600 hover:text-blue-700 font-bold"
                          title="Edit item"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 font-bold"
                          title="Delete item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {item.properties && item.properties.length > 0 && (
                      <div className="bg-white p-2 rounded text-xs border-l-2 border-orange-400 ml-0">
                        {item.properties.map((prop, idx) => (
                          <div key={idx} className="text-gray-600">
                            <span className="font-semibold text-gray-700">{prop.name}:</span> {prop.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">No items added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Receipt Preview & Checkout */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4">👤 Customer</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+237 6 XX XXX XXX"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Discount & Totals */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-4">💰 Totals</h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white p-4 rounded-lg border-2 border-green-300 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">XAF {subtotal.toLocaleString()}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({discountPercent}%):</span>
                    <span className="font-bold">-XAF {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t-2 border-green-300 pt-2 flex justify-between text-lg">
                  <span className="font-bold">TOTAL:</span>
                  <span className="font-bold text-green-600">XAF {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={generateReceipt}
                disabled={loading || items.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition shadow-lg"
              >
                {loading ? '⏳ Generating...' : '✓ Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
