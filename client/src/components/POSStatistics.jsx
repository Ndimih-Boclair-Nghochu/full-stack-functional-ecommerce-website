import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function POSStatistics({ token }) {
  const [stats, setStats] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [statsRes, receiptsRes] = await Promise.all([
        axios.get('/api/pos/statistics', { headers }),
        axios.get('/api/pos/receipts?limit=20', { headers })
      ])
      setStats(statsRes.data)
      setReceipts(receiptsRes.data.receipts)
    } catch (err) {
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8"><p className="text-gray-600">Loading statistics...</p></div>
  }

  if (!stats) {
    return <div className="text-center py-8"><p className="text-gray-600">No data available</p></div>
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-bold transition ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-3 font-bold transition ${
            activeTab === 'items'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Top Items
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-3 font-bold transition ${
            activeTab === 'daily'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Daily Sales
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-3 font-bold transition ${
            activeTab === 'receipts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🧾 Receipts
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border border-green-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">💰 Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              XAF {stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">From all transactions</p>
          </div>

          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md p-6 border border-blue-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">🧾 Transactions</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalReceipts}</p>
            <p className="text-xs text-gray-500 mt-2">Total receipts</p>
          </div>

          {/* Average Transaction */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border border-purple-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">📈 Avg Transaction</p>
            <p className="text-3xl font-bold text-purple-600">
              XAF {stats.averageTransaction.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">Per receipt</p>
          </div>

          {/* Total Items Sold */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-md p-6 border border-orange-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">📦 Items Sold</p>
            <p className="text-3xl font-bold text-orange-600">
              {stats.itemsSold.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Total units</p>
          </div>
        </div>
      )}

      {/* TOP ITEMS TAB */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Top Selling Items</h3>
          {stats.topItems.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No sales data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Item Name</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Quantity</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">Revenue</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topItems.map((item, idx) => {
                    const percentage = ((item.revenue / stats.totalRevenue) * 100).toFixed(1)
                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{idx + 1}. {item.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold">
                          XAF {item.revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DAILY SALES TAB */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Daily Sales Report</h3>
          {stats.dailySales.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No sales data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Date</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Transactions</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailySales.map((day, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{day.date}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{day.count}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        XAF {day.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RECEIPTS TAB */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🧾 Recent Receipts</h3>
          {receipts.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No receipts yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {receipts.map((receipt, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{receipt.customer.name}</p>
                      <p className="text-xs text-gray-600">{receipt.id}</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      XAF {receipt.totals.total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{receipt.createdAt}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {receipt.items.length} item(s) • Phone: {receipt.customer.phone || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
