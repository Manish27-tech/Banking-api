require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/banking', require('./routes/banking'));
app.use('/api/refresh', require('./routes/refresh'));

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Banking API with JWT Authentication',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout'
      },
      banking: {
        balance: 'GET /api/banking/balance/:accountNumber',
        deposit: 'POST /api/banking/deposit/:accountNumber',
        withdraw: 'POST /api/banking/withdraw/:accountNumber',
        transfer: 'POST /api/banking/transfer/:fromAccount',
        history: 'GET /api/banking/history/:accountNumber'
      },
      refresh: {
        token: 'POST /api/refresh/token'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Banking API server running on http://localhost:${PORT}`);
});