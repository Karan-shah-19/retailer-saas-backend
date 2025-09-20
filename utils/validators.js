// utils/validators.js
// Input validation helpers using express-validator

const { body, param, validationResult } = require('express-validator');

/**
 * Check validation results and return errors if any
 */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.type = 'validation';
    error.errors = errors.array();
    return next(error);
  }
  next();
};

/**
 * Authentication validation rules
 */
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  checkValidation
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  checkValidation
];

/**
 * Product validation rules
 */
const validateProduct = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name is required and must not exceed 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  checkValidation
];

const validateProductUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must not exceed 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('price')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  checkValidation
];

/**
 * Order validation rules
 */
const validateOrder = [
  body('customer_name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Customer name is required and must not exceed 255 characters'),
  body('customer_email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid customer email address'),
  body('customer_phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
  body('product_id')
    .isUUID()
    .withMessage('Invalid product ID format'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  checkValidation
];

const validateOrderStatus = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID format'),
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status value'),
  checkValidation
];

/**
 * Retailer settings validation rules
 */
const validateRetailerSettings = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Business name must be between 2 and 255 characters'),
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  body('theme')
    .optional()
    .isIn(['default', 'modern', 'classic', 'minimal', 'bold'])
    .withMessage('Invalid theme selection'),
  checkValidation
];

/**
 * UUID parameter validation
 */
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  checkValidation
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProduct,
  validateProductUpdate,
  validateOrder,
  validateOrderStatus,
  validateRetailerSettings,
  validateUUIDParam,
  checkValidation
};