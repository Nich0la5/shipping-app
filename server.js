
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;
const SECRET_KEY = 'YourStrongSecretKey'; // Replace with a strong secret key
// Open SQLite database
const db = new sqlite3.Database('database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the database.');
    db.serialize(() => {
      // Create users table
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )`
      );
      // Create shipments table
      db.run(
        `CREATE TABLE IF NOT EXISTS shipments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_name TEXT NOT NULL,
          sender_email TEXT NOT NULL,
          sender_phone_number TEXT NOT NULL,
          sender_address TEXT NOT NULL,
          receiver_name TEXT NOT NULL,
          receiver_email TEXT NOT NULL,
          receiver_phone_number TEXT NOT NULL,
          receiver_address TEXT NOT NULL,
          total_cost REAL NOT NULL,
          weight REAL NOT NULL,
          pickup_date TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );`
      );
    });
  }
});
// Enable CORS
app.use(cors());
// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Admin middleware
function isAdmin(req, res, next) {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// JWT Token Verification Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }
    req.user = decoded;
    next();
  });
}
// User Sign Up
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)');
    stmt.run(email, hashedPassword, is_admin, function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Error creating user' });
      }
      res.status(201).json({ message: 'User created successfully' });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// In your signup route, add:
let is_admin = 0;
if (email === 'nicholaskibichii53@gmail.com') { // Set your admin email here
    is_admin = 1;
}

// User Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, SECRET_KEY, { expiresIn: '1h' });
      res.status(200).json({ token });
    });
  });
});


// Add a shipment
app.post('/api/shipments', verifyToken, (req, res) => {
  const {
    senderName,
    senderEmail,
    senderPhoneNumber,
    senderAddress,
    receiverName,
    receiverEmail,
    receiverPhoneNumber,
    receiverAddress,
    pickupLocation,
    dropoffLocation,
    shippingRange,
    shippingMethod,
    packageType,
    packageLength,
    packageWidth,
    packageHeight,
    packageDescription,
    weight,
    pickupDate,
    dropoffDate,
    totalCost,
  } = req.body;
  if (
    !senderName ||
    !senderEmail ||
    !senderPhoneNumber ||
    !senderAddress ||
    !receiverName ||
    !receiverEmail ||
    !receiverPhoneNumber ||
    !receiverAddress ||
    !pickupLocation||
    !dropoffLocation||
    !shippingRange||
    !shippingMethod||
    !packageType||
    !packageLength||
    !packageWidth||
    !packageHeight||
    !packageDescription||
    !weight ||
    !totalCost||
    !pickupDate||
    !dropoffDate||
    !totalCost
  ) {
    return res.status(400).json({ error: 'Invalid or missing fields' });
  }
  const stmt = db.prepare(
    'INSERT INTO shipments (sender_name, sender_email, sender_phone_number, sender_address, receiver_name, receiver_email, receiver_phone_number, receiver_address, pickup_location, drop_off_location, shipping_range, shipping_method, package_type, package_length, package_width, package_height, package_description, weight, pickup_date, dropoff_date, total_cost, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    senderName,
    senderEmail,
    senderPhoneNumber,
    senderAddress,
    receiverName,
    receiverEmail,
    receiverPhoneNumber,
    receiverAddress,
    pickupLocation,
    dropoffLocation,
    shippingRange,
    shippingMethod,
    packageType,
    packageLength,
    packageWidth,
    packageHeight,
    packageDescription,
    weight,
    pickupDate,
    dropoffDate,
    totalCost,
    req.user.id,
    function (err) {
      if (err) {
        console.error('Error adding shipment:', err.message);
        return res.status(500).json({ error: 'Error adding shipment' });
      }
      res.status(201).json({ message: 'Shipment added to db successfully' });
    }
  );
  stmt.finalize();
});


// Fetch shipments for the logged-in user
app.get('/api/shipments', verifyToken, (req, res) => {
  db.all('SELECT * FROM shipments WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching shipments:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(rows);
  });
});


// Admin middleware
function isAdmin(req, res, next) {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// Admin Routes
// Get all users (admin only)
app.get('/api/admin/users', verifyToken, isAdmin, (req, res) => {
  db.all('SELECT id, email, is_admin FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get all shipments (admin only)
app.get('/api/admin/shipments', verifyToken, isAdmin, (req, res) => {
  db.all('SELECT * FROM shipments', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create admin route handler
app.get('/admin', verifyToken, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the index.html file for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});