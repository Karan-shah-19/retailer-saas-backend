// controllers/authController.js
const { supabase, supabaseAdmin } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new retailer
 * POST /auth/register
 * Body: { email, password, name }
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // 1️⃣ Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm email for now
  });

  if (authError) {
    return res.status(400).json({
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

  // 2️⃣ Create retailer profile in custom table
  const { data: retailerData, error: retailerError } = await supabaseAdmin
    .from('retailers')
    .insert([{
      user_id: user.id,
      name: name || email,
      email: email,
      theme: 'default'
    }])
    .select()
    .single();

  if (retailerError) {
    console.error('Retailer profile creation failed:', retailerError);
    return res.status(500).json({
      success: false,
      message: 'Registration completed but profile creation failed. Please contact support.'
    });
  }

  // 3️⃣ Return success
  res.status(201).json({
    success: true,
    message: 'Registration successful!',
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

  // 1️⃣ Authenticate user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    return res.status(401).json({
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

  // 2️⃣ Fetch retailer profile
  const { data: retailerData, error: retailerError } = await supabaseAdmin
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

  // 3️⃣ Return success
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
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'No token provided'
    });
  }

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
 */
const getProfile = asyncHandler(async (req, res) => {
  const { user, retailer } = req;

  res.status(200).json({
    success: true,
    data: { user, retailer }
  });
});

/**
 * Request password reset
 * POST /auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Password reset request failed'
    });
  }

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
