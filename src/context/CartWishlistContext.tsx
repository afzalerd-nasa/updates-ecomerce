import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, WishlistItem, Product } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

interface AppliedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountAmount: number;
  message: string;
}

interface CartWishlistContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  cartCount: number;
  wishlistCount: number;
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  taxAmount: number;
  grandTotal: number;
  appliedCoupon: AppliedCoupon | null;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => Promise<void>;
  updateCartQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (product: Product) => Promise<boolean>;
  isInWishlist: (productId: number) => boolean;
  moveToCart: (item: WishlistItem) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  deliveryMethod: 'Standard Delivery' | 'Express Delivery';
  setDeliveryMethod: (method: 'Standard Delivery' | 'Express Delivery') => void;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined);

export const CartWishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'Standard Delivery' | 'Express Delivery'>('Standard Delivery');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const sessionId = React.useMemo(() => {
    let sid = localStorage.getItem('updates_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('updates_session_id', sid);
    }
    return sid;
  }, []);

  const refreshCart = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/cart?sessionId=${sessionId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCart(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  };

  const refreshWishlist = async () => {
    if (!token) {
      setWishlist([]);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  useEffect(() => {
    refreshCart();
    if (isAuthenticated) {
      refreshWishlist();
    } else {
      setWishlist([]);
    }
  }, [token, isAuthenticated]);

  const addToCart = async (product: Product, quantity = 1, size?: string, color?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.id,
          quantity,
          selectedSize: size,
          selectedColor: color,
          sessionId,
        }),
      });

      if (res.ok) {
        await refreshCart();
        showToast(`Added "${product.name.slice(0, 30)}..." to cart 🛒`);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  const updateCartQuantity = async (itemId: number, quantity: number) => {
    try {
      // Optimistic update
      if (quantity <= 0) {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
      }

      await fetch(`/api/cart/item/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      refreshCart();
    } catch (err) {
      console.error('Update quantity failed:', err);
      refreshCart();
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
      await fetch(`/api/cart/item/${itemId}`, { method: 'DELETE' });
      showToast('Item removed from cart');
    } catch (err) {
      console.error('Remove item failed:', err);
      refreshCart();
    }
  };

  const clearCart = async () => {
    try {
      setCart([]);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/cart/clear?sessionId=${sessionId}`, { method: 'DELETE', headers });
    } catch (err) {
      console.error('Clear cart failed:', err);
    }
  };

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      showToast('Please login to save items to your wishlist ❤️');
      return false;
    }

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      await refreshWishlist();
      showToast(data.message || (data.added ? 'Added to wishlist ❤️' : 'Removed from wishlist'));
      return !!data.added;
    } catch (err) {
      console.error('Toggle wishlist failed:', err);
      return false;
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.id === productId);
  };

  const moveToCart = async (item: WishlistItem) => {
    if (!token) return;
    try {
      const res = await fetch('/api/wishlist/move-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: item.id }),
      });
      if (res.ok) {
        await refreshWishlist();
        await refreshCart();
        showToast(`Moved "${item.name.slice(0, 30)}..." to cart 🛒`);
      }
    } catch (err) {
      console.error('Move to cart failed:', err);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Invalid coupon code' };
      }

      setAppliedCoupon({
        code: data.code,
        discountType: data.discountType,
        discountAmount: data.discountAmount,
        message: data.message,
      });
      showToast(`🎉 ${data.message}`);
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Coupon validation failed' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed');
  };

  // Pricing calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = appliedCoupon.discountAmount;
    } else {
      discountAmount = Math.min(appliedCoupon.discountAmount, subtotal);
    }
  }

  const deliveryCharge = cart.length === 0 ? 0 : deliveryMethod === 'Express Delivery' ? 9.99 : subtotal > 50 ? 0 : 4.99;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number((taxableAmount * 0.08).toFixed(2));
  const grandTotal = Number((taxableAmount + deliveryCharge + taxAmount).toFixed(2));
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <CartWishlistContext.Provider
      value={{
        cart,
        wishlist,
        cartCount,
        wishlistCount,
        subtotal,
        discountAmount,
        deliveryCharge,
        taxAmount,
        grandTotal,
        appliedCoupon,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        moveToCart,
        applyCoupon,
        removeCoupon,
        deliveryMethod,
        setDeliveryMethod,
        refreshCart,
        refreshWishlist,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </CartWishlistContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error('useCart must be used within a CartWishlistProvider');
  }
  return context;
};
