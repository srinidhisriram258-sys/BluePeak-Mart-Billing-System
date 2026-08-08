const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const billRoutes = require('./routes/billRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');
const requireOwnerAuth = require('./middleware/authMiddleware');
const { checkConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files directly
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', requireOwnerAuth, dashboardRoutes);
app.use('/api/health', healthRoutes);

// Fallback to frontend index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

// Start server and check DB connection
app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(` CloudBill POS & Billing System is running dynamically!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===================================================`);

  const dbStatus = await checkConnection();
  if (dbStatus.connected) {
    console.log(`[Database] SUCCESS: Connected to MySQL '${process.env.DB_NAME || 'billing_db'}' on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  } else {
    console.warn(`[Database] WARNING: ${dbStatus.message}`);
    console.warn(`[Database] Note: Ensure MySQL is running and database initialized with 'npm run init-db'`);
  }
});

module.exports = app;
