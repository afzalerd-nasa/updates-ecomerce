import React, { useState } from 'react';
import { X, Trash2, Heart, ArrowRight, Tag, ShoppingBag, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../context/CartWishlistContext.tsx';
import type { CartItem } from '../types.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedCheckout,
  onContinueShopping,
}) => {
  const {
    cart,
    cartCount,
    subtotal,
    discountAmount,
    deliveryCharge,
    taxAmount,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateCartQuantity,
    removeFromCart,
    deliveryMethod,
    setDeliveryMethod,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    const res = await applyCoupon(couponCodeInput.trim());
    setCouponLoading(false);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponCodeInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-black text-zinc-900">
                Shopping Cart ({cartCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body: Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">Your cart is empty</h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  Discover trending deals and elevate your lifestyle today.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onContinueShopping();
                  }}
                  className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Free Delivery Bar */}
                <div className="rounded-xl bg-emerald-50/70 p-3 text-xs text-emerald-900">
                  {subtotal >= 50 ? (
                    <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                      <Check className="h-4 w-4" /> You unlocked FREE Standard Delivery!
                    </span>
                  ) : (
                    <span>
                      Add <strong>${(50 - subtotal).toFixed(2)}</strong> more to get FREE Delivery!
                    </span>
                  )}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / 50) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-zinc-100 space-y-3">
                  {cart.map((item: CartItem) => (
                    <div key={item.id} className="pt-3 flex gap-3">
                      {/* Product Thumbnail */}
                      <img
                        src={item.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                        alt={item.product_name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover bg-zinc-100 border border-zinc-200"
                        referrerPolicy="no-referrer"
                      />

                      {/* Info & Stepper */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 line-clamp-2">
                            {item.product_name}
                          </h4>
                          {(item.selected_size || item.selected_color) && (
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              {item.selected_size && <span>Size: {item.selected_size} </span>}
                              {item.selected_color && <span>Color: {item.selected_color}</span>}
                            </div>
                          )}
                          <div className="text-xs font-extrabold text-zinc-900 mt-1">
                            ${item.unit_price?.toFixed(2)}
                          </div>
                        </div>

                        {/* Stepper & Delete */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="h-5 w-5 rounded text-zinc-500 hover:bg-zinc-200 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-zinc-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="h-5 w-5 rounded text-zinc-500 hover:bg-zinc-200 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Option Selector */}
                <div className="mt-4 rounded-xl border border-zinc-200 p-3">
                  <span className="text-xs font-bold text-zinc-800">Choose Shipping Speed:</span>
                  <div className="mt-2 space-y-1.5">
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === 'Standard Delivery'}
                          onChange={() => setDeliveryMethod('Standard Delivery')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-zinc-700">Standard (3-5 Days)</span>
                      </div>
                      <span className="font-bold text-zinc-900">
                        {subtotal >= 50 ? 'FREE' : '$4.99'}
                      </span>
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === 'Express Delivery'}
                          onChange={() => setDeliveryMethod('Express Delivery')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-zinc-700">Express Priority (1-2 Days)</span>
                      </div>
                      <span className="font-bold text-zinc-900">$9.99</span>
                    </label>
                  </div>
                </div>

                {/* Coupon Box */}
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-emerald-600" />
                        <span>
                          Code <strong>{appliedCoupon.code}</strong> applied (-${discountAmount.toFixed(2)})
                        </span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="font-bold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Promo code (e.g. UPDATES20)"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs uppercase focus:border-emerald-600 focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading}
                          className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </form>
                      {couponError && <p className="mt-1 text-[11px] text-rose-600">{couponError}</p>}
                      <div className="mt-1.5 flex gap-2 text-[10px] text-zinc-400">
                        <span>Try:</span>
                        <button
                          type="button"
                          onClick={() => setCouponCodeInput('UPDATES20')}
                          className="font-bold text-emerald-600 underline"
                        >
                          UPDATES20
                        </button>
                        <button
                          type="button"
                          onClick={() => setCouponCodeInput('SAVE10')}
                          className="font-bold text-emerald-600 underline"
                        >
                          SAVE10
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer: Totals & Checkout Trigger */}
          {cart.length > 0 && (
            <div className="border-t border-zinc-200 bg-zinc-50 p-6 space-y-4">
              <div className="space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Product Subtotal</span>
                  <span className="font-semibold text-zinc-900">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Savings</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-zinc-900">
                    {deliveryCharge === 0 ? 'FREE' : `$${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes (8%)</span>
                  <span className="font-semibold text-zinc-900">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-black text-zinc-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onProceedCheckout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onContinueShopping();
                  }}
                  className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 py-1"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
