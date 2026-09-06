import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Truck,
  RotateCcw,
  Headphones,
  CreditCard,
  Check,
  ArrowRight,
} from 'lucide-react';

interface FooterProps {
  onSelectCategory: (categoryId: number) => void;
  onOpenTrackOrder: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenTrackOrder }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-100 text-gray-900 pt-14 pb-10">
      {/* 4 Value Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-gray-200/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-900 border border-gray-200/80 shadow-2xs">
              <Truck className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Free Express Shipping</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Complimentary for all orders over $50</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-900 border border-gray-200/80 shadow-2xs">
              <RotateCcw className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">30-Day Free Returns</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Instant refunds & simple return pickups</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-900 border border-gray-200/80 shadow-2xs">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">100% Secure Checkout</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">256-Bit SSL encrypted payments</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-900 border border-gray-200/80 shadow-2xs">
              <Headphones className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">24/7 Dedicated Support</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Concierge assistance via chat & email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white font-black text-sm">
                U
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                updates<span className="text-emerald-600">.</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Updates E-Commerce is engineered for pure aesthetics and timeless curation, delivering certified original electronics, modern apparel, curated lifestyle goods, and smart tech worldwide.
            </p>

            {/* Newsletter Form */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block mb-1.5">
                Newsletter
              </span>
              <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Subscribe to Drops & Private Sales
              </h5>
              {subscribed ? (
                <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>You're subscribed! Use promo code <strong className="font-mono text-black">MINIMAL20</strong> for 20% off.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-3 flex max-w-md gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-black focus:outline-hidden"
                    required
                  />
                  <button
                    type="submit"
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors"
                  >
                    <span>Join</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-gray-900 uppercase tracking-widest text-[11px]">Explore Store</h5>
            <ul className="space-y-2 text-gray-500">
              <li>
                <button onClick={() => onSelectCategory(1)} className="hover:text-black transition-colors">
                  Smartphones & Tech
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(2)} className="hover:text-black transition-colors">
                  Laptops & Workstations
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(3)} className="hover:text-black transition-colors">
                  Audio & Headphones
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(4)} className="hover:text-black transition-colors">
                  Modern Fashion
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(6)} className="hover:text-black transition-colors">
                  Smart Home & Living
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-gray-900 uppercase tracking-widest text-[11px]">Customer Care</h5>
            <ul className="space-y-2 text-gray-500">
              <li>
                <button onClick={onOpenTrackOrder} className="hover:text-black font-semibold text-gray-900 transition-colors">
                  Track Your Order
                </button>
              </li>
              <li>
                <span className="hover:text-black cursor-pointer transition-colors">Shipping & Dispatch Rates</span>
              </li>
              <li>
                <span className="hover:text-black cursor-pointer transition-colors">Returns & Exchanges</span>
              </li>
              <li>
                <span className="hover:text-black cursor-pointer transition-colors">Warranty & Authentication</span>
              </li>
              <li>
                <span className="hover:text-black cursor-pointer transition-colors">Contact Support</span>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-gray-900 uppercase tracking-widest text-[11px]">Company</h5>
            <ul className="space-y-2 text-gray-500">
              <li className="hover:text-black cursor-pointer transition-colors">About Updates E-Commerce</li>
              <li className="hover:text-black cursor-pointer transition-colors">Sustainability & Design</li>
              <li className="hover:text-black cursor-pointer transition-colors">Privacy Governance</li>
              <li className="hover:text-black cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-black cursor-pointer transition-colors">Store Locator</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Payments & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          © {new Date().getFullYear()} Updates E-Commerce. Minimalist Modern Platform.
        </div>

        {/* Payment Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-600">
          <span className="rounded-full bg-white px-2.5 py-1 border border-gray-200">VISA</span>
          <span className="rounded-full bg-white px-2.5 py-1 border border-gray-200">MASTERCARD</span>
          <span className="rounded-full bg-white px-2.5 py-1 border border-gray-200">AMEX</span>
          <span className="rounded-full bg-white px-2.5 py-1 border border-gray-200">APPLE PAY</span>
          <span className="rounded-full bg-white px-2.5 py-1 border border-gray-200">PAYPAL</span>
        </div>
      </div>
    </footer>
  );
};
