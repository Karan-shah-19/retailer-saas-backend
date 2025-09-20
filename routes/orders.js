// routes/orders.js
// Order routes - handles all order-related endpoints

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
} = require('../controllers/orderController');

const { authenticateToken } = require('../middleware/auth');
const {
  validateOrder,
  validateOrderStatus,
  validateUUIDParam
} = require('../utils/validators');

/**
 * @route   POST /orders
 * @desc    Create a new order
 * @access  Private (Retailer only)
 * @body    { customer_name, customer_email, customer_phone, product_id, quantity, notes }
 */
router.post('/', authenticateToken, validateOrder, createOrder);

/**
 * @route   GET /orders
 * @desc    Get all orders for logged-in retailer
 * @access  Private (Retailer only)
 * @query   status, page, limit, customer_name
 */
router.get('/', authenticateToken, getOrders);

/**
 * @route   GET /orders/stats
 * @desc    Get order statistics for the retailer
 * @access  Private (Retailer only)
 */
router.get('/stats', authenticateToken, getOrderStats);

/**
 * @route   GET /orders/:id
 * @desc    Get a single order by ID
 * @access  Private (Retailer only)
 * @params  id (UUID)
 */
router.get('/:id', authenticateToken, validateUUIDParam('id'), getOrder);

/**
 * @route   PUT /orders/:id
 * @desc    Update order status
 * @access  Private (Retailer only)
 * @params  id (UUID)
 * @body    { status, notes }
 */
router.put('/:id', authenticateToken, validateOrderStatus, updateOrderStatus);

/**
 * @route   DELETE /orders/:id
 * @desc    Delete an order (only pending/cancelled)
 * @access  Private (Retailer only)
 * @params  id (UUID)
 */
router.delete('/:id', authenticateToken, validateUUIDParam('id'), deleteOrder);

module.exports = router;