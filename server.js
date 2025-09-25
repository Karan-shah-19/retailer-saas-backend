// server.js
// Main application entry point - Express server setup and configuration

require('dotenv').config(); // <-- loads variables from .env into process.env


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import middleware and routes
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const retailerRoutes = require('./routes/retailer');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// MIDDLEWARE SETUP
// =======================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// =======================
// ROUTES SETUP
// =======================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/retailer', retailerRoutes);
app.use('/api/uploads', require('./routes/uploads'));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Retailer SaaS API v1.0',
    documentation: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/me',
        forgotPassword: 'POST /api/auth/forgot-password'
      },
      products: {
        create: 'POST /api/products',
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
        toggleStatus: 'PATCH /api/products/:id/toggle-status',
        categories: 'GET /api/products/categories'
      },
      orders: {
        create: 'POST /api/orders',
        list: 'GET /api/orders',
        get: 'GET /api/orders/:id',
        updateStatus: 'PUT /api/orders/:id',
        delete: 'DELETE /api/orders/:id',
        stats: 'GET /api/orders/stats'
      },
      retailer: {
        settings: 'GET /api/retailer/settings',
        updateSettings: 'PUT /api/retailer/settings',
        dashboard: 'GET /api/retailer/dashboard',
        themes: 'GET /api/retailer/themes',
        updateTheme: 'PATCH /api/retailer/theme',
        publicStore: 'GET /api/retailer/store/:retailerId'
      }
    }
  });
});

// =======================
// ERROR HANDLING
// =======================

// Handle 404 errors for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// =======================
// SERVER STARTUP
// =======================

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running successfully!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 Health Check: http://localhost:${PORT}/health
📖 API Docs: http://localhost:${PORT}/api
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;