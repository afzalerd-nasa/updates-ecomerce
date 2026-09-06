import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ecommerce.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- Roles table
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      permissions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role_id INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles (id)
    );

    -- Admin Users table
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      role TEXT DEFAULT 'Admin',
      department TEXT DEFAULT 'Operations',
      last_login_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image TEXT NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Brands table
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      brand_id INTEGER,
      category_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      original_price REAL NOT NULL,
      discount_price REAL NOT NULL,
      discount_percentage INTEGER DEFAULT 0,
      sku TEXT UNIQUE NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      specifications TEXT, -- JSON string
      features TEXT, -- JSON string
      emi_info TEXT,
      return_policy TEXT DEFAULT '30 Days Hassle-Free Return & Exchange',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    );

    -- Product Images table
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Product Variants table (Sizes, Colors)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT,
      color TEXT,
      color_code TEXT,
      sku TEXT,
      additional_price REAL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 10,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Inventory table
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER UNIQUE NOT NULL,
      sku TEXT NOT NULL,
      available_stock INTEGER DEFAULT 0,
      reserved_stock INTEGER DEFAULT 0,
      sold_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      last_restocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Cart table
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cart Items table
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      selected_size TEXT,
      selected_color TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id) REFERENCES cart (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Wishlist table
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Wishlist Items table
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wishlist_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(wishlist_id, product_id),
      FOREIGN KEY (wishlist_id) REFERENCES wishlist (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Addresses table
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      house_flat TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      country TEXT DEFAULT 'India',
      address_type TEXT DEFAULT 'Home',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      delivery_charge REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      status TEXT DEFAULT 'ORDER PLACED', 
      -- ORDER PLACED -> ORDER CONFIRMED -> PACKED -> SHIPPED -> OUT FOR DELIVERY -> DELIVERED -> CANCELLED -> RETURNED
      delivery_method TEXT DEFAULT 'Standard Delivery',
      expected_delivery_date TEXT NOT NULL,
      tracking_number TEXT,
      shipping_address TEXT NOT NULL, -- JSON string of address
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Order Items table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      selected_size TEXT,
      selected_color TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    -- Payments table (Never stores raw credit card numbers)
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL, -- UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery, Wallet
      payment_status TEXT DEFAULT 'SUCCESS',
      transaction_id TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    -- Coupons table
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL, -- 'PERCENTAGE' or 'FLAT'
      discount_amount REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_discount REAL,
      start_date TEXT,
      expiry_date TEXT,
      usage_limit INTEGER DEFAULT 1000,
      times_used INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Coupon Usage table
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    -- Reviews table
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review_text TEXT NOT NULL,
      is_verified_purchase INTEGER DEFAULT 1,
      helpful_votes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Returns table
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'REQUESTED', -- 'REQUESTED', 'APPROVED', 'PICKED_UP', 'REFUNDED', 'REJECTED'
      refund_amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Refunds table
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER,
      order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT DEFAULT 'PROCESSED',
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO', -- 'ORDER', 'PAYMENT', 'DELIVERY', 'OFFER', 'WISHLIST'
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Indexes for high-performance querying
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(discount_price);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
  `);

  seedData();
}

function seedData() {
  // Check if roles exist
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (roleCount.count === 0) {
    db.prepare("INSERT INTO roles (name, permissions) VALUES ('Customer', 'read:products,write:orders,write:reviews')").run();
    db.prepare("INSERT INTO roles (name, permissions) VALUES ('Admin', 'all:all')").run();
  }

  // Check if admin user exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const customerPass = bcrypt.hashSync('customer123', 10);

    const adminResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role_id)
      VALUES ('Admin Manager', 'admin@updates.com', ?, '+1 800-555-0199', 2)
    `).run(adminPass);

    db.prepare(`
      INSERT INTO admin_users (user_id, role, department)
      VALUES (?, 'Super Admin', 'Executive')
    `).run(adminResult.lastInsertRowid);

    const customerResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role_id)
      VALUES ('Alex Morgan', 'customer@updates.com', ?, '+1 555-014-8899', 1)
    `).run(customerPass);

    const customerId = customerResult.lastInsertRowid;

    // Seed customer address
    db.prepare(`
      INSERT INTO addresses (user_id, full_name, mobile, house_flat, street, city, state, pin_code, country, address_type, is_default)
      VALUES (?, 'Alex Morgan', '+1 555-014-8899', 'Flat 402, Highline Towers', '124 Market Avenue', 'New York', 'NY', '10001', 'United States', 'Home', 1)
    `).run(customerId);

    // Seed Wishlist
    db.prepare(`INSERT INTO wishlist (user_id) VALUES (?)`).run(customerId);
    // Seed Cart
    db.prepare(`INSERT INTO cart (user_id) VALUES (?)`).run(customerId);
  }

  // Seed Categories if empty
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const categories = [
      { name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80', description: 'Trendy apparel, jackets, and everyday wear for men & women' },
      { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', description: 'Audio, home gadgets, smart peripherals and accessories' },
      { name: 'Mobile Phones', slug: 'mobile-phones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80', description: 'Flagship 5G smartphones, foldable screens, and chargers' },
      { name: 'Laptops', slug: 'laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80', description: 'High-performance ultrabooks, gaming rigs, and creator laptops' },
      { name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80', description: 'Luxury skincare, organic cosmetics, and fragrances' },
      { name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80', description: 'Modern cookware, aesthetic decor, and espresso machines' },
      { name: 'Shoes', slug: 'shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', description: 'Athletic runners, street sneakers, and formal leather shoes' },
      { name: 'Watches', slug: 'watches', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80', description: 'Chronographs, luxury automatics, and smart health trackers' },
      { name: 'Jewellery', slug: 'jewellery', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80', description: 'Fine gold, sterling silver, diamonds, and artisanal pendants' },
      { name: 'Grocery', slug: 'grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80', description: 'Gourmet coffee, artisanal snacks, organic pantry essentials' },
      { name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', description: 'Designer leather wallets, sunglasses, belts, and travel bags' },
    ];

    const insertCat = db.prepare('INSERT INTO categories (name, slug, image, description, display_order) VALUES (?, ?, ?, ?, ?)');
    categories.forEach((cat, idx) => {
      insertCat.run(cat.name, cat.slug, cat.image, cat.description, idx + 1);
    });
  }

  // Seed Brands if empty
  const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
  if (brandCount.count === 0) {
    const brands = [
      { name: 'Apple', slug: 'apple', description: 'Innovative tech & consumer electronics' },
      { name: 'Samsung', slug: 'samsung', description: 'Next-generation display and mobile tech' },
      { name: 'Sony', slug: 'sony', description: 'Industry-leading audio, noise cancellation, and gaming' },
      { name: 'Nike', slug: 'nike', description: 'Performance athletic wear and iconic footwear' },
      { name: 'Dell', slug: 'dell', description: 'Reliable high-performance personal computing' },
      { name: 'Bose', slug: 'bose', description: 'Premium acoustic systems and wireless sound' },
      { name: 'Fossil', slug: 'fossil', description: 'Timeless vintage horology and smart craftsmanship' },
      { name: 'Zara', slug: 'zara', description: 'Contemporary high-street fashion and minimalist apparel' },
      { name: 'Philips', slug: 'philips', description: 'Intelligent home appliances and personal care' },
      { name: "L'Oreal", slug: 'loreal', description: 'Global leader in dermatological beauty and cosmetics' },
    ];
    const insertBrand = db.prepare('INSERT INTO brands (name, slug, description) VALUES (?, ?, ?)');
    brands.forEach(b => insertBrand.run(b.name, b.slug, b.description));
  }

  // Seed Products if empty
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (prodCount.count === 0) {
    const sampleProducts = [
      {
        name: 'Apple iPhone 16 Pro Max 256GB - Natural Titanium',
        slug: 'apple-iphone-16-pro-max-256gb',
        brand_name: 'Apple',
        category_name: 'Mobile Phones',
        description: 'iPhone 16 Pro Max forged in grade 5 titanium with the groundbreaking A18 Pro chip, 48MP Fusion camera system, and Camera Control button for instant photo capture.',
        original_price: 1399,
        discount_price: 1199,
        discount_percentage: 14,
        sku: 'IPH-16PM-TI-256',
        stock: 35,
        rating: 4.9,
        reviews: 328,
        is_featured: 1,
        is_trending: 1,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Display': '6.9-inch Super Retina XDR OLED ProMotion 120Hz', 'Processor': 'A18 Pro Hexa-Core 3nm', 'Main Camera': '48MP Fusion + 48MP Ultra-Wide + 12MP 5x Telephoto', 'Battery': 'Up to 33 hours video playback', 'Operating System': 'iOS 18 with Apple Intelligence' }),
        features: JSON.stringify(['Camera Control button for instant depth & zoom', '4K 120 fps Dolby Vision recording', 'Titanium design with textured matte glass back', 'Ceramic Shield front that is 2x tougher than any smartphone glass']),
        emi_info: 'Starts at $99.92/month for 12 months with No Cost EMI',
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '256GB', color: 'Natural Titanium', color_code: '#c2bcad', add_price: 0, stock: 15 },
          { size: '512GB', color: 'Desert Titanium', color_code: '#d4af94', add_price: 200, stock: 12 },
          { size: '1TB', color: 'Black Titanium', color_code: '#2b2c2e', add_price: 400, stock: 8 }
        ]
      },
      {
        name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        slug: 'sony-wh-1000xm5-wireless-headphones',
        brand_name: 'Sony',
        category_name: 'Electronics',
        description: 'Industry-leading noise canceling with two processors and 8 microphones. Specially designed 30mm driver unit delivers crystal clear, studio-grade high-resolution audio.',
        original_price: 399,
        discount_price: 329,
        discount_percentage: 18,
        sku: 'SONY-WH5-BLK',
        stock: 42,
        rating: 4.8,
        reviews: 215,
        is_featured: 1,
        is_trending: 1,
        is_new_arrival: 0,
        specs: JSON.stringify({ 'Driver Unit': '30mm Carbon fiber composite dome', 'Battery Life': '30 hours (NC ON), 40 hours (NC OFF)', 'Quick Charge': '3 min charge gives 3 hours playback', 'Bluetooth': 'v5.2 with LDAC, AAC, SBC codecs', 'Weight': '250g' }),
        features: JSON.stringify(['Auto NC Optimizer adapts to environment and wearing conditions', 'Speak-to-Chat technology pauses playback automatically', 'Multipoint connection pairs with two devices simultaneously', 'Ultra-comfortable soft fit leather headband']),
        emi_info: 'Starts at $27.42/month for 12 months',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: 'Standard', color: 'Midnight Black', color_code: '#18181b', add_price: 0, stock: 22 },
          { size: 'Standard', color: 'Silver Mist', color_code: '#e4e4e7', add_price: 0, stock: 20 }
        ]
      },
      {
        name: 'Dell XPS 16 OLED Laptop (Intel Core Ultra 9 / 32GB RAM / 1TB SSD / RTX 4070)',
        slug: 'dell-xps-16-oled-laptop',
        brand_name: 'Dell',
        category_name: 'Laptops',
        description: 'The pinnacle of laptop engineering. Machined aluminum chassis, zero-lattice keyboard, seamless glass haptic touchpad, and a breathtaking 4K+ InfinityEdge OLED touch display.',
        original_price: 2699,
        discount_price: 2299,
        discount_percentage: 15,
        sku: 'DELL-XPS16-4K',
        stock: 14,
        rating: 4.7,
        reviews: 84,
        is_featured: 1,
        is_trending: 0,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Screen': '16.3-inch 4K+ (3840 x 2400) OLED Touch 500 nits', 'Processor': 'Intel Core Ultra 9 185H (16 Cores, 22 Threads up to 5.1GHz)', 'RAM': '32GB LPDDR5x 7467MHz Dual Channel', 'Graphics': 'NVIDIA GeForce RTX 4070 8GB GDDR6', 'Weight': '2.13 kg' }),
        features: JSON.stringify(['Quad-speaker design tuned by Grammy-award winner Jack Joseph Puig', 'Invisible haptic glass touchpad with seamless wrist rest', 'Thunderbolt 4 ports with 130W USB-PD charging', 'CNC machined aluminum with Gorilla Glass 3']),
        emi_info: 'Starts at $191.58/month for 12 months with zero down payment',
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '32GB / 1TB SSD', color: 'Platinum Silver', color_code: '#cbd5e1', add_price: 0, stock: 9 },
          { size: '64GB / 2TB SSD', color: 'Graphite', color_code: '#334155', add_price: 500, stock: 5 }
        ]
      },
      {
        name: 'Nike Air Zoom Pegasus 41 Road Running Shoes',
        slug: 'nike-air-zoom-pegasus-41',
        brand_name: 'Nike',
        category_name: 'Shoes',
        description: 'Responsive cushioning in the Pegasus provides an energized ride for everyday road runs. Experience lighter-weight energy return with dual Air Zoom units and a ReactX foam midsole.',
        original_price: 155,
        discount_price: 119,
        discount_percentage: 23,
        sku: 'NIKE-PEG41-RED',
        stock: 65,
        rating: 4.8,
        reviews: 412,
        is_featured: 1,
        is_trending: 1,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Weight': '297g (Men size 10)', 'Heel-to-Toe Drop': '10 mm', 'Midsole': 'Upgraded ReactX foam with Dual Air Zoom units', 'Outsole': 'Waffle-inspired rubber with flexible grooves' }),
        features: JSON.stringify(['ReactX foam provides 13% more energy return than standard React', 'Engineered mesh upper for optimized breathability and lockdown', 'Plush collar, tongue, and sockliner for a secure, comfortable fit']),
        emi_info: 'Starts at $19.83/month for 6 months',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: 'US 8', color: 'Crimson Red / Black', color_code: '#ef4444', add_price: 0, stock: 15 },
          { size: 'US 9', color: 'Crimson Red / Black', color_code: '#ef4444', add_price: 0, stock: 20 },
          { size: 'US 10', color: 'Volt White', color_code: '#f8fafc', add_price: 0, stock: 18 },
          { size: 'US 11', color: 'Obsidian Navy', color_code: '#1e293b', add_price: 0, stock: 12 }
        ]
      },
      {
        name: 'Fossil Heritage Automatic Stainless Steel Watch 43mm',
        slug: 'fossil-heritage-automatic-watch-43mm',
        brand_name: 'Fossil',
        category_name: 'Watches',
        description: 'Exquisitely crafted classic automatic timepiece. Features an exhibition dial and caseback that reveals the precision mechanical movement within. 5 ATM water resistance.',
        original_price: 349,
        discount_price: 249,
        discount_percentage: 29,
        sku: 'FOS-HER-AUTO-SLV',
        stock: 28,
        rating: 4.6,
        reviews: 97,
        is_featured: 0,
        is_trending: 1,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Case Size': '43mm', 'Movement': 'Japanese Automatic 21-Jewel', 'Band Material': 'Solid Stainless Steel 3-Link Bracelet', 'Water Resistance': '50 meters / 5 ATM', 'Crystal': 'Scratch-resistant Sapphire' }),
        features: JSON.stringify(['Self-winding mechanical movement powered by motion', 'Luminescent hands and hour markers for low-light visibility', 'Exhibition case back with decorated rotor']),
        emi_info: 'Starts at $20.75/month for 12 months',
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '43mm', color: 'Brushed Silver / Sunray Blue', color_code: '#3b82f6', add_price: 0, stock: 16 },
          { size: '43mm', color: 'Two-Tone Rose Gold', color_code: '#fb7185', add_price: 30, stock: 12 }
        ]
      },
      {
        name: 'Zara Men Italian Structured Wool Blend Overcoat',
        slug: 'zara-men-italian-structured-wool-overcoat',
        brand_name: 'Zara',
        category_name: 'Fashion',
        description: 'Tailored classic tailored silhouette cut from a dense, luxurious Manteco Italian wool blend. Features notch lapels, structured shoulders, front welt pockets, and a clean horn-button closure.',
        original_price: 249,
        discount_price: 179,
        discount_percentage: 28,
        sku: 'ZARA-COAT-CAMEL',
        stock: 25,
        rating: 4.7,
        reviews: 142,
        is_featured: 1,
        is_trending: 1,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Material': '75% Wool, 25% Polyamide (Manteco Italy)', 'Lining': '100% Viscose silky jacquard', 'Fit': 'Regular tailored fit', 'Care': 'Dry clean only' }),
        features: JSON.stringify(['Warm, wind-resistant double-weave fabric', 'Internal chest passport pocket with horn button', 'Single back center vent for ease of motion']),
        emi_info: 'Starts at $29.83/month for 6 months',
        images: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: 'M (38-40)', color: 'Camel Tan', color_code: '#d97706', add_price: 0, stock: 8 },
          { size: 'L (42-44)', color: 'Camel Tan', color_code: '#d97706', add_price: 0, stock: 10 },
          { size: 'XL (46)', color: 'Midnight Charcoal', color_code: '#27272a', add_price: 0, stock: 7 }
        ]
      },
      {
        name: "L'Oreal Revitalift 1.5% Pure Hyaluronic Acid Face Serum 50ml",
        slug: 'loreal-revitalift-hyaluronic-acid-serum',
        brand_name: "L'Oreal",
        category_name: 'Beauty',
        description: 'Dermatologist-validated intensive hydrating serum. Formulated with 0.5% Macro Hyaluronic Acid and 1% Micro Hyaluronic Acid to plump skin, restore radiance, and reduce wrinkles in 1 week.',
        original_price: 42,
        discount_price: 29,
        discount_percentage: 31,
        sku: 'LOR-REVIT-50ML',
        stock: 90,
        rating: 4.9,
        reviews: 512,
        is_featured: 0,
        is_trending: 1,
        is_new_arrival: 0,
        specs: JSON.stringify({ 'Volume': '50 ml / 1.7 fl. oz', 'Skin Type': 'All skin types, non-comedogenic', 'Fragrance': 'Fragrance-free, paraben-free', 'Active Ingredient': '1.5% Pure Hyaluronic Acid' }),
        features: JSON.stringify(['Lightweight gel texture absorbs instantly without sticky residue', 'Visible plumpness and hydration replenishment in 1 hour', 'Safe for sensitive skin & ophthalmologist tested']),
        emi_info: 'Pay in 3 interest-free payments of $9.66',
        images: [
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '30ml', color: 'Clear Dropper', color_code: '#f1f5f9', add_price: -8, stock: 40 },
          { size: '50ml (Best Value)', color: 'Clear Dropper', color_code: '#f1f5f9', add_price: 0, stock: 50 }
        ]
      },
      {
        name: 'Philips Barista Master 5400 Fully Automatic Espresso Machine',
        slug: 'philips-barista-master-5400-espresso-machine',
        brand_name: 'Philips',
        category_name: 'Home & Kitchen',
        description: 'Indulge in 12 distinct coffee drinks with freshly ground beans at the touch of a button. Featuring the LatteGo milk system, intuitive TFT touchscreen display, and 100% ceramic grinders.',
        original_price: 1099,
        discount_price: 849,
        discount_percentage: 23,
        sku: 'PHI-ESP-5400',
        stock: 18,
        rating: 4.8,
        reviews: 178,
        is_featured: 1,
        is_trending: 0,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Pump Pressure': '15 Bar Italian Pump', 'Milk System': 'LatteGo 2-part tube-free system (cleans in 15 seconds)', 'Grinder': '100% Ceramic with 12 grind settings', 'Water Tank': '1.8L AquaClean filter equipped' }),
        features: JSON.stringify(['Intuitive color touchscreen with 4 user custom profiles', 'Extra shot function intensifies flavor without bitterness', 'Dishwasher-safe parts for effortless everyday maintenance']),
        emi_info: 'Starts at $70.75/month for 12 months with No Cost EMI',
        images: [
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '1.8L', color: 'Piano Black / Chrome', color_code: '#18181b', add_price: 0, stock: 12 },
          { size: '1.8L', color: 'Stainless Steel Metallic', color_code: '#94a3b8', add_price: 50, stock: 6 }
        ]
      },
      {
        name: '18K Yellow Gold Solitaire Diamond Pendant Necklace',
        slug: '18k-yellow-gold-solitaire-diamond-necklace',
        brand_name: 'Zara',
        category_name: 'Jewellery',
        description: 'Certified 0.75 Carat brilliant round cut diamond set in a minimalist four-prong 18 Karat solid yellow gold basket. Suspended from an adjustable 16-18 inch delicate diamond-cut cable chain.',
        original_price: 1899,
        discount_price: 1499,
        discount_percentage: 21,
        sku: 'JEW-DIA-18K-075',
        stock: 9,
        rating: 5.0,
        reviews: 64,
        is_featured: 1,
        is_trending: 0,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Metal': '18K Solid Hallmarked Yellow Gold', 'Diamond Carat': '0.75 ct', 'Clarity': 'VVS1 Clarity, F Color Grade', 'Cut': 'Ideal Excellent Cut', 'Chain Length': '16 to 18 inch adjustable with lobster clasp' }),
        features: JSON.stringify(['IGI & GIA laboratory certified grading certificate included', 'Hypoallergenic nickel-free solid gold composition', 'Luxury velvet presentation gift box with LED spotlight']),
        emi_info: 'Starts at $124.91/month for 12 months with zero down payment',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1611591475152-47754b281b37?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '0.75 Carat', color: '18K Yellow Gold', color_code: '#eab308', add_price: 0, stock: 5 },
          { size: '0.75 Carat', color: '18K White Gold', color_code: '#e2e8f0', add_price: 0, stock: 4 }
        ]
      },
      {
        name: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 512GB)',
        slug: 'samsung-galaxy-s24-ultra-5g',
        brand_name: 'Samsung',
        category_name: 'Mobile Phones',
        description: 'Unleash Galaxy AI. Built with a titanium frame, flat 6.8-inch Dynamic AMOLED 2X Corning Gorilla Armor display, built-in S Pen, and 200MP Quad Telephoto Camera system with 100x Space Zoom.',
        original_price: 1419,
        discount_price: 1249,
        discount_percentage: 12,
        sku: 'SAM-S24U-GRY-512',
        stock: 30,
        rating: 4.8,
        reviews: 289,
        is_featured: 1,
        is_trending: 1,
        is_new_arrival: 0,
        specs: JSON.stringify({ 'Display': '6.8-inch QHD+ Dynamic AMOLED 2X 120Hz 2600 nits', 'Processor': 'Snapdragon 8 Gen 3 for Galaxy 4nm', 'Camera': '200MP Main + 50MP 5x Tele + 10MP 3x Tele + 12MP Ultra-wide', 'Battery': '5000 mAh with 45W Fast Charging' }),
        features: JSON.stringify(['Circle to Search with Google instant lookup', 'Live Translate two-way voice interpretation in calls', 'Titanium shield armor with IP68 water resistance']),
        emi_info: 'Starts at $104.08/month for 12 months with No Cost EMI',
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '256GB', color: 'Titanium Gray', color_code: '#64748b', add_price: -100, stock: 12 },
          { size: '512GB', color: 'Titanium Black', color_code: '#1e293b', add_price: 0, stock: 14 },
          { size: '1TB', color: 'Titanium Violet', color_code: '#7c3aed', add_price: 250, stock: 4 }
        ]
      },
      {
        name: 'Bose QuietComfort Ultra Wireless Noise Cancelling Earbuds',
        slug: 'bose-quietcomfort-ultra-earbuds',
        brand_name: 'Bose',
        category_name: 'Electronics',
        description: 'World-class noise cancellation, breakthrough spatial audio with Bose Immersive Audio, and CustomTune technology that customizes sound and silence precisely to the shape of your ears.',
        original_price: 299,
        discount_price: 249,
        discount_percentage: 17,
        sku: 'BOSE-QCU-EAR',
        stock: 38,
        rating: 4.7,
        reviews: 165,
        is_featured: 0,
        is_trending: 1,
        is_new_arrival: 1,
        specs: JSON.stringify({ 'Noise Cancelling': 'CustomTune Active Noise Cancelling & Aware Mode', 'Spatial Sound': 'Bose Immersive Audio', 'Battery': '6 hours per charge (24 hours total with case)', 'Water Resistance': 'IPX4 sweat and weather resistant' }),
        features: JSON.stringify(['Immersive audio makes music feel real and dimensional', 'CustomTune analyzes ear canals for personalized audio calibration', 'Touch controls with volume swipe']),
        emi_info: 'Starts at $20.75/month for 12 months',
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: 'Standard', color: 'Triple Black', color_code: '#09090b', add_price: 0, stock: 20 },
          { size: 'Standard', color: 'White Smoke', color_code: '#f4f4f5', add_price: 0, stock: 18 }
        ]
      },
      {
        name: 'Artisanal Organic Single Origin Colombian Whole Bean Coffee 1kg',
        slug: 'artisanal-organic-colombian-whole-bean-coffee-1kg',
        brand_name: 'Philips',
        category_name: 'Grocery',
        description: '100% Fair-Trade Arabica shade-grown in Huila, Colombia at 1,800m elevation. Medium roast presenting delicate notes of sweet caramel, crisp green apple, and dark chocolate finish.',
        original_price: 39,
        discount_price: 28,
        discount_percentage: 28,
        sku: 'GRO-COF-COL-1KG',
        stock: 120,
        rating: 4.9,
        reviews: 340,
        is_featured: 0,
        is_trending: 1,
        is_new_arrival: 0,
        specs: JSON.stringify({ 'Bean Origin': 'Huila, Colombia', 'Roast Level': 'Medium City Roast', 'Process': 'Washed & Sun-Dried', 'Weight': '1 kg / 2.2 lbs' }),
        features: JSON.stringify(['Degassing valve foil packaging locks in freshly roasted aromatics', 'Roasted in small batches weekly', 'Certified Organic and Rainforest Alliance certified']),
        emi_info: 'Pay in 4 interest-free installments of $7.00',
        images: [
          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80'
        ],
        variants: [
          { size: '500g', color: 'Kraft Valve Bag', color_code: '#78350f', add_price: -10, stock: 50 },
          { size: '1kg (Best Value)', color: 'Kraft Valve Bag', color_code: '#78350f', add_price: 0, stock: 70 }
        ]
      }
    ];

    const getBrandId = db.prepare('SELECT id FROM brands WHERE name = ?');
    const getCatId = db.prepare('SELECT id FROM categories WHERE name = ?');
    const insertProduct = db.prepare(`
      INSERT INTO products (
        name, slug, brand_id, category_id, description, original_price, discount_price,
        discount_percentage, sku, stock_quantity, rating, review_count, is_featured,
        is_trending, is_new_arrival, status, specifications, features, emi_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `);
    const insertImage = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
    const insertVariant = db.prepare('INSERT INTO product_variants (product_id, size, color, color_code, additional_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)');
    const insertInventory = db.prepare('INSERT INTO inventory (product_id, sku, available_stock, reserved_stock, sold_quantity, low_stock_threshold) VALUES (?, ?, ?, 0, ?, ?)');
    const insertReview = db.prepare("INSERT INTO reviews (product_id, user_id, user_name, rating, review_text, is_verified_purchase, helpful_votes, status) VALUES (?, 2, ?, ?, ?, 1, ?, 'approved')");

    sampleProducts.forEach((p, idx) => {
      const bRow = getBrandId.get(p.brand_name) as { id: number } | undefined;
      const cRow = getCatId.get(p.category_name) as { id: number } | undefined;
      const brandId = bRow ? bRow.id : 1;
      const catId = cRow ? cRow.id : 1;

      const pRes = insertProduct.run(
        p.name, p.slug, brandId, catId, p.description, p.original_price, p.discount_price,
        p.discount_percentage, p.sku, p.stock, p.rating, p.reviews, p.is_featured,
        p.is_trending, p.is_new_arrival, p.specs, p.features, p.emi_info
      );
      const prodId = pRes.lastInsertRowid;

      p.images.forEach((img, imgIdx) => {
        insertImage.run(prodId, img, imgIdx === 0 ? 1 : 0, imgIdx + 1);
      });

      p.variants.forEach(v => {
        insertVariant.run(prodId, v.size, v.color, v.color_code, v.add_price, v.stock);
      });

      insertInventory.run(prodId, p.sku, p.stock, Math.floor(Math.random() * 40) + 10, p.stock <= 10 ? 10 : 5);

      // Seed 2 realistic reviews per product
      insertReview.run(prodId, 'Sarah Jenkins', 5, 'Absolutely blown away by the quality! Shipping took only 2 days and the packaging was ultra-secure. 10/10 recommend Updates E-Commerce.', 14);
      insertReview.run(prodId, 'David Ross', 4, 'Solid build, performs exactly as advertised in the description. Great discount compared to other retail stores.', 8);
    });
  }

  // Seed Coupons if empty
  const couponCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get() as { count: number };
  if (couponCount.count === 0) {
    const coupons = [
      { code: 'WELCOME10', type: 'PERCENTAGE', amount: 10, min_order: 50, max_discount: 50, limit: 1000 },
      { code: 'BIGSALE20', type: 'PERCENTAGE', amount: 20, min_order: 100, max_discount: 100, limit: 500 },
      { code: 'FLAT50', type: 'FLAT', amount: 50, min_order: 300, max_discount: 50, limit: 300 },
      { code: 'FESTIVE15', type: 'PERCENTAGE', amount: 15, min_order: 80, max_discount: 75, limit: 1000 },
    ];
    const insCoupon = db.prepare('INSERT INTO coupons (code, discount_type, discount_amount, min_order, max_discount, usage_limit, times_used, is_active) VALUES (?, ?, ?, ?, ?, ?, 12, 1)');
    coupons.forEach(c => insCoupon.run(c.code, c.type, c.amount, c.min_order, c.max_discount, c.limit));
  }

  // Seed Sample Orders for Customer
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, user_id, total_amount, discount_amount, delivery_charge, tax_amount, grand_total, status, delivery_method, expected_delivery_date, tracking_number, shipping_address)
      VALUES (?, 2, ?, ?, 0, ?, ?, ?, 'Standard Delivery', ?, ?, ?)
    `);

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price, selected_size, selected_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (order_id, payment_method, payment_status, transaction_id, amount)
      VALUES (?, ?, 'SUCCESS', ?, ?)
    `);

    const addrJson = JSON.stringify({
      name: 'Alex Morgan',
      mobile: '+1 555-014-8899',
      address: 'Flat 402, Highline Towers, 124 Market Avenue, New York, NY 10001'
    });

    // Order 1: Delivered
    const o1 = insertOrder.run(
      'ORD-782910',
      329,
      32.9,
      23.68,
      319.78,
      'DELIVERED',
      'August 28, 2026',
      'TRK-FEDEX-99281',
      addrJson
    );
    insertOrderItem.run(
      o1.lastInsertRowid,
      2,
      'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      1,
      329,
      329,
      'Standard',
      'Midnight Black'
    );
    insertPayment.run(o1.lastInsertRowid, 'Credit Card', 'TXN-99881122', 319.78);

    // Order 2: Out for delivery
    const o2 = insertOrder.run(
      'ORD-839214',
      119,
      0,
      9.52,
      128.52,
      'OUT FOR DELIVERY',
      'Tomorrow by 5:00 PM',
      'TRK-BLUEDART-44312',
      addrJson
    );
    insertOrderItem.run(
      o2.lastInsertRowid,
      4,
      'Nike Air Zoom Pegasus 41 Road Running Shoes',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      1,
      119,
      119,
      'US 10',
      'Crimson Red / Black'
    );
    insertPayment.run(o2.lastInsertRowid, 'UPI', 'TXN-77334411', 128.52);

    // Seed notifications for Alex
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link)
      VALUES (2, ?, ?, ?, ?, ?)
    `);
    insertNotif.run('Order Shipped!', 'Your order #ORD-839214 has been dispatched via BlueDart Express.', 'DELIVERY', 0, '/orders');
    insertNotif.run('Weekend Tech Sale is Live!', 'Get up to 25% off premium audio & flagships with coupon BIGSALE20.', 'OFFER', 0, '/products?category=electronics');
    insertNotif.run('Order Delivered', 'Order #ORD-782910 was handed directly to resident.', 'ORDER', 1, '/orders');
  }
}
