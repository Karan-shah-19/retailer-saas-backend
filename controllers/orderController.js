// controllers/orderController.js
// Order controller - handles all order-related operations

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new order
 * POST /orders
 * Body: { customer_name, customer_email, customer_phone, product_id, quantity, notes }
 */
const createOrder = asyncHandler(async (req, res) => {
  const { customer_name, customer_email, customer_phone, product_id, quantity, notes } = req.body;
  const retailerId = req.retailer.id;

  // Step 1: Get product details and verify it belongs to this retailer
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', product_id)
    .eq('retailer_id', retailerId)
    .eq('is_active', true)
    .single();

  if (productError || !product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found or not available'
    });
  }

  // Step 2: Check if enough stock is available
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
    });
  }

  // Step 3: Calculate total amount
  const unitPrice = product.price;
  const totalAmount = unitPrice * quantity;

  // Step 4: Create order and update stock in a transaction-like approach
  // First, create the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        retailer_id: retailerId,
        customer_name,
        customer_email,
        customer_phone,
        product_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        status: 'pending',
        notes
      }
    ])
    .select(`
      *,
      products (
        name,
        category,
        image_url
      )
    `)
    .single();

  if (orderError) {
    throw orderError;
  }

  // Step 5: Update product stock
  const { error: stockError } = await supabase
    .from('products')
    .update({ stock: product.stock - quantity })
    .eq('id', product_id);

  if (stockError) {
    // If stock update fails, we should ideally rollback the order
    // For now, we'll log the error and continue
    console.error('Stock update failed:', stockError);
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: orderData
  });
});

/**
 * Get all orders for the logged-in retailer
 * GET /orders
 * Query params: status, page, limit, customer_name
 */
const getOrders = asyncHandler(async (req, res) => {
  const retailerId = req.retailer.id;
  const { status, page = 1, limit = 10, customer_name } = req.query;

  // Build query with product details
  let query = supabase
    .from('orders')
    .select(`
      *,
      products (
        name,
        category,
        image_url
      )
    `)
    .eq('retailer_id', retailerId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (customer_name) {
    query = query.ilike('customer_name', `%${customer_name}%`);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('retailer_id', retailerId);

  if (status) countQuery = countQuery.eq('status', status);
  if (customer_name) countQuery = countQuery.ilike('customer_name', `%${customer_name}%`);

  const { count: totalCount } = await countQuery;

  res.status(200).json({
    success: true,
    data: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
});

/**
 * Get a single order by ID
 * GET /orders/:id
 */
const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const retailerId = req.retailer.id;

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        name,
        category,
        image_url,
        description
      )
    `)
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    data: data
  });
});

/**
 * Update order status
 * PUT /orders/:id
 * Body: { status, notes }
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const retailerId = req.retailer.id;

  // Prepare update data
  const updateData = { status };
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  // Update order
  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .select(`
      *,
      products (
        name,
        category,
        image_url
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Order updated successfully',
    data: data
  });
});

/**
 * Delete an order (only if status is 'pending' or 'cancelled')
 * DELETE /orders/:id
 */
const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const retailerId = req.retailer.id;

  // First, get the order to check its status and get product info
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    throw fetchError;
  }

  // Check if order can be deleted
  if (!['pending', 'cancelled'].includes(order.status)) {
    return res.status(409).json({
      success: false,
      message: 'Only pending or cancelled orders can be deleted'
    });
  }

  // If order is pending, restore the stock
  if (order.status === 'pending') {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', order.product_id)
      .single();

    if (!productError && product) {
      await supabase
        .from('products')
        .update({ stock: product.stock + order.quantity })
        .eq('id', order.product_id);
    }
  }

  // Delete the order
  const { error: deleteError } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('retailer_id', retailerId);

  if (deleteError) {
    throw deleteError;
  }

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully'
  });
});

/**
 * Get order statistics for the retailer
 * GET /orders/stats
 */
const getOrderStats = asyncHandler(async (req, res) => {
  const retailerId = req.retailer.id;

  // Get order counts by status
  const { data: statusStats, error: statusError } = await supabase
    .from('orders')
    .select('status')
    .eq('retailer_id', retailerId);

  if (statusError) {
    throw statusError;
  }

  // Calculate statistics
  const stats = {
    total: statusStats.length,
    pending: statusStats.filter(o => o.status === 'pending').length,
    confirmed: statusStats.filter(o => o.status === 'confirmed').length,
    processing: statusStats.filter(o => o.status === 'processing').length,
    shipped: statusStats.filter(o => o.status === 'shipped').length,
    delivered: statusStats.filter(o => o.status === 'delivered').length,
    cancelled: statusStats.filter(o => o.status === 'cancelled').length
  };

  // Get total revenue (from delivered orders)
  const { data: revenueData, error: revenueError } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('retailer_id', retailerId)
    .eq('status', 'delivered');

  if (revenueError) {
    throw revenueError;
  }

  const totalRevenue = revenueData.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

  res.status(200).json({
    success: true,
    data: {
      orderStats: stats,
      totalRevenue: totalRevenue.toFixed(2)
    }
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
};