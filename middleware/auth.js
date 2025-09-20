// middleware/auth.js
// This middleware checks if the user is authenticated using Supabase tokens

const { supabase } = require('../config/database');

/**
 * Authentication middleware
 * Checks if the request has a valid Supabase session/token
 * Adds user info to req.user for use in controllers
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header (format: "Bearer token")
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required. Please include Authorization header.'
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Get retailer info from our custom retailers table
    const { data: retailer, error: retailerError } = await supabase
      .from('retailers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (retailerError || !retailer) {
      return res.status(404).json({
        success: false,
        message: 'Retailer profile not found. Please complete registration.'
      });
    }

    // Add user and retailer info to request object for use in controllers
    req.user = user;
    req.retailer = retailer;
    
    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication verification failed.'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't fail if no token is provided
 * Useful for routes that work for both authenticated and non-authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      req.retailer = null;
      return next();
    }

    // If token exists, verify it
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token, continue without user info
      req.user = null;
      req.retailer = null;
      return next();
    }

    // Get retailer info
    const { data: retailer } = await supabase
      .from('retailers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    req.user = user;
    req.retailer = retailer;
    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    req.retailer = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};