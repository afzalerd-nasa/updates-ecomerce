export interface ProductVariant {
  id: number;
  product_id: number;
  size?: string;
  color?: string;
  color_code?: string;
  sku?: string;
  additional_price: number;
  stock_quantity: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number;
  display_order: number;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  review_text: string;
  is_verified_purchase: number;
  helpful_votes: number;
  status: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand_id?: number;
  brand_name?: string;
  category_id: number;
  category_name?: string;
  description: string;
  original_price: number;
  discount_price: number;
  discount_percentage: number;
  sku: string;
  stock_quantity: number;
  rating: number;
  review_count: number;
  is_featured: number;
  is_trending: number;
  is_new_arrival: number;
  status: string;
  specifications?: Record<string, string>;
  features?: string[];
  emi_info?: string;
  return_policy?: string;
  primary_image?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  description?: string;
  product_count: number;
  display_order: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  product_count: number;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  selected_size?: string;
  selected_color?: string;
  product_name: string;
  product_slug: string;
  discount_price: number;
  original_price: number;
  available_stock: number;
  product_image: string;
}

export interface WishlistItem extends Product {
  wishlist_item_id: number;
  added_at: string;
}

export interface ShippingAddress {
  id?: number;
  full_name?: string;
  name?: string;
  mobile: string;
  house_flat: string;
  street: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  address_type?: string;
  is_default?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_size?: string;
  selected_color?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  discount_amount: number;
  delivery_charge: number;
  tax_amount: number;
  grand_total: number;
  status: 'ORDER PLACED' | 'ORDER CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';
  delivery_method: string;
  expected_delivery_date: string;
  tracking_number: string;
  shipping_address: ShippingAddress;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'Customer' | 'Admin';
  created_at?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_amount: number;
  min_order: number;
  max_discount?: number;
  usage_limit: number;
  times_used: number;
  is_active: number;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  available_stock: number;
  reserved_stock: number;
  sold_quantity: number;
  low_stock_threshold: number;
  original_price: number;
  discount_price: number;
  product_image: string;
  last_restocked_at: string;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  totalReturns: number;
  revenue: number;
  lowStockItems: {
    id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    low_stock_threshold: number;
  }[];
  recentOrders: {
    id: number;
    order_number: string;
    grand_total: number;
    status: string;
    created_at: string;
    customer_name: string;
  }[];
}
