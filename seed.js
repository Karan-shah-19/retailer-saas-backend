// seed.js
const { supabaseAdmin } = require('./config/database');

async function seed() {
  try {
    // 1. Create a test retailer
    const { data: retailer, error: retailerError } = await supabaseAdmin
      .from('retailers')
      .insert([
        {
          name: 'Test Retailer',
          email: 'test4@example.com',
          user_id: '06944351-49e0-4b29-b2f2-4e0da4972e45', // replace with an actual Supabase user_id
          theme: 'default',
          primary_color: '#1abc9c',
          secondary_color: '#2ecc71',
          font: 'inter',
          banner_url: 'https://example.com/banner.jpg',
          nav_menu: ['grocery', 'dairy', 'bakery'],
          layout_preference: 'grid',
          contact_info: { email: 'contact@test.com', phone: '+91 99999 99999' },
          social_links: { facebook: 'https://facebook.com/test', instagram: 'https://instagram.com/test' },
          footer_text: '© 2025 Test Retailer. All rights reserved.'
        }
      ])
      .select()
      .single();

    if (retailerError) throw retailerError;
    console.log('Retailer created:', retailer.id);

    // 2. Create 5 products
    const productsToInsert = [
      { retailer_id: retailer.id, name: 'Apples', price: 100, stock: 20, is_active: true, category: 'fruits', image_url: '' },
      { retailer_id: retailer.id, name: 'Milk', price: 50, stock: 0, is_active: true, category: 'dairy', image_url: '' },
      { retailer_id: retailer.id, name: 'Bread', price: 30, stock: 15, is_active: true, category: 'bakery', image_url: '' },
      { retailer_id: retailer.id, name: 'Eggs', price: 10, stock: 0, is_active: true, category: 'dairy', image_url: '' },
      { retailer_id: retailer.id, name: 'Bananas', price: 40, stock: 10, is_active: true, category: 'fruits', image_url: '' }
    ];

    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .insert(productsToInsert)
      .select();

    if (productError) throw productError;
    console.log('Products created:', products.map(p => p.name));

    // 3. Create 5 orders
    const ordersToInsert = [
  { 
    retailer_id: retailer.id, 
    product_id: products[0].id, 
    customer_name: 'John Doe', 
    quantity: 2, 
    unit_price: 50, 
    total_amount: 100, 
    status: 'pending' 
  },
  { 
    retailer_id: retailer.id, 
    product_id: products[1].id, 
    customer_name: 'Jane Smith', 
    quantity: 1, 
    unit_price: 50, 
    total_amount: 50, 
    status: 'delivered' 
  },
  { 
    retailer_id: retailer.id, 
    product_id: products[2].id, 
    customer_name: 'Alice Brown', 
    quantity: 3, 
    unit_price: 10, 
    total_amount: 30, 
    status: 'pending' 
  },
  { 
    retailer_id: retailer.id, 
    product_id: products[3].id, 
    customer_name: 'Bob Johnson', 
    quantity: 1, 
    unit_price: 10, 
    total_amount: 10, 
    status: 'delivered' 
  },
  { 
    retailer_id: retailer.id, 
    product_id: products[4].id, 
    customer_name: 'Charlie Lee', 
    quantity: 4, 
    unit_price: 10, 
    total_amount: 40, 
    status: 'cancelled' 
  }
];

    const { data: orders, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(ordersToInsert)
      .select();

    if (orderError) throw orderError;
    console.log('Orders created:', orders.map(o => o.status));

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  }
}

seed();