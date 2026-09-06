import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartWishlistProvider, useCart } from './context/CartWishlistContext.tsx';
import { Header } from './components/Header.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { CategoryCards } from './components/CategoryCards.tsx';
import { ProductListing } from './components/ProductListing.tsx';
import { ProductDetailsModal } from './components/ProductDetailsModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderTrackingView } from './components/OrderTrackingView.tsx';
import { UserAccountModal } from './components/UserAccountModal.tsx';
import { AdminPanelModal } from './components/AdminPanelModal.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';
import { Toast } from './components/Toast.tsx';
import type { Category, Brand, Product, Order } from './types.ts';
import { Sparkles, ShieldCheck, Truck, Headphones, MessageSquare, Mail, Phone, MapPin, X, Check } from 'lucide-react';

function MainCommerceApp() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useCart();

  // Navigation and active filters
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Metadata
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Modals & Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountTab, setAccountTab] = useState('profile');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [trackOrderModalOpen, setTrackOrderModalOpen] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [directCheckoutProduct, setDirectCheckoutProduct] = useState<any | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Load categories and brands
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData || []);
        }
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrands(brandData || []);
        }
      } catch (err) {
        console.error('Failed loading meta:', err);
      }
    };
    loadMeta();
  }, []);

  // Handlers
  const handleNavChange = (nav: string) => {
    setActiveNav(nav);
    if (nav === 'track-order') {
      setTrackOrderNumber('ORD-892144');
      setTrackOrderModalOpen(true);
    } else if (nav === 'offers') {
      // scroll to products or filter offers
      const el = document.getElementById('catalog-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'new-arrivals') {
      const el = document.getElementById('catalog-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'best-sellers') {
      const el = document.getElementById('catalog-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'categories') {
      const el = document.getElementById('categories-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'contact') {
      setContactModalOpen(true);
    } else {
      setSelectedCategory(null);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAccountTab = (tab: string) => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setAuthModalOpen(true);
    } else {
      setAccountTab(tab);
      setAccountModalOpen(true);
    }
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleBuyNow = (product: Product, quantity = 1, size?: string, color?: string) => {
    setDirectCheckoutProduct({ product, quantity, size, color });
    setCheckoutModalOpen(true);
  };

  const handleOpenTrackOrder = (orderNum?: string) => {
    setTrackOrderNumber(orderNum || 'ORD-892144');
    setTrackOrderModalOpen(true);
  };

  const handleOpenInvoice = (order: Order) => {
    setInvoiceOrder(order);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-black selection:text-white">
      {/* 1. Header */}
      <Header
        activeNav={activeNav}
        onNavChange={handleNavChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWishlist={() => handleOpenAccountTab('wishlist')}
        onOpenAccount={() => handleOpenAccountTab('profile')}
        onOpenLogin={handleOpenLogin}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* 2. Hero Section with Flash Sale Banner */}
        {activeNav === 'home' && !searchQuery && selectedCategory === null && (
          <>
            <HeroBanner
              onShopNow={() => {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreDeals={() => {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 3. Category Carousel / Grid */}
            <div id="categories-section">
              <CategoryCards
                categories={categories}
                selectedCategoryId={selectedCategory}
                onSelectCategory={(id) => {
                  setSelectedCategory(id);
                  const el = document.getElementById('catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </>
        )}

        {/* 4. Product Catalog Listing (Filters, Sort, Products Grid, Reviews Modal) */}
        <div id="catalog-section" className="py-6">
          <ProductListing
            categories={categories}
            brands={brands}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
            onBuyNow={handleBuyNow}
          />
        </div>
      </main>

      {/* 5. Footer */}
      <Footer
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          const el = document.getElementById('catalog-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTrackOrder={() => handleOpenTrackOrder()}
      />

      {/* 6. Product Details / Quickview Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={handleBuyNow}
      />

      {/* 7. Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onProceedCheckout={() => {
          setDirectCheckoutProduct(null);
          setCartDrawerOpen(false);
          setCheckoutModalOpen(true);
        }}
        onContinueShopping={() => setCartDrawerOpen(false)}
      />

      {/* 8. Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        directProduct={directCheckoutProduct}
        onOrderSuccess={(order) => {
          setInvoiceOrder(order);
        }}
        openTrackOrderModal={(ordNumber) => {
          setCheckoutModalOpen(false);
          handleOpenTrackOrder(ordNumber);
        }}
        openInvoiceModal={(order) => {
          setCheckoutModalOpen(false);
          handleOpenInvoice(order);
        }}
      />

      {/* 9. Order Tracking Modal */}
      {trackOrderModalOpen && (
        <OrderTrackingView
          initialOrderNumber={trackOrderNumber}
          onClose={() => setTrackOrderModalOpen(false)}
        />
      )}

      {/* 10. User Account Modal */}
      <UserAccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        defaultTab={accountTab}
        onTrackOrder={handleOpenTrackOrder}
        onViewInvoice={handleOpenInvoice}
      />

      {/* 11. Admin Panel Modal */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        categories={categories}
        brands={brands}
      />

      {/* 12. Printable Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceModalOpen(false)}
      />

      {/* 13. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />

      {/* 14. Contact Us Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 space-y-5 my-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-zinc-900 uppercase">Contact Customer Concierge</h3>
              </div>
              <button
                onClick={() => setContactModalOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Have inquiries about an order, return request, or corporate bulk pricing? Reach our dedicated concierge desk 24/7.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 bg-zinc-50/60">
                <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-900">Email Support</div>
                  <div className="text-zinc-500">support@updates-ecommerce.com (Average response: 15 min)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 bg-zinc-50/60">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-900">Toll-Free Helpline</div>
                  <div className="text-zinc-500">1-800-UPDATES (1-800-873-2837)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 bg-zinc-50/60">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-900">Headquarters</div>
                  <div className="text-zinc-500">One World Trade Center, Suite 8500, New York, NY</div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Your message has been sent to our concierge team!');
                setContactModalOpen(false);
              }}
              className="space-y-3 pt-2"
            >
              <input
                type="text"
                placeholder="Your Name"
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                required
              />
              <textarea
                rows={3}
                placeholder="How can our customer support assist you today?"
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartWishlistProvider>
        <MainCommerceApp />
      </CartWishlistProvider>
    </AuthProvider>
  );
}
