import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import { generateToken, requireAuth, requireAdmin, optionalAuth, type AuthenticatedRequest } from './auth.ts';

export const apiRouter = express.Router();

// ==========================================
// 1. AUTHENTICATION & USER PROFILE
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role_id)
      VALUES (?, ?, ?, ?, 1)
    `).run(name.trim(), email.toLowerCase().trim(), passwordHash, phone || null);

    const userId = Number(result.lastInsertRowid);
    db.prepare('INSERT INTO wishlist (user_id) VALUES (?)').run(userId);
    db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);

    const token = generateToken({
      userId,
      email: email.toLowerCase().trim(),
      roleId: 1,
      roleName: 'Customer',
    });

    res.status(201).json({
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), phone, role: 'Customer' },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role_id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.email) = ?
    `).get(email.toLowerCase().trim()) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role_name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role_name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role_id, r.name as role_name, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(req.user!.userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role_name,
        created_at: user.created_at,
      },
      addresses,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

apiRouter.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.userId) as any;
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.userId);

    res.json({ message: 'Password successfully updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

// ==========================================
// 2. CATEGORIES & BRANDS
// ==========================================

apiRouter.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `).all();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/brands', (req, res) => {
  try {
    const brands = db.prepare(`
      SELECT b.*, COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
      GROUP BY b.id
      ORDER BY b.name ASC
    `).all();
    res.json(brands);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. SEARCH AUTOCOMPLETE & "DID YOU MEAN"
// ==========================================

apiRouter.get('/products/search/suggestions', (req, res) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json({ suggestions: [], didYouMean: null });
    }

    const products = db.prepare(`
      SELECT id, name, sku, slug, discount_price
      FROM products
      WHERE status = 'active' AND (
        LOWER(name) LIKE ? OR LOWER(sku) LIKE ?
      )
      LIMIT 6
    `).all(`%${q}%`, `%${q}%`);

    // "Did you mean" fuzzy logic
    let didYouMean: string | null = null;
    if (products.length === 0) {
      // Check common typos e.g., 'iphoen' -> 'iphone', 'nikee' -> 'nike', 'lapotp' -> 'laptop', 'soni' -> 'sony'
      const dictionary: Record<string, string> = {
        'iphoen': 'iphone',
        'ipon': 'iphone',
        'samung': 'samsung',
        'samsng': 'samsung',
        'hedphone': 'headphones',
        'hedfones': 'headphones',
        'lapotp': 'laptop',
        'laptp': 'laptop',
        'nik': 'nike',
        'nikee': 'nike',
        'snkr': 'sneakers',
        'shos': 'shoes',
        'wtch': 'watch',
        'watche': 'watch',
        'soni': 'sony',
        'philips': 'philips',
        'coffe': 'coffee',
      };

      for (const [typo, correction] of Object.entries(dictionary)) {
        if (q.includes(typo)) {
          didYouMean = q.replace(typo, correction);
          break;
        }
      }
    }

    res.json({ suggestions: products, didYouMean });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. PRODUCTS LISTING & DETAILS
// ==========================================

apiRouter.get('/products', (req, res) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      discount,
      inStock,
      sort,
      isFeatured,
      isTrending,
      isNewArrival,
      page = '1',
      limit = '12',
    } = req.query;

    let query = `
      SELECT p.*, b.name as brand_name, c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;
    const params: any[] = [];

    if (q) {
      query += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(b.name) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(p.sku) LIKE ?)`;
      const term = `%${(q as string).toLowerCase().trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (category) {
      query += ` AND (LOWER(c.slug) = ? OR LOWER(c.name) = ?)`;
      params.push((category as string).toLowerCase(), (category as string).toLowerCase());
    }

    if (brand) {
      query += ` AND (LOWER(b.slug) = ? OR LOWER(b.name) = ?)`;
      params.push((brand as string).toLowerCase(), (brand as string).toLowerCase());
    }

    if (minPrice) {
      query += ` AND p.discount_price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.discount_price <= ?`;
      params.push(Number(maxPrice));
    }

    if (rating) {
      query += ` AND p.rating >= ?`;
      params.push(Number(rating));
    }

    if (discount) {
      query += ` AND p.discount_percentage >= ?`;
      params.push(Number(discount));
    }

    if (inStock === 'true') {
      query += ` AND p.stock_quantity > 0`;
    }

    if (isFeatured === '1') {
      query += ` AND p.is_featured = 1`;
    }

    if (isTrending === '1') {
      query += ` AND p.is_trending = 1`;
    }

    if (isNewArrival === '1') {
      query += ` AND p.is_new_arrival = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price_low_high':
        query += ` ORDER BY p.discount_price ASC`;
        break;
      case 'price_high_low':
        query += ` ORDER BY p.discount_price DESC`;
        break;
      case 'rating':
        query += ` ORDER BY p.rating DESC, p.review_count DESC`;
        break;
      case 'newest':
        query += ` ORDER BY p.id DESC`;
        break;
      case 'popular':
      default:
        query += ` ORDER BY p.review_count DESC, p.rating DESC`;
        break;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const countRes = db.prepare(countQuery).get(...params) as { total: number };

    // Get paginated rows
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const products = db.prepare(query).all(...params);

    res.json({
      products,
      pagination: {
        total: countRes.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countRes.total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/products/:id', (req, res) => {
  try {
    const idOrSlug = req.params.id;
    let product: any;

    if (!isNaN(Number(idOrSlug))) {
      product = db.prepare(`
        SELECT p.*, b.name as brand_name, c.name as category_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `).get(Number(idOrSlug));
    } else {
      product = db.prepare(`
        SELECT p.*, b.name as brand_name, c.name as category_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `).get(idOrSlug);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Images
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC').all(product.id);
    // Variants
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
    // Inventory
    const inventory = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(product.id);
    // Reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.id DESC
      LIMIT 20
    `).all(product.id);

    // Parse specs and features
    try {
      product.specifications = product.specifications ? JSON.parse(product.specifications) : {};
    } catch {
      product.specifications = {};
    }

    try {
      product.features = product.features ? JSON.parse(product.features) : [];
    } catch {
      product.features = [];
    }

    res.json({
      product,
      images,
      variants,
      inventory,
      reviews,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. SHOPPING CART
// ==========================================

apiRouter.get('/cart', optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const sessionId = (req.query.sessionId as string) || 'guest-session';

    let cart: any;
    if (userId) {
      cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(userId);
      if (!cart) {
        const cRes = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
        cart = { id: cRes.lastInsertRowid };
      }
    } else {
      cart = db.prepare('SELECT id FROM cart WHERE session_id = ?').get(sessionId);
      if (!cart) {
        const cRes = db.prepare('INSERT INTO cart (session_id) VALUES (?)').run(sessionId);
        cart = { id: cRes.lastInsertRowid };
      }
    }

    const items = db.prepare(`
      SELECT ci.*, p.name as product_name, p.slug as product_slug, p.discount_price, p.original_price,
        p.stock_quantity as available_stock,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC
    `).all(cart.id);

    res.json({ cartId: cart.id, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/cart/add', optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { productId, variantId, quantity = 1, selectedSize, selectedColor, sessionId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = db.prepare('SELECT id, discount_price, stock_quantity FROM products WHERE id = ?').get(productId) as any;
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const userId = req.user?.userId;
    let cart: any;
    if (userId) {
      cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(userId);
      if (!cart) {
        const cRes = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
        cart = { id: cRes.lastInsertRowid };
      }
    } else {
      const sess = sessionId || 'guest-session';
      cart = db.prepare('SELECT id FROM cart WHERE session_id = ?').get(sess);
      if (!cart) {
        const cRes = db.prepare('INSERT INTO cart (session_id) VALUES (?)').run(sess);
        cart = { id: cRes.lastInsertRowid };
      }
    }

    // Check if item already exists in cart with same variant/size/color
    const existing = db.prepare(`
      SELECT id, quantity FROM cart_items 
      WHERE cart_id = ? AND product_id = ? 
      AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))
      AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
    `).get(
      cart.id,
      productId,
      selectedSize || null,
      selectedSize || null,
      selectedColor || null,
      selectedColor || null
    ) as any;

    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
    } else {
      db.prepare(`
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, selected_size, selected_color)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        cart.id,
        productId,
        variantId || null,
        Number(quantity),
        product.discount_price,
        selectedSize || null,
        selectedColor || null
      );
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/cart/item/:id', (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = Number(req.params.id);
    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
    } else {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, itemId);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/cart/item/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(Number(req.params.id));
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/cart/clear', optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.query.sessionId as string;

    if (userId) {
      const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(userId) as any;
      if (cart) {
        db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
      }
    } else if (sessionId) {
      const cart = db.prepare('SELECT id FROM cart WHERE session_id = ?').get(sessionId) as any;
      if (cart) {
        db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. WISHLIST
// ==========================================

apiRouter.get('/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    let wishlist = db.prepare('SELECT id FROM wishlist WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      const wRes = db.prepare('INSERT INTO wishlist (user_id) VALUES (?)').run(userId);
      wishlist = { id: wRes.lastInsertRowid };
    }

    const items = db.prepare(`
      SELECT wi.id as wishlist_item_id, wi.added_at, p.*, b.name as brand_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE wi.wishlist_id = ?
      ORDER BY wi.id DESC
    `).all(wishlist.id);

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/wishlist/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user!.userId;

    let wishlist = db.prepare('SELECT id FROM wishlist WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      const wRes = db.prepare('INSERT INTO wishlist (user_id) VALUES (?)').run(userId);
      wishlist = { id: wRes.lastInsertRowid };
    }

    const existing = db.prepare('SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').get(wishlist.id, productId);

    if (existing) {
      db.prepare('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').run(wishlist.id, productId);
      res.json({ added: false, message: 'Removed from wishlist' });
    } else {
      db.prepare('INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)').run(wishlist.id, productId);
      res.json({ added: true, message: 'Added to wishlist' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/wishlist/move-to-cart', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user!.userId;

    const wishlist = db.prepare('SELECT id FROM wishlist WHERE user_id = ?').get(userId) as any;
    if (wishlist) {
      db.prepare('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').run(wishlist.id, productId);
    }

    let cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(userId) as any;
    if (!cart) {
      const cRes = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
      cart = { id: cRes.lastInsertRowid };
    }

    const product = db.prepare('SELECT discount_price FROM products WHERE id = ?').get(productId) as any;
    if (product) {
      db.prepare(`
        INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
        VALUES (?, ?, 1, ?)
      `).run(cart.id, productId, product.discount_price);
    }

    res.json({ success: true, message: 'Moved item from wishlist to cart' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. COUPON VALIDATION
// ==========================================

apiRouter.post('/coupons/validate', (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = db.prepare(`
      SELECT * FROM coupons 
      WHERE UPPER(code) = UPPER(?) AND is_active = 1
    `).get(code.trim()) as any;

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    if (orderAmount < coupon.min_order) {
      return res.status(400).json({ error: `Minimum order of $${coupon.min_order} required for this coupon` });
    }

    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (orderAmount * coupon.discount_amount) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_amount;
    }

    discount = Math.min(discount, orderAmount);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountAmount: discount,
      message: `Coupon ${coupon.code} applied successfully! You saved $${discount.toFixed(2)}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. CHECKOUT & ORDERS
// ==========================================

apiRouter.post('/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const {
      items,
      shippingAddress,
      deliveryMethod = 'Standard Delivery',
      paymentMethod = 'Credit Card',
      couponCode,
      notes,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order must contain at least one product' });
    }

    if (!shippingAddress || !shippingAddress.house_flat || !shippingAddress.city) {
      return res.status(400).json({ error: 'Complete delivery address is required' });
    }

    // Calculate subtotal
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += Number(item.unit_price) * Number(item.quantity);
    });

    // Calculate coupon discount
    let discountAmount = 0;
    let appliedCoupon: any = null;
    if (couponCode) {
      appliedCoupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(couponCode.trim()) as any;
      if (appliedCoupon && subtotal >= appliedCoupon.min_order) {
        if (appliedCoupon.discount_type === 'PERCENTAGE') {
          discountAmount = (subtotal * appliedCoupon.discount_amount) / 100;
          if (appliedCoupon.max_discount && discountAmount > appliedCoupon.max_discount) {
            discountAmount = appliedCoupon.max_discount;
          }
        } else {
          discountAmount = appliedCoupon.discount_amount;
        }
      }
    }

    const deliveryCharge = deliveryMethod === 'Express Delivery' ? 9.99 : (subtotal > 50 ? 0 : 4.99);
    const taxRate = 0.08; // 8% tax
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
    const grandTotal = Number((taxableAmount + deliveryCharge + taxAmount).toFixed(2));

    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Expected delivery calculation
    const daysToAdd = deliveryMethod === 'Express Delivery' ? 2 : 4;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysToAdd);
    const expectedDeliveryDate = expectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const orderRes = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, total_amount, discount_amount, delivery_charge,
        tax_amount, grand_total, status, delivery_method, expected_delivery_date,
        tracking_number, shipping_address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ORDER PLACED', ?, ?, ?, ?, ?)
    `).run(
      orderNumber,
      userId,
      subtotal,
      discountAmount,
      deliveryCharge,
      taxAmount,
      grandTotal,
      deliveryMethod,
      expectedDeliveryDate,
      trackingNumber,
      JSON.stringify(shippingAddress),
      notes || null
    );

    const orderId = Number(orderRes.lastInsertRowid);

    // Insert order items & decrement inventory
    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_image, quantity,
        unit_price, total_price, selected_size, selected_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateProductStock = db.prepare('UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?');
    const updateInventory = db.prepare('UPDATE inventory SET available_stock = MAX(0, available_stock - ?), sold_quantity = sold_quantity + ? WHERE product_id = ?');

    items.forEach((item: any) => {
      const itemTotal = Number(item.unit_price) * Number(item.quantity);
      insertItem.run(
        orderId,
        item.product_id,
        item.product_name,
        item.product_image || '',
        item.quantity,
        item.unit_price,
        itemTotal,
        item.selected_size || null,
        item.selected_color || null
      );

      // Decrement stock
      updateProductStock.run(item.quantity, item.product_id);
      updateInventory.run(item.quantity, item.quantity, item.product_id);
    });

    // Create payment record
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO payments (order_id, payment_method, payment_status, transaction_id, amount)
      VALUES (?, ?, 'SUCCESS', ?, ?)
    `).run(orderId, paymentMethod, transactionId, grandTotal);

    // Update coupon usage if applicable
    if (appliedCoupon) {
      db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?').run(appliedCoupon.id);
      db.prepare('INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)').run(appliedCoupon.id, userId, orderId);
    }

    // Clear user's cart
    const userCart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(userId) as any;
    if (userCart) {
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(userCart.id);
    }

    // Create notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'ORDER', ?)
    `).run(
      userId,
      'Order Confirmed!',
      `Your order #${orderNumber} has been successfully placed. Expected delivery by ${expectedDeliveryDate}.`,
      `/orders`
    );

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        trackingNumber,
        grandTotal,
        subtotal,
        discountAmount,
        deliveryCharge,
        taxAmount,
        expectedDeliveryDate,
        paymentMethod,
        transactionId,
        itemsCount: items.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Order creation failed' });
  }
});

apiRouter.get('/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const orders = db.prepare(`
      SELECT o.*, p.payment_method, p.payment_status
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `).all(userId) as any[];

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map(ord => ({
      ...ord,
      shipping_address: ord.shipping_address ? JSON.parse(ord.shipping_address) : null,
      items: getItems.all(ord.id),
    }));

    res.json(ordersWithItems);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/orders/track/:orderNumber', (req, res) => {
  try {
    const orderNumber = req.params.orderNumber.trim();
    const order = db.prepare(`
      SELECT o.*, p.payment_method, p.payment_status
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE UPPER(o.order_number) = UPPER(?) OR UPPER(o.tracking_number) = UPPER(?)
    `).get(orderNumber, orderNumber) as any;

    if (!order) {
      return res.status(404).json({ error: 'Order not found with this tracking or order number' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    const statuses = [
      'ORDER PLACED',
      'ORDER CONFIRMED',
      'PACKED',
      'SHIPPED',
      'OUT FOR DELIVERY',
      'DELIVERED',
    ];

    const currentIndex = statuses.indexOf(order.status.toUpperCase());

    res.json({
      order: {
        ...order,
        shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
        items,
        currentStepIndex: currentIndex >= 0 ? currentIndex : 0,
        timeline: statuses.map((status, index) => ({
          status,
          completed: currentIndex >= index,
          current: currentIndex === index,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. REVIEWS & RATINGS
// ==========================================

apiRouter.post('/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { productId, rating, reviewText } = req.body;

    if (!productId || !rating || !reviewText) {
      return res.status(400).json({ error: 'Product, rating (1-5), and review text are required' });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;

    // Check if user bought this product
    const purchased = db.prepare(`
      SELECT oi.id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.product_id = ?
    `).get(userId, productId);

    db.prepare(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, review_text, is_verified_purchase, status)
      VALUES (?, ?, ?, ?, ?, ?, 'approved')
    `).run(productId, userId, user?.name || 'Customer', Number(rating), reviewText.trim(), purchased ? 1 : 0);

    // Update product rating and review count
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
    `).get(productId) as any;

    if (stats) {
      db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
        Number(stats.avg_rating.toFixed(1)),
        stats.total_reviews,
        productId
      );
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/reviews/:id/helpful', (req, res) => {
  try {
    db.prepare('UPDATE reviews SET helpful_votes = helpful_votes + 1 WHERE id = ?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY id DESC 
      LIMIT 20
    `).all(req.user!.userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user!.userId) as { count: number };

    res.json({ notifications, unreadCount: unreadCount.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user!.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 11. ADDRESSES
// ==========================================

apiRouter.get('/addresses', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user!.userId);
    res.json(addresses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/addresses', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { fullName, mobile, houseFlat, street, city, state, pinCode, country = 'India', addressType = 'Home', isDefault } = req.body;

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }

    const resDb = db.prepare(`
      INSERT INTO addresses (user_id, full_name, mobile, house_flat, street, city, state, pin_code, country, address_type, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, fullName, mobile, houseFlat, street, city, state, pinCode, country, addressType, isDefault ? 1 : 0);

    res.status(201).json({ id: resDb.lastInsertRowid, message: 'Address saved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 12. ADMIN PANEL & MANAGEMENT APIS
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, (req, res) => {
  try {
    const totalSales = db.prepare("SELECT COALESCE(SUM(grand_total), 0) as total FROM orders WHERE status != 'CANCELLED'").get() as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = 1').get() as any;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('ORDER PLACED', 'ORDER CONFIRMED', 'PACKED', 'SHIPPED')").get() as any;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'DELIVERED'").get() as any;
    const totalReturns = db.prepare('SELECT COUNT(*) as count FROM returns').get() as any;

    const lowStockItems = db.prepare(`
      SELECT p.id, p.name, p.sku, p.stock_quantity, i.low_stock_threshold
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE p.stock_quantity <= i.low_stock_threshold
      LIMIT 10
    `).all();

    const recentOrders = db.prepare(`
      SELECT o.id, o.order_number, o.grand_total, o.status, o.created_at, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
      LIMIT 6
    `).all();

    res.json({
      totalSales: totalSales.total,
      totalOrders: totalOrders.count,
      totalCustomers: totalCustomers.count,
      totalProducts: totalProducts.count,
      pendingOrders: pendingOrders.count,
      completedOrders: completedOrders.count,
      totalReturns: totalReturns.count,
      revenue: totalSales.total,
      lowStockItems,
      recentOrders,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/admin/orders', requireAdmin, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, p.payment_method, p.payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.id DESC
    `).all() as any[];

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map(o => ({
      ...o,
      shipping_address: o.shipping_address ? JSON.parse(o.shipping_address) : null,
      items: getItems.all(o.id),
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/admin/orders/:id/status', requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const orderId = Number(req.params.id);

    const validStatuses = [
      'ORDER PLACED',
      'ORDER CONFIRMED',
      'PACKED',
      'SHIPPED',
      'OUT FOR DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, orderId);

    // Notify user
    const order = db.prepare('SELECT order_number, user_id FROM orders WHERE id = ?').get(orderId) as any;
    if (order) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, ?, ?, 'DELIVERY', '/orders')
      `).run(
        order.user_id,
        `Order Update: #${order.order_number}`,
        `Your order status has been updated to: ${status}.`
      );
    }

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/admin/inventory', requireAdmin, (req, res) => {
  try {
    const inventory = db.prepare(`
      SELECT i.*, p.name as product_name, p.sku, p.original_price, p.discount_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY (i.available_stock <= i.low_stock_threshold) DESC, i.available_stock ASC
    `).all();
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/admin/inventory/restock', requireAdmin, (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid product ID and positive quantity required' });
    }

    db.prepare('UPDATE inventory SET available_stock = available_stock + ?, last_restocked_at = CURRENT_TIMESTAMP WHERE product_id = ?').run(quantity, productId);
    db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?').run(quantity, productId);

    res.json({ success: true, message: `Successfully added ${quantity} units to inventory` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/admin/customers', requireAdmin, (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.grand_total), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role_id = 1
      GROUP BY u.id
      ORDER BY total_spent DESC
    `).all();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/admin/products', requireAdmin, (req, res) => {
  try {
    const {
      name,
      brand_id,
      category_id,
      description,
      original_price,
      discount_price,
      sku,
      stock_quantity,
      images = [],
      specifications = {},
      features = [],
      emi_info,
    } = req.body;

    if (!name || !category_id || !original_price || !sku) {
      return res.status(400).json({ error: 'Name, category, original price, and SKU are required' });
    }

    const discPrice = discount_price || original_price;
    const discountPerc = Math.round(((original_price - discPrice) / original_price) * 100);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const pRes = db.prepare(`
      INSERT INTO products (
        name, slug, brand_id, category_id, description, original_price, discount_price,
        discount_percentage, sku, stock_quantity, rating, review_count, is_featured,
        is_trending, is_new_arrival, status, specifications, features, emi_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 1, 1, 1, 1, 'active', ?, ?, ?)
    `).run(
      name,
      slug,
      brand_id || 1,
      category_id,
      description || '',
      Number(original_price),
      Number(discPrice),
      discountPerc,
      sku,
      Number(stock_quantity || 20),
      JSON.stringify(specifications),
      JSON.stringify(features),
      emi_info || `EMI starting from $${(discPrice / 12).toFixed(2)}/mo`
    );

    const prodId = Number(pRes.lastInsertRowid);

    // Insert images
    if (images.length > 0) {
      const insImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
      images.forEach((img: string, idx: number) => {
        insImg.run(prodId, img, idx === 0 ? 1 : 0, idx + 1);
      });
    } else {
      db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, 1, 1)').run(
        prodId,
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
      );
    }

    // Insert Inventory
    db.prepare('INSERT INTO inventory (product_id, sku, available_stock, low_stock_threshold) VALUES (?, ?, ?, 5)').run(
      prodId,
      sku,
      Number(stock_quantity || 20)
    );

    res.status(201).json({ success: true, id: prodId, message: 'Product created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const prodId = Number(req.params.id);
    db.prepare('UPDATE products SET status = "deleted" WHERE id = ?').run(prodId);
    res.json({ success: true, message: 'Product archived' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/admin/coupons', requireAdmin, (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/admin/coupons', requireAdmin, (req, res) => {
  try {
    const { code, discount_type, discount_amount, min_order, max_discount, usage_limit } = req.body;
    if (!code || !discount_amount) {
      return res.status(400).json({ error: 'Coupon code and discount amount are required' });
    }

    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_amount, min_order, max_discount, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      code.toUpperCase().trim(),
      discount_type || 'PERCENTAGE',
      Number(discount_amount),
      Number(min_order || 0),
      max_discount ? Number(max_discount) : null,
      Number(usage_limit || 1000)
    );

    res.status(201).json({ success: true, message: 'Coupon created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
