import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  MapPin,
  Lock,
  Building2,
  Banknote,
  Sparkles,
  Printer,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartWishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { ShippingAddress, Order } from '../types.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  openTrackOrderModal: (orderNumber: string) => void;
  openInvoiceModal: (order: Order) => void;
  directProduct?: {
    product: any;
    quantity: number;
    size?: string;
    color?: string;
  } | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  openTrackOrderModal,
  openInvoiceModal,
  directProduct,
}) => {
  const { cart, subtotal, discountAmount, deliveryCharge, taxAmount, grandTotal, appliedCoupon, deliveryMethod, setDeliveryMethod, clearCart } = useCart();
  const { user, token, isAuthenticated, savedAddresses } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(user?.name || 'Alex Morgan');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'customer@updates.com');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+1 (555) 234-5678');

  // Shipping Address
  const [address, setAddress] = useState<ShippingAddress>({
    full_name: user?.name || 'Alex Morgan',
    mobile: user?.phone || '+1 (555) 234-5678',
    house_flat: 'Apt 4B, Skyline Towers',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'Oregon',
    pin_code: '97477',
    country: 'United States',
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'UPI' | 'Net Banking' | 'Cash on Delivery'>('Credit Card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState('Alex Morgan');
  const [upiId, setUpiId] = useState('alex@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('JPMorgan Chase');

  // Placed Order Result
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  if (!isOpen) return null;

  // Items to order (either direct Buy Now or Cart items)
  const itemsToOrder = directProduct
    ? [
        {
          product_id: directProduct.product.id,
          product_name: directProduct.product.name,
          product_image: directProduct.product.primary_image || (directProduct.product.images?.[0]?.image_url ?? ''),
          quantity: directProduct.quantity,
          unit_price: directProduct.product.discount_price,
          selected_size: directProduct.size,
          selected_color: directProduct.color,
        },
      ]
    : cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        unit_price: item.unit_price,
        selected_size: item.selected_size,
        selected_color: item.selected_color,
      }));

  const orderSubtotal = directProduct
    ? directProduct.product.discount_price * directProduct.quantity
    : subtotal;

  const orderDelivery = deliveryMethod === 'Express Delivery' ? 9.99 : orderSubtotal > 50 ? 0 : 4.99;
  const orderTax = Number((orderSubtotal * 0.08).toFixed(2));
  const orderTotal = Number((orderSubtotal - discountAmount + orderDelivery + orderTax).toFixed(2));

  // Handle final order submission
  const handlePlaceOrder = async () => {
    if (!customerEmail || !customerName) {
      setErrorMessage('Please provide customer name and email.');
      return;
    }

    if (!address.house_flat || !address.city || !address.pin_code) {
      setErrorMessage('Please provide a complete shipping address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Ensure we have an authorization token or fallback guest token
      let authToken = token;
      if (!authToken) {
        // Quick anonymous register/login for seamless guest checkout
        const guestRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            password: 'GuestPassword123!',
            phone: customerPhone,
          }),
        });
        const guestData = await guestRes.json();
        authToken = guestData.token;
      }

      const orderPayload = {
        items: itemsToOrder,
        shippingAddress: address,
        deliveryMethod,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        notes: `Customer contact: ${customerPhone}`,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success! Fire celebration confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
      });

      setPlacedOrder(data.order);
      setStep(5); // Move to success step

      if (!directProduct) {
        clearCart();
      }

      if (onOrderSuccess) {
        onOrderSuccess(data.order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while placing order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span className="font-black text-sm text-zinc-900 uppercase tracking-wide">
              Secure Checkout
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        {step < 5 && (
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3 bg-zinc-50/70 text-xs">
            <span className={step >= 1 ? 'font-bold text-emerald-600' : 'text-zinc-400'}>1. Contact</span>
            <span className="text-zinc-300">→</span>
            <span className={step >= 2 ? 'font-bold text-emerald-600' : 'text-zinc-400'}>2. Delivery</span>
            <span className="text-zinc-300">→</span>
            <span className={step >= 3 ? 'font-bold text-emerald-600' : 'text-zinc-400'}>3. Shipping</span>
            <span className="text-zinc-300">→</span>
            <span className={step >= 4 ? 'font-bold text-emerald-600' : 'text-zinc-400'}>4. Payment</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Customer Contact Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-900">Step 1: Contact Information</h3>
              <p className="text-xs text-zinc-500">
                Order confirmation receipt and tracking notifications will be dispatched here.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700">Mobile Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <span>Continue to Delivery</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Address */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900">Step 2: Delivery Address</h3>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              </div>

              {savedAddresses.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-zinc-700">Saved Addresses</label>
                  <div className="mt-1 space-y-2">
                    {savedAddresses.map((sa) => (
                      <div
                        key={sa.id}
                        onClick={() =>
                          setAddress({
                            full_name: sa.full_name || customerName,
                            mobile: sa.mobile,
                            house_flat: sa.house_flat,
                            street: sa.street,
                            city: sa.city,
                            state: sa.state,
                            pin_code: sa.pin_code,
                            country: sa.country,
                          })
                        }
                        className="cursor-pointer rounded-xl border border-zinc-200 p-3 text-xs hover:border-emerald-600 hover:bg-emerald-50/20"
                      >
                        <div className="font-bold text-zinc-900">{sa.full_name}</div>
                        <div className="text-zinc-600">
                          {sa.house_flat}, {sa.street}, {sa.city}, {sa.state} - {sa.pin_code}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700">House / Flat / Building</label>
                  <input
                    type="text"
                    value={address.house_flat}
                    onChange={(e) => setAddress({ ...address, house_flat: e.target.value })}
                    placeholder="e.g. Apartment 4B, 3rd Floor"
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700">Street / Area</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="e.g. 742 Evergreen Terrace"
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">State / Province</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Postal / PIN Code</label>
                    <input
                      type="text"
                      value={address.pin_code}
                      onChange={(e) => setAddress({ ...address, pin_code: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Shipping Method */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900">Step 3: Shipping Options</h3>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setDeliveryMethod('Standard Delivery')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                    deliveryMethod === 'Standard Delivery'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-xs text-zinc-900">Standard Delivery (3-5 Business Days)</div>
                      <div className="text-[11px] text-zinc-500">Fully tracked ground shipping</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-zinc-900">
                    {orderSubtotal >= 50 ? 'FREE' : '$4.99'}
                  </span>
                </label>

                <label
                  onClick={() => setDeliveryMethod('Express Delivery')}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                    deliveryMethod === 'Express Delivery'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-bold text-xs text-zinc-900">Express Priority (1-2 Business Days)</div>
                      <div className="text-[11px] text-zinc-500">Expedited air dispatch & priority handling</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-zinc-900">$9.99</span>
                </label>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Method Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900">Step 4: Payment & Review</h3>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Credit Card', 'UPI', 'Net Banking', 'Cash on Delivery'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-xl border p-2.5 text-center text-xs font-bold transition-all ${
                      paymentMethod === m
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dynamic Payment Form */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
                {paymentMethod === 'Credit Card' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800">Card Details</span>
                      <div className="flex gap-1 text-[10px] text-zinc-400">Visa / Mastercard / Amex</div>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number (4242 4242 4242 4242)"
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                      />
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="CVV"
                        className="rounded-xl border border-zinc-300 bg-white p-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Cardholder Name"
                        className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'UPI' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-800">UPI ID / Virtual Payment Address</span>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. username@okhdfcbank"
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-zinc-500">
                      A payment request will be triggered to your Google Pay, PhonePe, or Paytm app.
                    </p>
                  </div>
                )}

                {paymentMethod === 'Net Banking' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-800">Select Bank</span>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="JPMorgan Chase">JPMorgan Chase</option>
                      <option value="Bank of America">Bank of America</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="HSBC Bank">HSBC Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'Cash on Delivery' && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-800">Pay with Cash Upon Delivery</span>
                    <p className="text-xs text-zinc-500">
                      Keep exact cash ready. Verification OTP will be sent to <strong>{customerPhone}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary Recap */}
              <div className="rounded-2xl border border-zinc-200 p-4 space-y-2 text-xs">
                <div className="font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                  Order Summary ({itemsToOrder.length} {itemsToOrder.length === 1 ? 'item' : 'items'})
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-zinc-900">${orderSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Savings:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping Fee:</span>
                  <span className="font-semibold text-zinc-900">
                    {orderDelivery === 0 ? 'FREE' : `$${orderDelivery.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Estimated Tax (8%):</span>
                  <span className="font-semibold text-zinc-900">${orderTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-black text-zinc-900">
                  <span>Grand Total to Pay:</span>
                  <span className="text-emerald-600">${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600"
                >
                  Back
                </button>
                <button
                  disabled={loading}
                  onClick={handlePlaceOrder}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-xs font-black text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-600/25"
                >
                  {loading ? (
                    <span>Securing Order...</span>
                  ) : (
                    <>
                      <span>CONFIRM & PAY ${orderTotal.toFixed(2)}</span>
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Order Placed Success Confirmation */}
          {step === 5 && placedOrder && (
            <div className="py-6 text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <Check className="h-8 w-8" />
              </div>

              <div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  PAYMENT SUCCESSFUL
                </span>
                <h2 className="mt-2 text-2xl font-black text-zinc-900">Thank You for Your Order!</h2>
                <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                  Your order has been recorded in our dispatch system. We have sent a detailed receipt to <strong>{customerEmail}</strong>.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-left max-w-md mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order Number:</span>
                  <strong className="font-mono text-zinc-900">{placedOrder.orderNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tracking Code:</span>
                  <strong className="font-mono text-emerald-700">{placedOrder.trackingNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Estimated Delivery:</span>
                  <strong className="text-zinc-900">{placedOrder.expectedDeliveryDate}</strong>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-600">${placedOrder.grandTotal}</span>
                </div>
              </div>

              {/* Actions: Track Order & View Invoice */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    openTrackOrderModal(placedOrder.orderNumber);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Package className="h-4 w-4" />
                  <span>Track Active Order</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    openInvoiceModal(placedOrder);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50"
                >
                  <Printer className="h-4 w-4" />
                  <span>View & Print Tax Invoice</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
