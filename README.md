# Retailer SaaS Backend - Complete Setup Guide

A comprehensive Node.js + Express + Supabase backend for a customizable SaaS web platform designed for local retailers.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Supabase Setup](#supabase-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Authentication System**: Complete user registration/login with Supabase Auth
- **Product Management**: CRUD operations for products with categories and inventory
- **Order Management**: Order creation, tracking, and status updates
- **Retailer Customization**: Store settings, themes, and branding options
- **Dashboard Analytics**: Sales statistics and business insights
- **Security**: JWT authentication, input validation, and SQL injection protection
- **Error Handling**: Comprehensive error handling with meaningful messages
- **API Documentation**: Well-documented RESTful API endpoints

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Supabase Account** (free tier available)

Check your installations:
```bash
node --version
npm --version
git --version
```

## 🚀 Installation

### Step 1: Clone and Setup Project

```bash
# Clone the repository (or create the project structure manually)
git clone <your-repo-url>
cd retailer-saas-backend

# Or create from scratch
mkdir retailer-saas-backend
cd retailer-saas-backend
```

### Step 2: Initialize Project

```bash
# Initialize npm project
npm init -y

# Install dependencies
npm install express cors helmet dotenv @supabase/supabase-js bcryptjs jsonwebtoken express-validator morgan

# Install development dependencies
npm install --save-dev nodemon
```

### Step 3: Create Folder Structure

```bash
# Create all necessary directories
mkdir config controllers middleware routes utils

# Create main files
touch server.js .env .env.example .gitignore README.md
```

## 🗄️ Supabase Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `retailer-saas-db`
   - **Database Password**: Use a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for setup to complete (2-3 minutes)

### 2. Get Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role key** (also starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### 3. Enable Row Level Security

1. Go to **Authentication** → **Settings**
2. Ensure **Enable Row Level Security** is turned ON
3. Set **Site URL** to `http://localhost:3000` (for development)

## 🔐 Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Fill in Your Environment Variables

Edit the `.env` file with your actual values:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration (replace with your actual values)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

**Important**: 
- Replace `your-project-id` with your actual Supabase project ID
- Replace the keys with your actual Supabase keys
- Generate a strong JWT secret (at least 32 characters)

## 🗃️ Database Setup

### 1. Create Tables in Supabase

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- 1. RETAILERS TABLE
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  theme VARCHAR(50) DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES
CREATE INDEX idx_retailers_user_id ON retailers(user_id);
CREATE INDEX idx_retailers_email ON retailers(email);
CREATE INDEX idx_products_retailer_id ON products(retailer_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 5. CREATE UPDATE TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- 6. CREATE TRIGGERS
CREATE TRIGGER update_retailers_updated_at 
    BEFORE UPDATE ON retailers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 8. CREATE RLS POLICIES
-- Retailers can only access their own data
CREATE POLICY "Retailers can view own data" ON retailers 
    FOR ALL USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Retailers can manage own products" ON products 
    FOR ALL USING (retailer_id IN (
        SELECT id FROM retailers WHERE user_id = auth.uid()
    ));

-- Orders policies
CREATE POLICY "Retailers can manage own orders" ON orders 
    FOR ALL USING (retailer_id IN (
        SELECT id FROM retailers WHERE user_id = auth.uid()
    ));
```

5. Click **Run** to execute the SQL
6. You should see "Success. No rows returned" message

### 2. Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see three tables: `retailers`, `products`, and `orders`
3. Check that the relationships are properly set up

## 🏃‍♂️ Running the Application

### 1. Development Mode

```bash
# Start the development server with hot reload
npm run dev
```

### 2. Production Mode

```bash
# Start the production server
npm start
```

### 3. Verify Server is Running

Open your browser and go to:
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **API Docs**: [http://localhost:5000/api](http://localhost:5000/api)

You should see JSON responses confirming the server is running.

## 📝 Testing the API

### 1. Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Electronics Store",
    "email": "test@electronics.com",
    "password": "password123"
  }'
```

### 2. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@electronics.com",
    "password": "password123"
  }'
```

Copy the `access_token` from the response for the next steps.

### 3. Test Protected Route

```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 🚧 Troubleshooting

### Common Issues and Solutions

#### 1. "Cannot connect to Supabase"
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check if your Supabase project is active
- Ensure you have internet connection

#### 2. "Table doesn't exist"
- Make sure you ran all the SQL commands in Supabase SQL Editor
- Check if tables were created in Table Editor
- Verify RLS policies are enabled

#### 3. "Authentication failed"
- Check if Row Level Security is enabled
- Verify JWT secret is properly set
- Ensure you're sending the correct token format: `Bearer <token>`

#### 4. "Port already in use"
```bash
# Kill process using port 5000
sudo lsof -t -i tcp:5000 | xargs kill -9
# Or change PORT in .env file
```

#### 5. "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new retailer
- `POST /api/auth/login` - Login retailer
- `POST /api/auth/logout` - Logout retailer
- `GET /api/auth/me` - Get current user profile

### Product Endpoints
- `POST /api/products` - Create product
- `GET /api/products` - List products
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Order Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Retailer Endpoints
- `GET /api/retailer/settings` - Get settings
- `PUT /api/retailer/settings` - Update settings
- `GET /api/retailer/dashboard` - Get dashboard stats

## 🚀 Next Steps

Now that your backend is running:

1. **Test all endpoints** using the provided examples
2. **Create a frontend** (React, Vue, or any framework)
3. **Add file upload** for product images
4. **Implement email notifications** for orders
5. **Add payment processing** (Stripe, PayPal)
6. **Deploy to production** (Heroku, Railway, DigitalOcean)

## 🔐 Security Considerations

- Always use HTTPS in production
- Keep your service role key secure
- Implement rate limiting for production
- Regular security audits
- Keep dependencies updated

## 📞 Support

If you encounter any issues:
1. Check this README thoroughly
2. Verify all environment variables
3. Check Supabase dashboard for errors
4. Review server logs for error messages

Your backend is now ready to connect with any frontend application!