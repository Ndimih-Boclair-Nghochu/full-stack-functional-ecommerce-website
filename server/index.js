const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Serve client build
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const dataFile = path.join(__dirname, 'data.json');
let data = { 
  products: [], 
  orders: [], 
  receipts: [],
  users: [], 
  categories: [],
  admin: {
    name: '🏪 SHOP OWNER',
    email: 'ndimihboclair4@gmail.com',
    password: bcrypt.hashSync('boclair444', 10),
    role: 'super_admin'
  },
  subAdmins: [],
  subAdminActivities: [],
  mainShopTown: 'Douala',
  freeShippingThreshold: 50000,
  regionFreeShipping: {},
  shippingFees: {
    Douala: 0,
    "Yaoundé": 3000,
    Bafoussam: 5000,
    Bamenda: 6000,
    Garoua: 8000,
    Maroua: 9000,
    "Ngaoundéré": 7000,
    Bertoua: 6500,
    Buea: 2000,
    Limbe: 2500
  },
  chatMessages: [],
  locations: [
    {
      id: uuid(),
      name: 'Main Store - Douala',
      city: 'Douala',
      address: '123 Boulevard de la Liberté, Douala, Cameroon',
      phone: '+237 6 XX XXX XXX',
      email: 'douala@store.cm',
      lat: 4.0511,
      lng: 9.7679,
      isMainStore: true,
      hours: 'Mon-Sun: 8AM-8PM',
      description: 'Our flagship store in the heart of Douala'
    }
  ]
};

if (fs.existsSync(dataFile)) {
  const fileData = JSON.parse(fs.readFileSync(dataFile));
  data = { ...data, ...fileData };
}

function save() { fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)); }

// One-time migration to fix missing admin names in activities
let hasMigrated = false;
if (data.subAdminActivities && Array.isArray(data.subAdminActivities)) {
  const needsMigration = data.subAdminActivities.some(activity => 
    (activity.subAdminId === null || activity.subAdminId === 'admin') && 
    (!activity.subAdminName || activity.subAdminName === 'Unknown')
  );
  
  if (needsMigration) {
    data.subAdminActivities = data.subAdminActivities.map(activity => {
      // Fix admin activities (subAdminId is null or 'admin')
      if ((activity.subAdminId === null || activity.subAdminId === 'admin') && 
          (!activity.subAdminName || activity.subAdminName === 'Unknown')) {
        return {
          ...activity,
          subAdminName: data.admin?.name || '🏪 SHOP OWNER',
          subAdminEmail: data.admin?.email || 'ndimihboclair4@gmail.com'
        };
      }
      return activity;
    });
    save();
    hasMigrated = true;
    console.log('✅ Migrated admin activities - populated missing names/emails');
  }
}

// Middleware to authenticate admin/subadmin
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper to validate numeric fees
function isValidFee(val) {
  const num = Number(val);
  return !Number.isNaN(num) && num >= 0;
}

// Sample products with mostOrdered and isNew flags
const sampleProducts = [
  { id: '1', name: 'Wireless Headphones', price: 15000, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', description: 'Premium sound quality with noise cancellation', stock: 50, category: 'Electronics', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' }] },
  { id: '2', name: 'Smart Watch', price: 25000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', description: 'Track your fitness and stay connected', stock: 100, category: 'Electronics', mostOrdered: false, isNew: true, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' }] },
  { id: '3', name: 'Laptop Backpack', price: 8000, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', description: 'Durable and spacious for daily commute', stock: 75, category: 'Accessories', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' }] },
  { id: '4', name: 'Bluetooth Speaker', price: 12000, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', description: 'Portable speaker with powerful bass', stock: 200, category: 'Electronics', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500' }] },
  { id: '5', name: 'Wireless Mouse', price: 4500, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', description: 'Ergonomic design with precision tracking', stock: 40, category: 'Electronics', mostOrdered: false, isNew: true, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500' }] },
  { id: '6', name: 'USB-C Hub', price: 6000, image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500', description: 'Multi-port adapter for all your devices', stock: 60, category: 'Accessories', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500' }] },
  { id: '7', name: 'Mechanical Keyboard', price: 18000, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500', description: 'RGB backlit mechanical gaming keyboard', stock: 45, category: 'Electronics', mostOrdered: false, isNew: true, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500' }] },
  { id: '8', name: 'Wireless Earbuds', price: 22000, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', description: 'True wireless earbuds with charging case', stock: 85, category: 'Electronics', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500' }] },
  { id: '9', name: 'Portable Charger', price: 7500, image: 'https://images.unsplash.com/photo-1609592806519-3d0ad8ba3a1d?w=500', description: 'High capacity power bank for all devices', stock: 120, category: 'Accessories', mostOrdered: false, isNew: true, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1609592806519-3d0ad8ba3a1d?w=500' }] },
  { id: '10', name: 'Phone Stand', price: 3500, image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500', description: 'Adjustable aluminum phone holder', stock: 90, category: 'Accessories', mostOrdered: false, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500' }] },
  { id: '11', name: 'Webcam HD', price: 16000, image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500', description: '1080p webcam for video calls and streaming', stock: 55, category: 'Electronics', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500' }] },
  { id: '12', name: 'Gaming Mouse Pad', price: 5000, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', description: 'Large RGB gaming mouse pad', stock: 150, category: 'Accessories', mostOrdered: false, isNew: true, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500' }] },
  { id: '13', name: 'USB Flash Drive', price: 4000, image: 'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=500', description: '128GB high-speed USB 3.0 flash drive', stock: 200, category: 'Accessories', mostOrdered: false, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=500' }] },
  { id: '14', name: 'Laptop Stand', price: 9500, image: 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=500', description: 'Ergonomic aluminum laptop stand', stock: 65, category: 'Accessories', mostOrdered: true, isNew: false, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=500' }] },
  { id: '15', name: 'Desk Lamp LED', price: 8500, image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500', description: 'Adjustable LED desk lamp with USB charging', stock: 70, category: 'Accessories', mostOrdered: false, isNew: true, availableRegions: ['ALL'], images: [{ color: 'default', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500' }] }
];

if (data.products.length === 0) {
  data.products = sampleProducts;
  save();
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Debug endpoint - check subadmins (temporary)
app.get('/api/debug/subadmins', (req, res) => {
  res.json({
    subAdminsCount: data.subAdmins.length,
    subAdmins: data.subAdmins.map(sa => ({
      id: sa.id,
      email: sa.email,
      name: sa.name,
      hasPassword: !!sa.password
    }))
  });
});

// Get platform statistics
app.get('/api/stats', (req, res) => {
  const totalProducts = data.products.length;
  const totalInStock = data.stats?.totalInStock ?? data.products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
  const totalOrders = data.orders.length;
  const totalItemsSold = data.orders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
  }, 0);
  const totalRevenue = data.orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
  const averageRating = data.stats?.averageRating ?? 4.8;
  const deliveryTime = data.stats?.deliveryTime ?? '24-48h';
  
  res.json({
    totalProducts,
    totalInStock,
    totalOrders,
    totalItemsSold,
    totalRevenue,
    averageRating,
    deliveryTime
  });
});

// Update statistics from admin panel
app.post('/api/stats/update', (req, res) => {
  try {
    console.log('Stats update request received:', req.body);
    const { totalInStock, averageRating, deliveryTime } = req.body;
    
    if (totalInStock !== undefined) {
      data.stats = data.stats || {};
      data.stats.totalInStock = parseInt(totalInStock);
    }
    if (averageRating !== undefined) {
      data.stats = data.stats || {};
      data.stats.averageRating = parseFloat(averageRating);
    }
    if (deliveryTime !== undefined) {
      data.stats = data.stats || {};
      data.stats.deliveryTime = deliveryTime;
    }
    
    console.log('Updated stats:', data.stats);
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    console.log('Stats saved to file');
    res.json({ success: true, message: 'Statistics updated' });
  } catch (err) {
    console.error('Error updating statistics:', err);
    res.status(500).json({ error: 'Failed to update statistics' });
  }
});

// Get real-time statistics
app.get('/api/admin/real-time-stats', authenticate, (req, res) => {
  try {
    const period = req.query.period || 'month';
    const now = new Date();
    
    // Helper function to get date range based on period
    const getDateRange = () => {
      const start = new Date(now);
      switch(period) {
        case 'day':
          start.setHours(0, 0, 0, 0);
          return { start, end: now, label: 'Today' };
        case 'week':
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0, 0, 0, 0);
          return { start, end: now, label: 'This Week' };
        case 'month':
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          return { start, end: now, label: 'This Month' };
        case 'year':
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          return { start, end: now, label: 'This Year' };
        default:
          return { start, end: now, label: 'This Month' };
      }
    };

    const { start, end } = getDateRange();

    // Filter orders within period
    const ordersInPeriod = data.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    // Filter POS receipts within period
    const receiptsInPeriod = (data.receipts || []).filter(receipt => {
      const receiptDate = new Date(receipt.timestamp);
      return receiptDate >= start && receiptDate <= end;
    });

    // Calculate metrics from orders
    const ordersRevenue = ordersInPeriod.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
    const ordersCount = ordersInPeriod.length;
    
    // Calculate metrics from POS receipts
    const posRevenue = receiptsInPeriod.reduce((sum, receipt) => sum + (receipt.totals?.total || 0), 0);
    const posCount = receiptsInPeriod.length;
    
    // Combined metrics
    const totalRevenue = ordersRevenue + posRevenue;
    const totalOrders = ordersCount + posCount;
    const totalItemsSold = ordersInPeriod.reduce((sum, order) => {
      return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
    }, 0) + receiptsInPeriod.reduce((sum, receipt) => {
      return sum + (receipt.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
    }, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate trends (compare with previous period)
    const getPreviousPeriodRange = () => {
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      
      switch(period) {
        case 'day':
          prevStart.setDate(prevStart.getDate() - 1);
          break;
        case 'week':
          prevStart.setDate(prevStart.getDate() - 7);
          break;
        case 'month':
          prevStart.setMonth(prevStart.getMonth() - 1);
          break;
        case 'year':
          prevStart.setFullYear(prevStart.getFullYear() - 1);
          break;
      }
      prevStart.setHours(0, 0, 0, 0);
      return { start: prevStart, end: prevEnd };
    };

    const { start: prevStart, end: prevEnd } = getPreviousPeriodRange();
    const prevOrders = data.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= prevStart && orderDate <= prevEnd;
    });
    const prevReceipts = (data.receipts || []).filter(receipt => {
      const receiptDate = new Date(receipt.timestamp);
      return receiptDate >= prevStart && receiptDate <= prevEnd;
    });
    const prevOrderRevenue = prevOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
    const prevReceiptRevenue = prevReceipts.reduce((sum, receipt) => sum + (receipt.totals?.total || 0), 0);
    const prevRevenue = prevOrderRevenue + prevReceiptRevenue;
    const prevOrdersCount = prevOrders.length + prevReceipts.length;

    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;
    const ordersTrend = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount * 100) : 0;
    const prevItemsTrend = prevOrders.reduce((sum, order) => sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0) + 
                           prevReceipts.reduce((sum, receipt) => sum + (receipt.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0);
    const itemsTrendPercent = prevItemsTrend > 0 ? ((totalItemsSold - prevItemsTrend) / prevItemsTrend * 100) : 0;
    const avgTrend = prevOrdersCount > 0 ? (((averageOrderValue - prevRevenue/prevOrdersCount) / (prevRevenue/prevOrdersCount)) * 100) : 0;

    // Sales by day/week/month
    const salesByDay = [];
    if (period === 'day') {
      // Hourly breakdown for day
      for (let i = 0; i < 24; i++) {
        const hourStart = new Date(start);
        hourStart.setHours(i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(i + 1, 0, 0, 0);
        const hourOrders = ordersInPeriod.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= hourStart && orderDate < hourEnd;
        });
        const hourReceipts = receiptsInPeriod.filter(receipt => {
          const receiptDate = new Date(receipt.timestamp);
          return receiptDate >= hourStart && receiptDate < hourEnd;
        });
        const hourOrderRevenue = hourOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
        const hourReceiptRevenue = hourReceipts.reduce((sum, receipt) => sum + (receipt.totals?.total || 0), 0);
        const hourRevenue = hourOrderRevenue + hourReceiptRevenue;
        if (hourRevenue > 0 || i % 3 === 0) {
          salesByDay.push({
            label: `${i}:00`,
            value: hourRevenue
          });
        }
      }
    } else if (period === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(start);
        dayStart.setDate(dayStart.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(24, 0, 0, 0);
        const dayOrders = ordersInPeriod.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd;
        });
        const dayReceipts = receiptsInPeriod.filter(receipt => {
          const receiptDate = new Date(receipt.timestamp);
          return receiptDate >= dayStart && receiptDate < dayEnd;
        });
        const dayOrderRevenue = dayOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
        const dayReceiptRevenue = dayReceipts.reduce((sum, receipt) => sum + (receipt.totals?.total || 0), 0);
        const dayRevenue = dayOrderRevenue + dayReceiptRevenue;
        salesByDay.push({
          label: days[dayStart.getDay()],
          value: dayRevenue
        });
      }
    } else if (period === 'month') {
      // Weekly breakdown
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekOrders = ordersInPeriod.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= weekStart && orderDate < weekEnd;
        });
        const weekReceipts = receiptsInPeriod.filter(receipt => {
          const receiptDate = new Date(receipt.timestamp);
          return receiptDate >= weekStart && receiptDate < weekEnd;
        });
        const weekOrderRevenue = weekOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
        const weekReceiptRevenue = weekReceipts.reduce((sum, receipt) => sum + (receipt.totals?.total || 0), 0);
        const weekRevenue = weekOrderRevenue + weekReceiptRevenue;
        salesByDay.push({
          label: `Week ${i + 1}`,
          value: weekRevenue
        });
      }
    } else {
      // Monthly breakdown for year
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(start.getFullYear(), i, 1);
        const monthEnd = new Date(start.getFullYear(), i + 1, 0);
        const monthOrders = data.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        const monthReceipts = (data.receipts || []).filter(receipt => {
          const receiptDate = new Date(receipt.timestamp);
          return receiptDate >= monthStart && receiptDate <= monthEnd;
        });
        const monthOrderRevenue = monthOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
        const monthReceiptRevenue = monthReceipts.reduce((sum, receipt) => sum + (receipt.totals?.total || 0), 0);
        const monthRevenue = monthOrderRevenue + monthReceiptRevenue;
        salesByDay.push({
          label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          value: monthRevenue
        });
      }
    }

    // Sales by region
    const regionMap = {};
    ordersInPeriod.forEach(order => {
      const region = order.region || 'Unknown';
      if (!regionMap[region]) {
        regionMap[region] = 0;
      }
      regionMap[region] += order.totals?.total || 0;
    });

    const salesByRegion = Object.entries(regionMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Town breakdown with detailed stats
    const townMap = {};
    ordersInPeriod.forEach(order => {
      const town = order.region || 'Unknown';
      if (!townMap[town]) {
        townMap[town] = { orders: 0, items: 0, revenue: 0 };
      }
      townMap[town].orders += 1;
      townMap[town].revenue += order.totals?.total || 0;
      townMap[town].items += order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    });

    const townBreakdown = Object.entries(townMap)
      .map(([name, stats]) => ({
        name,
        ...stats,
        percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top region and product
    const topRegion = salesByRegion.length > 0 ? { name: salesByRegion[0].label, revenue: salesByRegion[0].value } : null;

    const productMap = {};
    ordersInPeriod.forEach(order => {
      order.items?.forEach(item => {
        if (!productMap[item.id]) {
          productMap[item.id] = { name: item.name, quantity: 0 };
        }
        productMap[item.id].quantity += item.quantity || 0;
      });
    });

    const topProduct = Object.entries(productMap)
      .map(([id, data]) => data)
      .sort((a, b) => b.quantity - a.quantity)[0] || null;

    // Recent orders
    const recentOrders = ordersInPeriod
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(order => ({
        buyerName: order.buyer?.name || 'Unknown',
        region: order.region || 'Unknown',
        total: order.totals?.total || 0,
        items: order.items?.length || 0
      }));

    res.json({
      totalRevenue,
      totalOrders,
      totalItemsSold,
      averageOrderValue,
      revenueTrend: Math.round(revenueTrend),
      ordersTrend: Math.round(ordersTrend),
      itemsTrend: Math.round(itemsTrendPercent),
      avgTrend: Math.round(avgTrend),
      salesByDay,
      salesByRegion,
      townBreakdown,
      topRegion,
      topProduct,
      recentOrders,
      period
    });
  } catch (err) {
    console.error('Error fetching real-time stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get detailed stats for specific day/week/month/year
app.get('/api/admin/period-stats', authenticate, (req, res) => {
  try {
    const period = req.query.period || 'month';
    const specificValue = req.query.value; // e.g., 'Monday', 'Week 1', 'January', '2024'
    
    if (!specificValue) {
      return res.status(400).json({ error: 'Missing value parameter' });
    }

    const now = new Date();
    let startDate, endDate;
    let monthWeeks = undefined;

    if (period === 'day') {
      // Specific day of week (Monday, Tuesday, etc.)
      const daysMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
      const targetDay = daysMap[specificValue];
      if (targetDay === undefined) return res.status(400).json({ error: 'Invalid day' });
      
      // Find the most recent occurrence of this day
      const current = new Date(now);
      const day = current.getDay();
      const diff = (targetDay - day + 7) % 7 || 7;
      current.setDate(current.getDate() - diff);
      current.setHours(0, 0, 0, 0);
      startDate = current;
      endDate = new Date(current);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      // Specific week of month (Week 1, Week 2, etc.)
      const weekNum = parseInt(specificValue.split(' ')[1]);
      if (!weekNum || weekNum < 1 || weekNum > 4) return res.status(400).json({ error: 'Invalid week' });
      
      startDate = new Date(now.getFullYear(), now.getMonth(), (weekNum - 1) * 7 + 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), weekNum * 7, 23, 59, 59, 999);
    } else if (period === 'month') {
      // Specific month (January, February, etc.)
      const monthsMap = { 'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5, 'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11 };
      const monthNum = monthsMap[specificValue];
      if (monthNum === undefined) return res.status(400).json({ error: 'Invalid month' });
      
      startDate = new Date(now.getFullYear(), monthNum, 1);
      endDate = new Date(now.getFullYear(), monthNum + 1, 0, 23, 59, 59, 999);
      
      // Calculate week breakdown for this month
      const daysInMonth = endDate.getDate(); // Get the last day of the month
      const weeks = [];
      
      for (let week = 1; week <= 4; week++) {
        const weekStartDay = (week - 1) * 7 + 1;
        let weekEndDay;
        
        // For the last week, extend to the end of month instead of stopping at day 28
        if (week < 4) {
          weekEndDay = week * 7;
        } else {
          // Last week goes to the actual end of month (28, 29, 30, or 31)
          weekEndDay = daysInMonth;
        }
        
        if (weekStartDay <= daysInMonth) {
          const weekStart = new Date(now.getFullYear(), monthNum, weekStartDay);
          const weekEnd = new Date(now.getFullYear(), monthNum, weekEndDay, 23, 59, 59, 999);
          
          // Get orders for this week
          const weekOrders = data.orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= weekStart && orderDate <= weekEnd;
          });
          
          const weekRevenue = weekOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
          const weekOrdersCount = weekOrders.length;
          const weekItems = weekOrders.reduce((sum, order) => {
            return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
          }, 0);
          
          weeks.push({
            weekNumber: week,
            label: `Week ${week} (${weekStartDay}-${weekEndDay})`,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            startDay: weekStartDay,
            endDay: weekEndDay,
            revenue: Math.round(weekRevenue),
            orders: weekOrdersCount,
            items: weekItems
          });
        }
      }
      
      // Attach weeks to return for month view
      monthWeeks = weeks;
    } else if (period === 'year') {
      // Specific year
      const year = parseInt(specificValue);
      if (!year) return res.status(400).json({ error: 'Invalid year' });
      
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    // Filter orders for this specific period
    const filteredOrders = data.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Calculate metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalItemsSold = filteredOrders.reduce((sum, order) => {
      return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
    }, 0);
    const activeUsers = new Set(filteredOrders.map(o => o.buyer?.email || o.buyer?.phone)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = activeUsers > 0 ? (totalOrders / activeUsers * 100).toFixed(1) : 0;

    // Calculate by region
    const regionBreakdown = {};
    filteredOrders.forEach(order => {
      const region = order.region || 'Unknown';
      if (!regionBreakdown[region]) {
        regionBreakdown[region] = { revenue: 0, orders: 0, items: 0 };
      }
      regionBreakdown[region].revenue += order.totals?.total || 0;
      regionBreakdown[region].orders += 1;
      regionBreakdown[region].items += order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    });

    const townBreakdown = Object.entries(regionBreakdown)
      .map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        orders: stats.orders,
        items: stats.items,
        share: totalRevenue > 0 ? ((stats.revenue / totalRevenue) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      period: `${period}:${specificValue}`,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalItemsSold,
      activeUsers,
      averageOrderValue: Math.round(averageOrderValue),
      conversionRate,
      weeks: monthWeeks || undefined, // Include weeks only for month view
      townBreakdown,
      recentOrders: filteredOrders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(order => ({
          id: order.id,
          buyerName: order.buyer?.name || 'Unknown',
          region: order.region || 'Unknown',
          total: order.totals?.total || 0,
          items: order.items?.length || 0,
          date: new Date(order.createdAt).toLocaleDateString()
        }))
    });
  } catch (err) {
    console.error('Error fetching period stats:', err);
    res.status(500).json({ error: 'Failed to fetch period statistics' });
  }
});

// Get products
app.get('/api/products', (req, res) => res.json(data.products));

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = data.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// Create order
app.post('/api/orders', (req, res) => {
  const { buyer, items, region, shippingFee, totals, notes, paymentMethod, isInStoreSale, discountPercent, change, paidAmount, status } = req.body || {};
  if (!buyer || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing buyer or items' });
  }
  const order = {
    id: uuid(),
    buyer: {
      name: buyer.name || '',
      email: buyer.email || '',
      phone: buyer.phone || '',
      address: buyer.address || '',
      agencies: buyer.agencies || []
    },
    region: region || 'Unknown',
    shippingFee: typeof shippingFee === 'number' ? shippingFee : 0,
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      selectedVariant: i.selectedVariant || null,
      selectedImageUrl: i.selectedImageUrl || i.image || null
    })),
    totals: {
      subtotal: totals?.subtotal ?? 0,
      discount: totals?.discount ?? 0,
      subtotalAfterDiscount: totals?.subtotalAfterDiscount ?? 0,
      tax: totals?.tax ?? 0,
      shipping: totals?.shipping ?? shippingFee ?? 0,
      total: totals?.total ?? 0
    },
    status: status || 'pending',
    paymentMethod: paymentMethod || null,
    isInStoreSale: isInStoreSale === true,
    discountPercent: discountPercent || 0,
    change: change || 0,
    paidAmount: paidAmount || 0,
    deliveryAgency: '',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  data.orders.push(order);
  save();
  res.json({ id: order.id, ...order });
});


// Search orders by email or phone (for customers to track orders)
app.get('/api/orders/search', (req, res) => {
  const { email, phone } = req.query;
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }
  
  const matchingOrders = data.orders.filter(order => {
    if (email && order.buyer?.email?.toLowerCase() === email.toLowerCase()) return true;
    if (phone && order.buyer?.phone === phone) return true;
    return false;
  });
  
  // Sort by most recent first
  matchingOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(matchingOrders);
});

// Chat API endpoints

// Get chat history for a device
app.get('/api/chat/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const messages = data.chatMessages.filter(msg => msg.deviceId === deviceId);
  res.json(messages);
});

// Send a new chat message
app.post('/api/chat', (req, res) => {
  const { deviceId, userName, sender, message, imageUrl } = req.body;
  
  // Message is required, but can be just a file attachment
  if (!deviceId || !sender) {
    console.error('Missing required fields:', { deviceId, sender });
    return res.status(400).json({ error: 'Missing deviceId or sender' });
  }
  
  if (!message && !imageUrl) {
    console.error('Message or file is required');
    return res.status(400).json({ error: 'Message or file is required' });
  }
  
  const newMessage = {
    id: data.chatMessages.length + 1,
    deviceId,
    userName: userName || 'Guest',
    sender, // 'customer' or 'admin'
    message: message || '',
    imageUrl: imageUrl || null,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  data.chatMessages.push(newMessage);
  save();
  res.json(newMessage);
});

// Get all chat conversations (admin only)
app.get('/api/admin/chats', authenticate, (req, res) => {
  // Group messages by deviceId
  const conversations = {};
  data.chatMessages.forEach(msg => {
    if (!conversations[msg.deviceId]) {
      conversations[msg.deviceId] = {
        deviceId: msg.deviceId,
        userName: msg.userName,
        messages: [],
        unreadCount: 0,
        lastMessage: null
      };
    }
    conversations[msg.deviceId].messages.push(msg);
    if (!msg.read && msg.sender === 'customer') {
      conversations[msg.deviceId].unreadCount++;
    }
    conversations[msg.deviceId].lastMessage = msg;
  });
  
  // Convert to array and sort by most recent
  const conversationArray = Object.values(conversations);
  conversationArray.sort((a, b) => 
    new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
  );
  
  res.json(conversationArray);
});

// Admin reply to chat
app.post('/api/admin/chats/:deviceId/reply', authenticate, (req, res) => {
  const { deviceId } = req.params;
  const { message, imageUrl } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }
  
  const newMessage = {
    id: data.chatMessages.length + 1,
    deviceId,
    userName: 'Admin',
    sender: 'admin',
    message,
    imageUrl: imageUrl || null,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  data.chatMessages.push(newMessage);
  save();
  res.json(newMessage);
});

// Mark messages as read
app.put('/api/admin/chats/:deviceId/read', authenticate, (req, res) => {
  const { deviceId } = req.params;
  
  data.chatMessages.forEach(msg => {
    if (msg.deviceId === deviceId && msg.sender === 'customer') {
      msg.read = true;
    }
  });
  
  save();
  res.json({ success: true });
});

// Clear all messages in a chat
app.delete('/api/admin/chats/:deviceId', authenticate, (req, res) => {
  const { deviceId } = req.params;
  
  // Remove all messages for this device
  data.chatMessages = data.chatMessages.filter(msg => msg.deviceId !== deviceId);
  
  save();
  res.json({ success: true, message: 'Chat cleared successfully' });
});

// Delete entire conversation
app.delete('/api/admin/chats/:deviceId/delete', authenticate, (req, res) => {
  const { deviceId } = req.params;
  
  // Remove all messages for this device
  data.chatMessages = data.chatMessages.filter(msg => msg.deviceId !== deviceId);
  
  save();
  res.json({ success: true, message: 'Conversation deleted successfully' });
});

// Chat image upload
app.post('/api/chat/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: 'Upload failed: ' + err.message });
    }
    if (!req.file) {
      console.error('No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('File uploaded successfully:', imageUrl);
    res.json({ imageUrl });
  });
});

// Admin login (works for both main admin and sub-admins)
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('=== Login Attempt ===');
  console.log('Email:', email);
  console.log('Total sub-admins in system:', data.subAdmins.length);
  console.log('Sub-admin emails:', data.subAdmins.map(sa => sa.email));
  
  // Check main admin
  if (email === data.admin.email && bcrypt.compareSync(password, data.admin.password)) {
    const token = jwt.sign({ email, isAdmin: true, role: 'super_admin' }, 'secret_key', { expiresIn: '24h' });
    console.log('✅ Main admin login successful');
    return res.json({ token, email, role: 'super_admin', name: data.admin.name });
  }
  
  // Check sub-admins
  const subAdmin = data.subAdmins.find(sa => sa.email === email);
  if (subAdmin) {
    console.log('Found sub-admin:', subAdmin.email);
    const passwordMatch = bcrypt.compareSync(password, subAdmin.password);
    console.log('Password match:', passwordMatch);
    
    if (passwordMatch) {
      const token = jwt.sign({ email, isAdmin: true, role: 'sub_admin', subAdminId: subAdmin.id }, 'secret_key', { expiresIn: '24h' });
      console.log('✅ Sub-admin login successful');
      return res.json({ token, email, role: 'sub_admin', name: subAdmin.name });
    } else {
      console.log('❌ Password mismatch for sub-admin');
    }
  } else {
    console.log('❌ Sub-admin not found with email:', email);
  }
  
  // Invalid credentials
  console.log('❌ Login failed - invalid credentials');
  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin products - GET all
app.get('/api/admin/products', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    res.json(data.products);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin products - CREATE
app.post('/api/admin/products', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const newProduct = {
      id: uuid(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    data.products.push(newProduct);
    save();
    res.json(newProduct);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin products - UPDATE
app.put('/api/admin/products/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const index = data.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    data.products[index] = { ...data.products[index], ...req.body };
    save();
    res.json(data.products[index]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin products - DELETE
app.delete('/api/admin/products/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const index = data.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    const deleted = data.products.splice(index, 1);
    save();
    res.json(deleted[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin settings - UPDATE email and password
app.put('/api/admin/settings', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { email, password, platformName } = req.body;
    if (email) data.admin.email = email;
    if (password) data.admin.password = bcrypt.hashSync(password, 10);
    if (platformName) data.admin.platformName = platformName;
    save();
    res.json({ message: 'Settings updated', email: data.admin.email, platformName: data.admin.platformName });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get platform name
app.get('/api/platform-name', (req, res) => {
  try {
    const platformName = data.admin?.platformName || 'MyShop';
    res.json({ platformName });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get hero section
app.get('/api/hero-section', (req, res) => {
  try {
    const heroSection = data.admin?.heroSection || {
      badge: "✨ Special Offers This Season",
      title: "Shop the Best Products Online",
      description: "Discover thousands of quality products at unbeatable prices. Free shipping on orders over 10,000 XAF.",
      primaryButtonText: "Shop Now →",
      secondaryButtonText: "Learn More",
      backgroundImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920"
    };
    res.json(heroSection);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update hero section
app.put('/api/admin/hero-section', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { badge, title, description, primaryButtonText, secondaryButtonText, backgroundImage } = req.body;
    if (!data.admin) data.admin = {};
    data.admin.heroSection = {
      badge: badge || data.admin.heroSection?.badge || "✨ Special Offers This Season",
      title: title || data.admin.heroSection?.title || "Shop the Best Products Online",
      description: description || data.admin.heroSection?.description || "Discover thousands of quality products at unbeatable prices.",
      primaryButtonText: primaryButtonText || data.admin.heroSection?.primaryButtonText || "Shop Now →",
      secondaryButtonText: secondaryButtonText || data.admin.heroSection?.secondaryButtonText || "Learn More",
      backgroundImage: backgroundImage || data.admin.heroSection?.backgroundImage || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920"
    };
    save();
    res.json({ message: 'Hero section updated', heroSection: data.admin.heroSection });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Shipping fees - GET
app.get('/api/admin/shipping-fees', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    res.json(data.shippingFees);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Shipping fees - UPDATE
app.put('/api/admin/shipping-fees', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const fees = req.body || {};
    for (const region of Object.keys(fees)) {
      if (!isValidFee(fees[region])) {
        return res.status(400).json({ error: `Invalid fee for ${region}` });
      }
    }
    data.shippingFees = { ...data.shippingFees, ...fees };
    save();
    res.json(data.shippingFees);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Public shipping fees - GET
app.get('/api/shipping-fees', (req, res) => {
  res.json(data.shippingFees);
});

// Main shop town - GET
app.get('/api/admin/main-shop-town', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    res.json({ mainShopTown: data.mainShopTown });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Main shop town - PUT
app.put('/api/admin/main-shop-town', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { mainShopTown } = req.body;
    if (!mainShopTown || typeof mainShopTown !== 'string') {
      return res.status(400).json({ error: 'Invalid mainShopTown' });
    }
    data.mainShopTown = mainShopTown;
    save();
    res.json({ mainShopTown: data.mainShopTown });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Free shipping settings - GET
app.get('/api/admin/free-shipping', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    res.json({
      platformThreshold: data.freeShippingThreshold,
      regionThresholds: data.regionFreeShipping
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Free shipping settings - PUT
app.put('/api/admin/free-shipping', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { platformThreshold, regionThresholds } = req.body;
    
    if (platformThreshold !== undefined) {
      const threshold = Number(platformThreshold);
      if (isNaN(threshold) || threshold < 0) {
        return res.status(400).json({ error: 'Invalid platform threshold' });
      }
      data.freeShippingThreshold = threshold;
    }
    
    if (regionThresholds !== undefined) {
      if (typeof regionThresholds !== 'object') {
        return res.status(400).json({ error: 'Invalid region thresholds' });
      }
      // Validate each region threshold
      for (const region of Object.keys(regionThresholds)) {
        if (regionThresholds[region] !== undefined && regionThresholds[region] !== null) {
          const threshold = Number(regionThresholds[region]);
          if (isNaN(threshold) || threshold < 0) {
            return res.status(400).json({ error: `Invalid threshold for region ${region}` });
          }
        }
      }
      data.regionFreeShipping = regionThresholds;
    }
    
    save();
    res.json({
      platformThreshold: data.freeShippingThreshold,
      regionThresholds: data.regionFreeShipping
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin orders - GET all
app.get('/api/admin/orders', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    res.json(data.orders);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin orders - UPDATE status
app.put('/api/admin/orders/:id', (req, res) => {
  try {
    console.log('🔄 PUT request received for order update')
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ Order update - No token provided')
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    console.log('✅ Token received')
    jwt.verify(token, 'secret_key');
    console.log('✅ Token verified')
    const { id } = req.params;
    const { status, deliveryAgency } = req.body;
    
    console.log(`📝 Updating order ${id}:`, { status, deliveryAgency })
    console.log(`📊 Total orders in system: ${data.orders.length}`)
    
    const index = data.orders.findIndex(o => o.id === id);
    console.log(`🔍 Order found at index: ${index}`)
    if (index === -1) {
      console.log(`❌ Order ${id} not found`)
      console.log(`📋 Available order IDs:`, data.orders.slice(0, 3).map(o => o.id))
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (status) {
      data.orders[index].status = status;
      console.log(`✅ Order ${id} status changed to: ${status}`)
    }
    if (deliveryAgency !== undefined) {
      data.orders[index].deliveryAgency = deliveryAgency;
      console.log(`✅ Order ${id} delivery agency set to: ${deliveryAgency}`)
    }
    
    save();
    console.log(`✅ Order ${id} saved successfully to disk`)
    console.log(`📤 Sending response:`, { id: data.orders[index].id, status: data.orders[index].status })
    res.json(data.orders[index]);
  } catch (err) {
    console.error('❌ Order update error:', err.message)
    console.error('⚠️  Error stack:', err.stack)
    res.status(401).json({ error: 'Invalid token or error: ' + err.message });
  }
});

// Admin orders - DELETE
app.delete('/api/admin/orders/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ Order delete - No token provided')
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    jwt.verify(token, 'secret_key');
    const { id } = req.params;
    
    console.log(`🗑️  Deleting order ${id}`)
    
    const index = data.orders.findIndex(o => o.id === id);
    if (index === -1) {
      console.log(`❌ Order ${id} not found`)
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const deleted = data.orders.splice(index, 1);
    save();
    console.log(`✅ Order ${id} deleted successfully`)
    res.json(deleted[0]);
  } catch (err) {
    console.error('❌ Order delete error:', err.message)
    res.status(401).json({ error: 'Invalid token or error: ' + err.message });
  }
});

// Get POS Sales Report
app.get('/api/admin/pos-stats', authenticate, (req, res) => {
  try {
    const posOrders = data.orders.filter(o => o.isInStoreSale === true);
    const onlineOrders = data.orders.filter(o => o.isInStoreSale !== true);
    
    const posTotals = {
      total: posOrders.length,
      revenue: posOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
      items: posOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0),
      avgTransaction: posOrders.length > 0 ? Math.round(posOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0) / posOrders.length) : 0,
      discountGiven: posOrders.reduce((sum, o) => sum + (o.totals?.discount || 0), 0),
      paymentMethods: {
        cash: posOrders.filter(o => o.paymentMethod === 'cash').length,
        card: posOrders.filter(o => o.paymentMethod === 'card').length,
        transfer: posOrders.filter(o => o.paymentMethod === 'transfer').length,
        momo: posOrders.filter(o => o.paymentMethod === 'momo').length
      }
    };
    
    const totals = {
      all: data.orders.length,
      revenue: data.orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
      onlineRevenue: onlineOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
      posRevenue: posTotals.revenue,
      onlinePct: data.orders.length > 0 ? Math.round((onlineOrders.length / data.orders.length) * 100) : 0,
      posPct: data.orders.length > 0 ? Math.round((posOrders.length / data.orders.length) * 100) : 0
    };
    
    res.json({ posOrders: posTotals, totals });
  } catch (err) {
    console.error('POS stats error:', err);
    res.status(500).json({ error: 'Failed to fetch POS statistics' });
  }
});

// Upload images (multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
// Allow files up to 20MB (for images and PDFs)
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.post('/api/admin/upload', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: 'Upload failed' });
      const filePath = `/uploads/${req.file.filename}`;
      res.json({ url: filePath });
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// SUB-ADMIN ENDPOINTS
// Get all sub-admins
app.get('/api/admin/sub-admins', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    res.json(data.subAdmins);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Create sub-admin
app.post('/api/admin/sub-admins', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { email, password, name, permissions } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newSubAdmin = {
      id: uuid(),
      email,
      password: bcrypt.hashSync(password, 10),
      name,
      permissions: permissions || ['products'],
      createdAt: new Date(),
      status: 'active'
    };

    data.subAdmins.push(newSubAdmin);
    save();
    res.json({ id: newSubAdmin.id, email: newSubAdmin.email, name: newSubAdmin.name });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update sub-admin
app.put('/api/admin/sub-admins/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { id } = req.params;
    const { name, permissions, status } = req.body;
    
    const subAdmin = data.subAdmins.find(sa => sa.id === id);
    if (!subAdmin) return res.status(404).json({ error: 'Sub-admin not found' });

    if (name) subAdmin.name = name;
    if (permissions) subAdmin.permissions = permissions;
    if (status) subAdmin.status = status;

    save();
    res.json(subAdmin);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Delete sub-admin
app.delete('/api/admin/sub-admins/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { id } = req.params;
    const index = data.subAdmins.findIndex(sa => sa.id === id);
    if (index === -1) return res.status(404).json({ error: 'Sub-admin not found' });

    const deleted = data.subAdmins.splice(index, 1);
    save();
    res.json(deleted[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Sub-admin login (same as admin login but with role check)
app.post('/api/sub-admin/login', (req, res) => {
  const { email, password } = req.body;
  const subAdmin = data.subAdmins.find(sa => sa.email === email && sa.status === 'active');
  
  if (subAdmin && bcrypt.compareSync(password, subAdmin.password)) {
    const token = jwt.sign({ role: 'sub_admin', id: subAdmin.id }, 'secret_key', { expiresIn: '7d' });
    res.json({ token, email: subAdmin.email, name: subAdmin.name, role: 'sub_admin', permissions: subAdmin.permissions });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ==================== CHAT ENDPOINTS ====================

// Get all conversations for admin
app.get('/api/admin/chat/conversations', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    jwt.verify(token, 'secret_key');
    
    // Group messages by deviceId
    const conversations = {};
    if (data.chatMessages && Array.isArray(data.chatMessages)) {
      data.chatMessages.forEach(msg => {
        if (!conversations[msg.deviceId]) {
          conversations[msg.deviceId] = {
            deviceId: msg.deviceId,
            messageCount: 0,
            lastMessage: msg.timestamp
          };
        }
        conversations[msg.deviceId].messageCount++;
        conversations[msg.deviceId].lastMessage = msg.timestamp;
      });
    }
    
    res.json(Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessage) - new Date(a.lastMessage)
    ));
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Mark message as read
app.put('/api/chat/:messageId/read', (req, res) => {
  try {
    const { messageId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    jwt.verify(token, 'secret_key');

    const message = data.chatMessages.find(m => m.id === messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.read = true;
    save();
    res.json(message);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Locations - PUBLIC GET all
app.get('/api/locations', (req, res) => {
  if (!data.locations) data.locations = [];
  res.json(data.locations);
});

// Locations - Admin GET all
app.get('/api/admin/locations', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    if (!data.locations) data.locations = [];
    res.json(data.locations);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Locations - CREATE
app.post('/api/admin/locations', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const { name, city, address, phone, email, lat, lng, hours, description, isMainStore } = req.body;
    
    if (!name || !city || !address) {
      return res.status(400).json({ error: 'Name, city, and address are required' });
    }

    if (!data.locations) data.locations = [];

    const newLocation = {
      id: uuid(),
      name,
      city,
      address,
      phone: phone || '',
      email: email || '',
      lat: lat || 0,
      lng: lng || 0,
      hours: hours || '',
      description: description || '',
      isMainStore: isMainStore || false,
      createdAt: new Date().toISOString()
    };

    data.locations.push(newLocation);
    save();
    res.json(newLocation);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Locations - UPDATE
app.put('/api/admin/locations/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    if (!data.locations) data.locations = [];
    
    const index = data.locations.findIndex(l => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Location not found' });

    const { name, city, address, phone, email, lat, lng, hours, description, isMainStore } = req.body;
    
    if (!name || !city || !address) {
      return res.status(400).json({ error: 'Name, city, and address are required' });
    }

    data.locations[index] = {
      ...data.locations[index],
      name,
      city,
      address,
      phone: phone || '',
      email: email || '',
      lat: lat || 0,
      lng: lng || 0,
      hours: hours || '',
      description: description || '',
      isMainStore: isMainStore || false
    };

    save();
    res.json(data.locations[index]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Locations - DELETE
app.delete('/api/admin/locations/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    if (!data.locations) data.locations = [];
    
    const index = data.locations.findIndex(l => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Location not found' });

    const deleted = data.locations.splice(index, 1);
    save();
    res.json(deleted[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============================================
// SUB-ADMIN MANAGEMENT ENDPOINTS
// ============================================

// Get all sub-admins
app.get('/api/admin/subadmins', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, 'secret_key');
    
    const subAdmins = data.subAdmins || [];
    res.json(subAdmins.map(s => ({
      ...s,
      password: undefined // Never send password
    })));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Create sub-admin
app.post('/api/admin/subadmins', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, 'secret_key');

    const { name, email, password, permissions } = req.body;

    // Check if email already exists
    if (data.subAdmins.some(s => s.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newSubAdmin = {
      id: uuid(),
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      permissions: permissions || {
        manageProducts: true,
        manageOrders: false,
        manageLocations: false,
        viewReports: false,
        viewAnalytics: false,
        manageCustomerService: false
      },
      createdAt: new Date().toISOString(),
      isActive: true
    };

    data.subAdmins.push(newSubAdmin);
    save();

    // Log activity with admin ID (null) - admin performed this action
    logSubAdminActivity('create_subadmin', `Created sub-admin: ${name} (${email})`, null);

    res.json({ ...newSubAdmin, password: undefined });
  } catch (err) {
    console.error('Error creating sub-admin:', err);
    res.status(500).json({ error: 'Failed to create sub-admin' });
  }
});

// Update sub-admin
app.put('/api/admin/subadmins/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, 'secret_key');

    const { name, permissions } = req.body;
    const index = data.subAdmins.findIndex(s => s.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Sub-admin not found' });

    const oldSubAdmin = { ...data.subAdmins[index] };
    data.subAdmins[index] = {
      ...data.subAdmins[index],
      name: name || data.subAdmins[index].name,
      permissions: permissions || data.subAdmins[index].permissions,
      updatedAt: new Date().toISOString()
    };

    save();

    // Log activity with admin ID (null) - admin performed this action
    logSubAdminActivity('update_subadmin', `Updated sub-admin: ${name}`, null);

    res.json({ ...data.subAdmins[index], password: undefined });
  } catch (err) {
    console.error('Error updating sub-admin:', err);
    res.status(500).json({ error: 'Failed to update sub-admin' });
  }
});

// Delete sub-admin
app.delete('/api/admin/subadmins/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, 'secret_key');

    const index = data.subAdmins.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Sub-admin not found' });

    const deleted = data.subAdmins.splice(index, 1)[0];
    save();

    // Log activity with admin ID (null) - admin performed this action
    logSubAdminActivity('delete_subadmin', `Deleted sub-admin: ${deleted.name}`, null);

    res.json({ ...deleted, password: undefined });
  } catch (err) {
    console.error('Error deleting sub-admin:', err);
    res.status(500).json({ error: 'Failed to delete sub-admin' });
  }
});

// ============================================
// SUB-ADMIN ACTIVITY LOGGING
// ============================================

// Function to log activity
function logSubAdminActivity(action, details, subAdminId) {
  if (!data.subAdminActivities) {
    data.subAdminActivities = [];
  }

  // Find sub-admin to get their name and email for fallback
  const subAdmin = data.subAdmins?.find(sa => sa.id === subAdminId);
  
  // Determine name and email
  let subAdminName = subAdmin?.name;
  let subAdminEmail = subAdmin?.email;
  
  // If it's an admin activity (null ID), always use admin info
  if (subAdminId === null || subAdminId === 'admin') {
    subAdminName = data.admin?.name || '🏪 SHOP OWNER';
    subAdminEmail = data.admin?.email || 'ndimihboclair4@gmail.com';
  }

  const activity = {
    id: uuid(),
    subAdminId: subAdminId,
    subAdminName: subAdminName || null,
    subAdminEmail: subAdminEmail || null,
    action: action,
    details: details,
    timestamp: new Date().toISOString(),
    ipAddress: 'localhost'
  };

  data.subAdminActivities.push(activity);
  
  // Keep only last 1000 activities
  if (data.subAdminActivities.length > 1000) {
    data.subAdminActivities = data.subAdminActivities.slice(-1000);
  }

  save();
}

// Get all sub-admin activities
app.get('/api/admin/subadmin-activities', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, 'secret_key');

    const activities = (data.subAdminActivities || []).map(activity => {
      // Ensure all activities have proper fallback data
      let subAdminName = activity.subAdminName;
      let subAdminEmail = activity.subAdminEmail;
      
      // If name/email are missing or null, try to find from sub-admins
      if (!subAdminName || !subAdminEmail) {
        const subAdmin = data.subAdmins?.find(sa => sa.id === activity.subAdminId);
        if (subAdmin) {
          subAdminName = subAdmin.name;
          subAdminEmail = subAdmin.email;
        }
      }
      
      // If still missing and it's a main admin activity (null ID), use admin data
      if ((!subAdminName || !subAdminEmail) && (activity.subAdminId === null || activity.subAdminId === 'admin')) {
        subAdminName = data.admin?.name || '🏪 SHOP OWNER';
        subAdminEmail = data.admin?.email || 'ndimihboclair4@gmail.com';
      }
      
      return {
        ...activity,
        subAdminName: subAdminName || null,
        subAdminEmail: subAdminEmail || null
      };
    });
    
    res.json(activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Log when products are created/updated/deleted by sub-admin
app.post('/api/admin/log-subadmin-activity', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const decoded = jwt.verify(token, 'secret_key');
    const { action, details, subAdminId } = req.body;

    logSubAdminActivity(action, details, subAdminId || decoded.sub);

    res.json({ success: true });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// ===================== POS ENDPOINTS =====================

// Save receipt/transaction
app.post('/api/pos/save-receipt', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, 'secret_key');
      // Check if it's a sub-admin and if they have permission
      if (decoded.isSubAdmin && !decoded.permissions?.managePOS) {
        return res.status(403).json({ error: 'Sub-admin does not have POS management permission' });
      }
    }

    const { receipt } = req.body;
    
    if (!receipt || !receipt.id) {
      return res.status(400).json({ error: 'Invalid receipt data' });
    }

    const receiptData = {
      ...receipt,
      savedAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    data.receipts.push(receiptData);
    save();

    res.json({ success: true, receipt: receiptData });
  } catch (err) {
    console.error('Error saving receipt:', err);
    res.status(500).json({ error: 'Failed to save receipt' });
  }
});

// Get POS statistics
app.get('/api/pos/statistics', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, 'secret_key');
      // Check if it's a sub-admin and if they have permission
      if (decoded.isSubAdmin && !decoded.permissions?.viewPOSAnalytics) {
        return res.status(403).json({ error: 'Sub-admin does not have POS analytics viewing permission' });
      }
    }

    const totalReceipts = data.receipts.length;
    const totalRevenue = data.receipts.reduce((sum, receipt) => sum + receipt.totals.total, 0);
    const averageTransaction = totalReceipts > 0 ? totalRevenue / totalReceipts : 0;

    // Items sold
    const itemsSold = {};
    data.receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        if (!itemsSold[item.name]) {
          itemsSold[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemsSold[item.name].quantity += item.quantity;
        itemsSold[item.name].revenue += item.price * item.quantity;
      });
    });

    // Top items
    const topItems = Object.values(itemsSold)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily sales
    const dailySales = {};
    data.receipts.forEach(receipt => {
      const date = new Date(receipt.savedAt).toLocaleDateString();
      if (!dailySales[date]) {
        dailySales[date] = { date, count: 0, revenue: 0 };
      }
      dailySales[date].count += 1;
      dailySales[date].revenue += receipt.totals.total;
    });

    const dailySalesArray = Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalReceipts,
      totalRevenue,
      averageTransaction: Math.round(averageTransaction),
      topItems,
      dailySales: dailySalesArray,
      itemsSold: Object.values(itemsSold)
    });
  } catch (err) {
    console.error('Error fetching POS statistics:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all receipts
app.get('/api/pos/receipts', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, 'secret_key');
      // Check if it's a sub-admin and if they have permission
      if (decoded.isSubAdmin && !decoded.permissions?.viewPOSAnalytics) {
        return res.status(403).json({ error: 'Sub-admin does not have POS analytics viewing permission' });
      }
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const receipts = data.receipts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);

    res.json({
      receipts,
      total: data.receipts.length,
      limit,
      offset
    });
  } catch (err) {
    console.error('Error fetching receipts:', err);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://127.0.0.1:${PORT}`));
