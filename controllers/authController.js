// controllers/authController.js
// Authentication controller - handles user registration and login

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new retailer
 * POST /auth/register
 * Body: { email, password, name }
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Step 1: Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    const statusCode = authError.status || 400;
    return res.status(statusCode).json({
      success: false,
      message: authError.message || 'Registration failed'
    });
  }

  const user = authData.user;
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'User creation failed'
    });
  }

  // Step 2: Create retailer profile in our custom table
const { supabaseAdmin } = require('../config/database');

const { data: retailerData, error: retailerError } = await supabaseAdmin
  .from('retailers')
  .insert([
    {
      user_id: user.id,
      name: name,
      email: email,
      theme: 'default'
    }
  ])
  .select()
  .single();


  if (retailerError) {
    // If retailer profile creation fails, we should cleanup the auth user
    // Note: In production, you might want to handle this differently
    console.error('Retailer profile creation failed:', retailerError);
    return res.status(500).json({
      success: false,
      message: 'Registration completed but profile creation failed. Please contact support.'
    });
  }

  // Step 3: Return success response
  res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at
      },
      retailer: retailerData
    }
  });
});

/**
 * Login retailer
 * POST /auth/login
 * Body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Step 1: Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    const statusCode = authError.status || 401;
    return res.status(statusCode).json({
      success: false,
      message: authError.message || 'Login failed'
    });
  }

  const { user, session } = authData;

  if (!user || !session) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }

  // Step 2: Get retailer profile
  const { data: retailerData, error: retailerError } = await supabase
    .from('retailers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (retailerError || !retailerData) {
    return res.status(404).json({
      success: false,
      message: 'Retailer profile not found. Please complete registration.'
    });
  }

  // Step 3: Return success response with session token
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at
      },
      retailer: retailerData,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    }
  });
});

/**
 * Logout retailer
 * POST /auth/logout
 * Headers: Authorization: Bearer <token>
 */
const logout = asyncHandler(async (req, res) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'No token provided'
    });
  }

  // Sign out from Supabase (this invalidates the token)
  const { error } = await supabase.auth.signOut(token);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Get current user profile
 * GET /auth/me
 * Headers: Authorization: Bearer <token>
 */
const getProfile = asyncHandler(async (req, res) => {
  // User and retailer info is already available from auth middleware
  const { user, retailer } = req;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at
      },
      retailer: retailer
    }
  });
});

/**
 * Request password reset
 * POST /auth/forgot-password
 * Body: { email }
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Send password reset email via Supabase
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Password reset request failed'
    });
  }

  // Always return success for security (don't reveal if email exists)
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, we have sent a password reset link.'
  });
});

module.exports = {
  register,
  login,
  logout,
  getProfile,
  forgotPassword
};