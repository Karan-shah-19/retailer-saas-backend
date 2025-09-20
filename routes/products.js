// routes/products.js
// Product routes - handles all product-related endpoints

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getCategories
} = require('../controllers/productController');

const { authenticateToken } = require('../middleware/auth');
const {
  validateProduct,
  validateProductUpdate,
  validateUUIDParam
} = require('../utils/validators');

/**
 * @route   POST /products
 * @desc    Create a new product
 * @access  Private (Retailer only)
 * @body    { name, description, price, stock, category, image_url }
 */
router.post('/', authenticateToken, validateProduct, createProduct);

/**
 * @route   GET /products
 * @desc    Get all products for logged-in retailer
 * @access  Private (Retailer only)
 * @query   category, is_active, page, limit
 */
router.get('/', authenticateToken, getProducts);

/**
 * @route   GET /products/categories
 * @desc    Get all product categories for the retailer
 * @access  Private (Retailer only)
 */
router.get('/categories', authenticateToken, getCategories);

/**
 * @route   GET /products/:id
 * @desc    Get a single product by ID
 * @access  Private (Retailer only)
 * @params  id (UUID)
 */
router.get('/:id', authenticateToken, validateUUIDParam('id'), getProduct);

/**
 * @route   PUT /products/:id
 * @desc    Update a product
 * @access  Private (Retailer only)
 * @params  id (UUID)
 * @body    { name, description, price, stock, category, image_url, is_active }
 */
router.put('/:id', authenticateToken, validateProductUpdate, updateProduct);

/**
 * @route   PATCH /products/:id/toggle-status
 * @desc    Toggle product active/inactive status
 * @access  Private (Retailer only)
 * @params  id (UUID)
 */
router.patch('/:id/toggle-status', authenticateToken, validateUUIDParam('id'), toggleProductStatus);

/**
 * @route   DELETE /products/:id
 * @desc    Delete a product
 * @access  Private (Retailer only)
 * @params  id (UUID)
 */
router.delete('/:id', authenticateToken, validateUUIDParam('id'), deleteProduct);

module.exports = router;