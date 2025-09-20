// controllers/productController.js
// Product controller - handles all product-related operations

const { supabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new product
 * POST /products
 * Body: { name, description, price, stock, category, image_url }
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;
  const retailerId = req.retailer.id;

  // Insert new product into database
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        retailer_id: retailerId,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        category,
        image_url,
        is_active: true
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: data
  });
});

/**
 * Get all products for the logged-in retailer
 * GET /products
 * Query params: category, is_active, page, limit
 */
const getProducts = asyncHandler(async (req, res) => {
  const retailerId = req.retailer.id;
  const { category, is_active, page = 1, limit = 10 } = req.query;

  // Build query
  let query = supabase
    .from('products')
    .select('*')
    .eq('retailer_id', retailerId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('retailer_id', retailerId);

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
 * Get a single product by ID
 * GET /products/:id
 */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const retailerId = req.retailer.id;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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
 * Update a product
 * PUT /products/:id
 * Body: { name, description, price, stock, category, image_url, is_active }
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const retailerId = req.retailer.id;
  const updateData = req.body;

  // Remove undefined values and prepare update object
  const cleanedData = {};
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      if (key === 'price' && updateData[key] !== null) {
        cleanedData[key] = parseFloat(updateData[key]);
      } else if (key === 'stock' && updateData[key] !== null) {
        cleanedData[key] = parseInt(updateData[key]);
      } else {
        cleanedData[key] = updateData[key];
      }
    }
  });

  // Update product in database
  const { data, error } = await supabase
    .from('products')
    .update(cleanedData)
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: data
  });
});

/**
 * Delete a product
 * DELETE /products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const retailerId = req.retailer.id;

  // Check if product has any orders
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('product_id', id)
    .limit(1);

  if (orderError) {
    throw orderError;
  }

  if (orders && orders.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete product that has existing orders. Consider deactivating it instead.'
    });
  }

  // Delete product from database
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('retailer_id', retailerId);

  if (error) {
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * Toggle product active status
 * PATCH /products/:id/toggle-status
 */
const toggleProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const retailerId = req.retailer.id;

  // Get current product status
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('is_active')
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    throw fetchError;
  }

  // Toggle the status
  const newStatus = !currentProduct.is_active;

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: newStatus })
    .eq('id', id)
    .eq('retailer_id', retailerId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  res.status(200).json({
    success: true,
    message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`,
    data: data
  });
});

/**
 * Get product categories for the retailer
 * GET /products/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const retailerId = req.retailer.id;

  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('retailer_id', retailerId)
    .not('category', 'is', null)
    .order('category');

  if (error) {
    throw error;
  }

  // Extract unique categories
  const categories = [...new Set(data.map(item => item.category))];

  res.status(200).json({
    success: true,
    data: categories
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getCategories
};