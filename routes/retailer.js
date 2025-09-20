// routes/retailer.js
// Retailer routes - handles retailer settings and profile endpoints

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  getSettings,
  updateSettings,
  getDashboard,
  getThemes,
  updateTheme,
  getPublicStore
} = require('../controllers/retailerController');

const { authenticateToken } = require('../middleware/auth');
const {
  validateRetailerSettings,
  validateUUIDParam
} = require('../utils/validators');
const { body } = require('express-validator');

/**
 * @route   GET /retailer/settings
 * @desc    Get current retailer settings/profile
 * @access  Private (Retailer only)
 */
router.get('/settings', authenticateToken, getSettings);

/**
 * @route   PUT /retailer/settings
 * @desc    Update retailer settings
 * @access  Private (Retailer only)
 * @body    { name, logo_url, theme }
 */
router.put('/settings', authenticateToken, validateRetailerSettings, updateSettings);

/**
 * @route   GET /retailer/dashboard
 * @desc    Get retailer dashboard summary with statistics
 * @access  Private (Retailer only)
 */
router.get('/dashboard', authenticateToken, getDashboard);

/**
 * @route   GET /retailer/themes
 * @desc    Get available themes
 * @access  Private (Retailer only)
 */
router.get('/themes', authenticateToken, getThemes);

/**
 * @route   PATCH /retailer/theme
 * @desc    Update retailer theme only
 * @access  Private (Retailer only)
 * @body    { theme }
 */
router.patch('/theme', 
  authenticateToken, 
  [
    body('theme')
      .notEmpty()
      .isIn(['default', 'modern', 'classic', 'minimal', 'bold'])
      .withMessage('Invalid theme selection'),
  ],
  updateTheme
);

/**
 * @route   GET /retailer/store/:retailerId
 * @desc    Get public store information (for customer-facing store)
 * @access  Public
 * @params  retailerId (UUID)
 */
router.get('/store/:retailerId', validateUUIDParam('retailerId'), getPublicStore);

module.exports = router;