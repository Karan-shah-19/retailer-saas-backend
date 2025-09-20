// routes/auth.js
// Authentication routes - handles all auth-related endpoints

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  register,
  login,
  logout,
  getProfile,
  forgotPassword
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin
} = require('../utils/validators');

/**
 * @route   POST /auth/register
 * @desc    Register a new retailer account
 * @access  Public
 * @body    { email, password, name }
 */
router.post('/register', validateRegistration, register);

/**
 * @route   POST /auth/login
 * @desc    Login retailer and get session token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /auth/logout
 * @desc    Logout retailer (invalidate session)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', logout);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/me', authenticateToken, getProfile);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', forgotPassword);

module.exports = router;