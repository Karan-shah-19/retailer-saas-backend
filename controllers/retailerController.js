// controllers/retailerController.js
// Retailer controller - handles retailer profile, settings, dashboard, public store

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get retailer settings/profile
 * GET /retailer/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const retailer = req.retailer;

  res.status(200).json({
    success: true,
    data: retailer
  });
});

/**
 * Update retailer settings
 * PUT /retailer/settings
 * Body: { name, logo_url, colors, font, banner_url, nav_menu, layout, contact_info, social_links, footer_text }
 */
const updateSettings = asyncHandler(async (req, res) => {
  const retailerId = req.retailer.id;
  const {
    name,
    logo_url,
    primary_color,
    secondary_color,
    font,
    banner_url,
    nav_menu,
    layout_preference,
    contact_info,
    social_links,
    footer_text
  } = req.body;

  // Clean data: remove undefined, trim strings
  const cleanedData = {};
  Object.entries({
    name, logo_url, primary_color, secondary_color, font,
    banner_url, nav_menu, layout_preference, contact_info,
    social_links, footer_text
  }).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedData[key] = typeof value === 'string' ? value.trim() : value;
    }
  });

  if (!Object.keys(cleanedData).length) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  const { data, error } = await supabase
    .from('retailers')
    .update(cleanedData)
    .eq('id', retailerId)
    .select()
    .single();

  if (error) throw error;

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data
  });
});

/**
 * Get retailer dashboard summary
 * GET /retailer/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const retailer = req.retailer;
  const retailerId = retailer.id;

  try {
    const [
      { data: productStats, error: productError },
      { data: recentOrders, error: orderError },
      { data: lowStockProducts, error: lowStockError },
      { data: weeklyOrders, error: weeklyError }
    ] = await Promise.all([
      // Product stats
      supabase
        .from('products')
        .select('is_active, stock')
        .eq('retailer_id', retailerId),

      // Orders last 30 days
      supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('retailer_id', retailerId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Low stock products
      supabase
        .from('products')
        .select('id, name, stock')
        .eq('retailer_id', retailerId)
        .eq('is_active', true)
        .lte('stock', 5)
        .order('stock', { ascending: true })
        .limit(10),

      // Weekly orders (last 7 days)
      supabase
        .from('orders')
        .select('created_at')
        .eq('retailer_id', retailerId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
    ]);

    if (productError) throw productError;
    if (orderError) throw orderError;
    if (lowStockError) throw lowStockError;
    if (weeklyError) throw weeklyError;

    const totalProducts = productStats.length;
    const activeProducts = productStats.filter(p => p.is_active).length;
    const inactiveProducts = totalProducts - activeProducts;
    const outOfStock = productStats.filter(p => p.stock === 0).length;

    const totalOrders = recentOrders.length;
    const pendingOrders = recentOrders.filter(o => o.status === 'pending').length;
    const deliveredOrders = recentOrders.filter(o => o.status === 'delivered').length;
    const totalRevenue = recentOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

    const dailyOrders = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dailyOrders[date.toISOString().split('T')[0]] = 0;
    }

    weeklyOrders.forEach(order => {
      const dateString = order.created_at.split('T')[0];
      if (dailyOrders.hasOwnProperty(dateString)) {
        dailyOrders[dateString]++;
      }
    });

    const chartData = Object.keys(dailyOrders).map(date => ({
      date,
      orders: dailyOrders[date]
    }));

    res.status(200).json({
      success: true,
      data: {
        store: retailer,
        productStats: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          outOfStock
        },
        orderStats: {
          totalLast30Days: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          revenueLast30Days: totalRevenue.toFixed(2)
        },
        lowStockProducts,
        weeklyOrderChart: chartData
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    throw error;
  }
});

/**
 * Get available themes
 */
const getThemes = asyncHandler(async (req, res) => {
  const themes = [
    { id: 'default', name: 'Default', description: 'Clean and simple design', preview: '/themes/default-preview.jpg' },
    { id: 'modern', name: 'Modern', description: 'Contemporary and sleek', preview: '/themes/modern-preview.jpg' },
    { id: 'classic', name: 'Classic', description: 'Traditional and elegant', preview: '/themes/classic-preview.jpg' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and focused', preview: '/themes/minimal-preview.jpg' },
    { id: 'bold', name: 'Bold', description: 'Vibrant and eye-catching', preview: '/themes/bold-preview.jpg' }
  ];

  res.status(200).json({ success: true, data: themes });
});

/**
 * Update retailer theme
 * PATCH /retailer/theme
 */
const updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  const retailerId = req.retailer.id;
  const validThemes = ['default', 'modern', 'classic', 'minimal', 'bold'];

  if (!validThemes.includes(theme)) {
    return res.status(400).json({ success: false, message: 'Invalid theme selection' });
  }

  const { data, error } = await supabase
    .from('retailers')
    .update({ theme })
    .eq('id', retailerId)
    .select()
    .single();

  if (error) throw error;

  res.status(200).json({ success: true, message: `Theme updated to '${theme}'`, data });
});

/**
 * Get retailer's public store info (customer-facing)
 * GET /retailer/store/:retailerId
 */
const getPublicStore = asyncHandler(async (req, res) => {
  const { retailerId } = req.params;

  const [
    { data: retailer, error: retailerError },
    { data: products, error: productError }
  ] = await Promise.all([
    supabase
      .from('retailers')
      .select(`
        id, name, logo_url, theme,
        primary_color, secondary_color, font,
        banner_url, nav_menu, layout_preference,
        contact_info, social_links, footer_text
      `)
      .eq('id', retailerId)
      .single(),

    supabase
      .from('products')
      .select('id, name, description, price, stock, category, image_url')
      .eq('retailer_id', retailerId)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('created_at', { ascending: false })
  ]);

  if (retailerError || !retailer) {
    return res.status(404).json({ success: false, message: 'Store not found or not available' });
  }
  if (productError) throw productError;

  res.status(200).json({
    success: true,
    data: {
      store: retailer,
      products: products || [],
      productCount: products ? products.length : 0
    }
  });
});

module.exports = {
  getSettings,
  updateSettings,
  getDashboard,
  getThemes,
  updateTheme,
  getPublicStore
};
