import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Package,
  Heart,
  MapPin,
  Lock,
  LogOut,
  ShoppingBag,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartWishlistContext.tsx';
import type { Order, WishlistItem } from '../types.ts';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
  onTrackOrder: (orderNumber: string) => void;
  onViewInvoice: (order: Order) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
  onTrackOrder,
  onViewInvoice,
}) => {
  const { user, token, logout, savedAddresses, refreshProfile } = useAuth();
  const { wishlist, moveToCart, toggleWishlist, showToast } = useCart();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // New Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newFullName, setNewFullName] = useState(user?.name || '');
  const [newMobile, setNewMobile] = useState(user?.phone || '');
  const [newHouse, setNewHouse] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Load user orders
  useEffect(() => {
    if (!token || !isOpen) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [token, isOpen]);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMessage('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMessage('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPwMessage(data.error || 'Password change failed.');
      }
    } catch (err: any) {
      setPwMessage(err.message || 'Error occurred');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouse || !newCity || !newPin) return;

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: newFullName,
          mobile: newMobile,
          houseFlat: newHouse,
          street: newStreet,
          city: newCity,
          state: newState,
          pinCode: newPin,
          isDefault: 1,
        }),
      });
      if (res.ok) {
        showToast('Address saved successfully!');
        setShowAddAddress(false);
        refreshProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-900">{user?.name}</h2>
              <div className="text-[11px] text-zinc-400">{user?.email} • {user?.role}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar Tabs + Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Sidebar */}
          <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-100 bg-zinc-50/70 p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <User className="h-4 w-4" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>My Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'wishlist'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Wishlist ({wishlist.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Saved Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Security</span>
            </button>

            <div className="md:mt-auto pt-2 border-t border-zinc-200">
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* Main Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* TAB: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-5 max-w-lg">
                <h3 className="text-sm font-black text-zinc-900">Personal Account Details</h3>
                <div className="rounded-2xl border border-zinc-200 p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400">Full Name</span>
                    <div className="font-bold text-zinc-900 text-sm">{user?.name}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Email Address</span>
                    <div className="font-semibold text-zinc-900">{user?.email}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Primary Phone</span>
                    <div className="font-semibold text-zinc-900">{user?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Account Type</span>
                    <div className="font-semibold text-emerald-600 capitalize">{user?.role}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: My Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-zinc-900">Order History & Tracking</h3>
                {ordersLoading ? (
                  <div className="py-8 text-center text-xs text-zinc-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="rounded-2xl bg-zinc-50 p-8 text-center text-xs text-zinc-400">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-zinc-200 p-4 space-y-3 hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 text-xs">
                          <div>
                            <span className="text-zinc-400">Order #</span>{' '}
                            <strong className="font-mono text-zinc-900">{ord.order_number}</strong>
                          </div>
                          <div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-zinc-500 font-semibold">${ord.grand_total?.toFixed(2)}</div>
                        </div>

                        {/* Order items preview */}
                        <div className="space-y-2">
                          {ord.items?.map((it) => (
                            <div key={it.id} className="flex items-center gap-3 text-xs">
                              <img
                                src={it.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                                alt={it.product_name}
                                className="h-10 w-10 shrink-0 rounded-lg object-cover bg-zinc-100"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 truncate">
                                <div className="font-semibold text-zinc-800 truncate">{it.product_name}</div>
                                <div className="text-[11px] text-zinc-400">
                                  Qty: {it.quantity} • ${it.unit_price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                          <button
                            onClick={() => {
                              onClose();
                              onTrackOrder(ord.order_number);
                            }}
                            className="flex items-center gap-1 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
                          >
                            <Package className="h-3.5 w-3.5" />
                            <span>Track</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              onViewInvoice(ord);
                            }}
                            className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-zinc-900">Saved Wishlist ({wishlist.length})</h3>
                {wishlist.length === 0 ? (
                  <div className="rounded-2xl bg-zinc-50 p-8 text-center text-xs text-zinc-400">
                    Your wishlist is empty. Tap the heart icon on any product to save it here!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlist.map((item: WishlistItem) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 bg-white"
                      >
                        <img
                          src={item.primary_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover bg-zinc-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 truncate">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">{item.name}</h4>
                          <div className="font-extrabold text-emerald-600 text-xs mt-0.5">
                            ${item.discount_price}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => moveToCart(item)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                            >
                              Move to Cart
                            </button>
                            <button
                              onClick={() => toggleWishlist(item)}
                              className="p-1 text-zinc-400 hover:text-rose-600"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-zinc-900">Saved Delivery Addresses</h3>
                  <button
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New</span>
                  </button>
                </div>

                {showAddAddress && (
                  <form onSubmit={handleSaveAddress} className="rounded-2xl border border-zinc-300 p-4 space-y-3 bg-zinc-50">
                    <h4 className="text-xs font-bold text-zinc-900">New Address Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Mobile Number"
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value)}
                        className="rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="House / Flat / Building"
                      value={newHouse}
                      onChange={(e) => setNewHouse(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Street / Area"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="rounded-xl border border-zinc-300 bg-white p-2 text-xs"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="rounded-xl px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {savedAddresses.map((sa) => (
                    <div key={sa.id} className="rounded-2xl border border-zinc-200 p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-zinc-900">{sa.full_name}</strong>
                        {sa.is_default === 1 && (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-600">
                        {sa.house_flat}, {sa.street}, {sa.city}, {sa.state} - {sa.pin_code}
                      </div>
                      <div className="text-zinc-400">Mobile: {sa.mobile}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Security */}
            {activeTab === 'security' && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-sm font-black text-zinc-900">Change Password</h3>
                {pwMessage && (
                  <div className="rounded-xl bg-zinc-100 p-3 text-xs font-semibold text-zinc-800">
                    {pwMessage}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
