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

      // Create shipments table (updated schema)
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

          pickup_location TEXT NOT NULL,
          dropoff_location TEXT NOT NULL,

          shipping_range TEXT NOT NULL,
          shipping_method TEXT NOT NULL,

          package_type TEXT NOT NULL,
          weight REAL NOT NULL,
          total_cost REAL NOT NULL,

          pickup_date TEXT NOT NULL,
          dropoff_date TEXT NOT NULL,
          
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

// JWT Token Verification Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
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
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    stmt.run(email, hashedPassword, function (err) {
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
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
      res.status(200).json({ token });
    });
  });
});

// Add a shipment (updated for new fields)
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
    weight,
    totalCost,
    pickupDate,
    dropoffDate,
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
    !pickupLocation ||
    !dropoffLocation ||
    !shippingRange ||
    !shippingMethod ||
    !packageType ||
    !weight ||
    !totalCost ||
    !pickupDate ||
    !dropoffDate
  ) {
    return res.status(400).json({ error: 'Invalid or missing fields' });
  }

  const stmt = db.prepare(
    `INSERT INTO shipments (
      sender_name, sender_email, sender_phone_number, sender_address,
      receiver_name, receiver_email, receiver_phone_number, receiver_address,
      pickup_location, dropoff_location, shipping_range, shipping_method,
      package_type, weight, total_cost, pickup_date, dropoff_date, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    weight,
    totalCost,
    pickupDate,
    dropoffDate,
    req.user.id,
    function (err) {
      if (err) {
        console.error('Error adding shipment:', err.message);
        return res.status(500).json({ error: 'Error adding shipment' });
      }
      res.status(201).json({ message: 'Shipment added successfully' });
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

// Serve the index.html file for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});