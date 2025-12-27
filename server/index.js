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
  users: [], 
  categories: [],
  admin: {
    email: 'ndimihboclair4@gmail.com',
    password: bcrypt.hashSync('boclair444', 10),
    role: 'super_admin'
  },
  subAdmins: [],
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
  }
};

if (fs.existsSync(dataFile)) {
  const fileData = JSON.parse(fs.readFileSync(dataFile));
  data = { ...data, ...fileData };
}

function save() { fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)); }

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
  const { buyer, items, region, shippingFee, totals, notes } = req.body || {};
  if (!buyer || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing buyer or items' });
  }
  const order = {
    id: uuid(),
    buyer: {
      name: buyer.name || '',
      email: buyer.email || '',
      phone: buyer.phone || '',
      address: buyer.address || ''
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
      tax: totals?.tax ?? 0,
      total: totals?.total ?? 0
    },
    status: 'pending',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  data.orders.push(order);
  save();
  res.json(order);
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === data.admin.email && bcrypt.compareSync(password, data.admin.password)) {
    const token = jwt.sign({ email, isAdmin: true }, 'secret_key', { expiresIn: '24h' });
    res.json({ token, email });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
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
    const { email, password } = req.body;
    if (email) data.admin.email = email;
    if (password) data.admin.password = bcrypt.hashSync(password, 10);
    save();
    res.json({ message: 'Settings updated', email: data.admin.email });
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
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const index = data.orders.findIndex(o => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });
    const { status } = req.body;
    if (status) data.orders[index].status = status;
    save();
    res.json(data.orders[index]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin orders - DELETE
app.delete('/api/admin/orders/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, 'secret_key');
    const index = data.orders.findIndex(o => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });
    const deleted = data.orders.splice(index, 1);
    save();
    res.json(deleted[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
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
const upload = multer({ storage });

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

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://127.0.0.1:${PORT}`));
