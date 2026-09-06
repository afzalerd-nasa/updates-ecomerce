import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  DollarSign,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AdminStats, InventoryItem, Category, Brand } from '../types.ts';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  brands: Brand[];
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  categories,
  brands,
}) => {
  const { token, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'inventory' | 'orders' | 'customers' | 'coupons'>('dashboard');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Products
  const [productsList, setProductsList] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [pName, setPName] = useState('');
  const [pCategoryId, setPCategoryId] = useState(categories[0]?.id || 1);
  const [pBrandId, setPBrandId] = useState(brands[0]?.id || 1);
  const [pOrigPrice, setPOrigPrice] = useState('99.99');
  const [pDiscPrice, setPDiscPrice] = useState('79.99');
  const [pSku, setPSku] = useState(`UPD-${Math.floor(Math.random() * 90000 + 10000)}`);
  const [pStock, setPStock] = useState('25');
  const [pDescription, setPDescription] = useState('High-performance premium product designed for durability and daily modern lifestyle.');
  const [pImage, setPImage] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');

  // Inventory
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  // Orders
  const [ordersList, setOrdersList] = useState<any[]>([]);

  // Customers
  const [customersList, setCustomersList] = useState<any[]>([]);

  // Coupons
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponAmount, setNewCouponAmount] = useState('15');
  const [newCouponMin, setNewCouponMin] = useState('50');

  // Load stats
  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load inventory
  const fetchInventory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryList(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load orders
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=50');
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load customers
  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomersList(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load coupons
  const fetchCoupons = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCouponsList(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchStats();
      fetchProducts();
      fetchInventory();
      fetchOrders();
      fetchCustomers();
      fetchCoupons();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  // Add product handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: pName,
          category_id: pCategoryId,
          brand_id: pBrandId,
          original_price: Number(pOrigPrice),
          discount_price: Number(pDiscPrice),
          sku: pSku,
          stock_quantity: Number(pStock),
          description: pDescription,
          images: [pImage],
        }),
      });
      if (res.ok) {
        setShowAddProduct(false);
        fetchProducts();
        fetchInventory();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Restock inventory quick action
  const handleRestock = async (productId: number, qty: number) => {
    try {
      await fetch('/api/admin/inventory/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      fetchInventory();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Create coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    try {
      await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCouponCode,
          discount_type: 'PERCENTAGE',
          discount_amount: Number(newCouponAmount),
          min_order: Number(newCouponMin),
        }),
      });
      setNewCouponCode('');
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950 font-black text-xs">
              U
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide uppercase">
                Admin Control Center
              </h2>
              <div className="text-[10px] text-zinc-400">Updates E-Commerce Operations & Intelligence</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 py-2 overflow-x-auto gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Products ({productsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Inventory ({inventoryList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Orders ({ordersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Customers ({customersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Coupons & Promos</span>
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Total Revenue</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-zinc-900">
                    ${stats.totalSales?.toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Live SQL Aggregate
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Total Orders</span>
                    <ShoppingBag className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-zinc-900">{stats.totalOrders}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {stats.pendingOrders} Pending Fulfillment
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Active Products</span>
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-zinc-900">{stats.totalProducts}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">Across 11 Categories</div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Registered Customers</span>
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-zinc-900">{stats.totalCustomers}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">Active Shoppers</div>
                </div>
              </div>

              {/* Low Stock Warning Box */}
              {stats.lowStockItems && stats.lowStockItems.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Low Stock Warning ({stats.lowStockItems.length} Products Need Replenishment)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stats.lowStockItems.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 border border-amber-200 shadow-2xs"
                      >
                        {item.name}: <strong>{item.stock_quantity} units</strong> (Threshold: {item.low_stock_threshold})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders Table */}
              <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-100 font-bold text-xs text-zinc-800">
                  Recent Orders
                </div>
                <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Order #</th>
                      <th className="px-4 py-2.5 font-semibold">Customer</th>
                      <th className="px-4 py-2.5 font-semibold">Amount</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {stats.recentOrders?.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 font-mono font-bold text-zinc-900">{ord.order_number}</td>
                        <td className="px-4 py-2.5 text-zinc-700">{ord.customer_name}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600">${ord.grand_total?.toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900">Catalogue Management</h3>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Add Product Modal Form */}
              {showAddProduct && (
                <form onSubmit={handleAddProduct} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-zinc-900">Add New Product to Store</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Product Title</label>
                      <input
                        type="text"
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        placeholder="e.g. Ultra Horizon Smartwatch"
                        className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">SKU Code</label>
                      <input
                        type="text"
                        value={pSku}
                        onChange={(e) => setPSku(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Category</label>
                      <select
                        value={pCategoryId}
                        onChange={(e) => setPCategoryId(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Brand</label>
                      <select
                        value={pBrandId}
                        onChange={(e) => setPBrandId(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Original Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pOrigPrice}
                        onChange={(e) => setPOrigPrice(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Discount Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pDiscPrice}
                        onChange={(e) => setPDiscPrice(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700">Primary Image URL</label>
                    <input
                      type="url"
                      value={pImage}
                      onChange={(e) => setPImage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="rounded-xl px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Save Product
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Product</th>
                      <th className="px-4 py-2.5 font-semibold">SKU</th>
                      <th className="px-4 py-2.5 font-semibold">Category</th>
                      <th className="px-4 py-2.5 font-semibold">Price</th>
                      <th className="px-4 py-2.5 font-semibold">Stock</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {productsList.map((prod) => (
                      <tr key={prod.id} className="hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 flex items-center gap-2.5">
                          <img
                            src={prod.primary_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                            alt={prod.name}
                            className="h-9 w-9 rounded-lg object-cover bg-zinc-100"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-zinc-900 truncate max-w-xs">{prod.name}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-zinc-500">{prod.sku}</td>
                        <td className="px-4 py-2.5 text-zinc-600">{prod.category_name}</td>
                        <td className="px-4 py-2.5 font-bold text-zinc-900">${prod.discount_price}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              prod.stock_quantity <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {prod.stock_quantity} units
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600"
                            title="Archive product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-900">Real-Time Warehouse Stock & Restocking</h3>
              <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">SKU</th>
                      <th className="px-4 py-2.5 font-semibold">Product Name</th>
                      <th className="px-4 py-2.5 font-semibold">Stock Available</th>
                      <th className="px-4 py-2.5 font-semibold">Units Sold</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {inventoryList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 font-mono text-zinc-600">{inv.sku}</td>
                        <td className="px-4 py-2.5 font-bold text-zinc-900">{inv.product_name}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              inv.available_stock <= inv.low_stock_threshold
                                ? 'bg-amber-100 text-amber-900 font-extrabold'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {inv.available_stock} in stock
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-600">{inv.sold_quantity}</td>
                        <td className="px-4 py-2.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleRestock(inv.product_id, 10)}
                            className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-800 hover:bg-zinc-200"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleRestock(inv.product_id, 25)}
                            className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-800 hover:bg-zinc-200"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => handleRestock(inv.product_id, 50)}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            +50
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-900">Customer Order Processing</h3>
              <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Order #</th>
                      <th className="px-4 py-2.5 font-semibold">Customer</th>
                      <th className="px-4 py-2.5 font-semibold">Amount</th>
                      <th className="px-4 py-2.5 font-semibold">Current Status</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {ordersList.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 font-mono font-bold text-zinc-900">{ord.order_number}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-zinc-900">{ord.customer_name}</div>
                          <div className="text-[10px] text-zinc-400">{ord.customer_email}</div>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600">${ord.grand_total}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="rounded-xl border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-800"
                          >
                            <option value="ORDER PLACED">ORDER PLACED</option>
                            <option value="ORDER CONFIRMED">ORDER CONFIRMED</option>
                            <option value="PACKED">PACKED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMERS MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-900">Registered Customers</h3>
              <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Customer</th>
                      <th className="px-4 py-2.5 font-semibold">Email</th>
                      <th className="px-4 py-2.5 font-semibold">Phone</th>
                      <th className="px-4 py-2.5 font-semibold">Orders</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Lifetime Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {customersList.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 font-bold text-zinc-900">{c.name}</td>
                        <td className="px-4 py-2.5 text-zinc-600">{c.email}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{c.phone || 'N/A'}</td>
                        <td className="px-4 py-2.5 font-semibold text-zinc-800">{c.orders_count} orders</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600 text-right">
                          ${Number(c.total_spent).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: COUPONS MANAGEMENT */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-900">Promotions & Coupons</h3>
              {/* Add Coupon Form */}
              <form onSubmit={handleCreateCoupon} className="rounded-2xl border border-zinc-200 bg-white p-4 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. FLASH25)"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="rounded-xl border border-zinc-300 p-2 text-xs font-mono uppercase"
                  required
                />
                <input
                  type="number"
                  placeholder="Discount %"
                  value={newCouponAmount}
                  onChange={(e) => setNewCouponAmount(e.target.value)}
                  className="w-28 rounded-xl border border-zinc-300 p-2 text-xs"
                  required
                />
                <input
                  type="number"
                  placeholder="Min Order ($)"
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(e.target.value)}
                  className="w-28 rounded-xl border border-zinc-300 p-2 text-xs"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Create Coupon
                </button>
              </form>

              {/* Coupons List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {couponsList.map((cp) => (
                  <div key={cp.id} className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-emerald-700 text-sm">{cp.code}</span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {cp.discount_amount}% OFF
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">Min Order: ${cp.min_order}</div>
                    <div className="text-[11px] text-zinc-400">Used: {cp.times_used} times</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
