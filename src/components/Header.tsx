import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  MapPin,
  Headphones,
  Bell,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Package,
  LogOut,
  Sliders,
  Sparkles,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartWishlistContext.tsx';
import type { Category, NotificationItem } from '../types.ts';

interface HeaderProps {
  categories?: Category[];
  activeView?: string;
  setActiveView?: (view: string) => void;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
  onSearch?: (query: string) => void;
  onSearchChange?: (query: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  openAuthModal?: () => void;
  onOpenLogin?: () => void;
  openCartDrawer?: () => void;
  onOpenCart?: () => void;
  openAccountModal?: (tab?: string) => void;
  onOpenAccount?: () => void;
  onOpenWishlist?: () => void;
  openAdminModal?: () => void;
  onOpenAdmin?: () => void;
  openTrackOrderModal?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories = [],
  activeView,
  setActiveView,
  activeNav,
  onNavChange,
  onSearch,
  onSearchChange,
  onSelectCategory,
  openAuthModal,
  onOpenLogin,
  openCartDrawer,
  onOpenCart,
  openAccountModal,
  onOpenAccount,
  onOpenWishlist,
  openAdminModal,
  onOpenAdmin,
  openTrackOrderModal,
  searchQuery = '',
  setSearchQuery,
}) => {
  const currentView = activeView || activeNav || 'home';
  const handleViewChange = (v: string) => {
    if (setActiveView) setActiveView(v);
    if (onNavChange) onNavChange(v);
  };
  const handleQueryChange = (q: string) => {
    if (setSearchQuery) setSearchQuery(q);
    if (onSearchChange) onSearchChange(q);
  };
  const handleSearchExecute = (q: string) => {
    if (onSearch) onSearch(q);
    if (onSearchChange) onSearchChange(q);
  };
  const handleAuthTrigger = () => {
    if (openAuthModal) openAuthModal();
    else if (onOpenLogin) onOpenLogin();
  };
  const handleCartTrigger = () => {
    if (openCartDrawer) openCartDrawer();
    else if (onOpenCart) onOpenCart();
  };
  const handleAccountTrigger = (tab?: string) => {
    if (openAccountModal) openAccountModal(tab);
    else if (tab === 'wishlist' && onOpenWishlist) onOpenWishlist();
    else if (onOpenAccount) onOpenAccount();
  };
  const handleAdminTrigger = () => {
    if (openAdminModal) openAdminModal();
    else if (onOpenAdmin) onOpenAdmin();
  };
  const handleTrackTrigger = () => {
    if (openTrackOrderModal) openTrackOrderModal();
    else handleViewChange('track-order');
  };
  const { user, isAuthenticated, isAdmin, logout, quickSwitch, token } = useAuth();
  const { cartCount, wishlistCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Noida Sector 62');
  const [newLocationText, setNewLocationText] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([
    'Noida Sector 62',
    'New York, NY 10001',
    'San Francisco, CA 94105',
    'Chicago, IL 60601',
    'Austin, TX 78701',
    'Mumbai, MH 400001',
    'London, EC1A 1BB',
  ]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Live search suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, token]);

  // Live autocomplete debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setDidYouMean(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setDidYouMean(data.didYouMean || null);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(searchQuery);
  };

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
    setShowSuggestions(false);
    onSearch(name);
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      {/* 1. TOP UTILITY BAR */}
      <div className="bg-black text-white px-4 sm:px-8 py-2 text-[11px] font-medium tracking-wide">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 uppercase">
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-1.5 transition-colors hover:text-emerald-400"
              title="Change Delivery Location"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-zinc-400">Deliver to:</span>
              <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[220px]">{selectedLocation}</span>
            </button>
            <span className="hidden md:inline">Customer Support: 1-800-UPDATES</span>
            <span
              onClick={() => setLocationModalOpen(true)}
              className="hidden lg:inline cursor-pointer hover:text-emerald-400 transition-colors"
            >
              Store Locator
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 uppercase">
            <button
              onClick={handleTrackTrigger}
              className="hover:text-emerald-400 transition-colors"
            >
              Track Order
            </button>
            <button
              onClick={() => handleAccountTrigger('orders')}
              className="hidden sm:inline hover:text-emerald-400 transition-colors"
            >
              Returns & Refunds
            </button>

            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-2 border-l border-zinc-800 pl-4 normal-case">
              <span className="text-zinc-500 text-[10px]">Demo:</span>
              <button
                onClick={() => quickSwitch('Customer')}
                className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  isAuthenticated && !isAdmin ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => quickSwitch('Admin')}
                className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  isAdmin ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo, Search, Actions) */}
      <div className="px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 sm:gap-8">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-zinc-900 hover:bg-gray-100 lg:hidden"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Clean Minimalism Brand Logo */}
          <div
            onClick={() => {
              handleViewChange('home');
              handleQueryChange('');
            }}
            className="flex cursor-pointer items-center gap-2.5 select-none group shrink-0"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 bg-white rotate-45"></div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-black">
              UPDATES<span className="text-emerald-500">.</span>
            </span>
          </div>

          {/* Search Bar with live autocomplete */}
          <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-xl mx-4 sm:mx-8">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0 || didYouMean) setShowSuggestions(true);
                }}
                placeholder="Search for premium electronics, fashion & more..."
                className="w-full bg-gray-50 border-none rounded-full py-2.5 px-6 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-4 text-gray-400 hover:text-black transition-colors"
              >
                <Search className="w-5 h-5" strokeWidth={2} />
              </button>
            </form>

            {/* Suggestions & Did You Mean Dropdown */}
            {showSuggestions && (suggestions.length > 0 || didYouMean) && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl z-50">
                {didYouMean && (
                  <div className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between">
                    <span>
                      Did you mean: <strong className="cursor-pointer underline" onClick={() => handleSuggestionClick(didYouMean)}>{didYouMean}</strong>?
                    </span>
                    <button
                      onClick={() => handleSuggestionClick(didYouMean)}
                      className="rounded bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold hover:bg-amber-300"
                    >
                      Search
                    </button>
                  </div>
                )}
                <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase px-3 py-1">
                  Suggested Products
                </div>
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.name)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className="font-black text-emerald-600">${item.discount_price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons (Clean Minimalism vertical stack) */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Notifications Bell */}
            <div className="relative">
              <div
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="flex flex-col items-center cursor-pointer select-none relative group"
                title="Notifications"
              >
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-800 group-hover:text-black transition-colors" strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                      {unreadCount}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1 uppercase text-gray-900 group-hover:text-black">
                  Alerts
                </span>
              </div>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 px-2">
                    <div className="font-black text-xs uppercase tracking-wider text-gray-900">Notifications</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl transition-colors ${
                            n.is_read ? 'opacity-70' : 'bg-emerald-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-xs text-gray-900">{n.title}</span>
                            <span className="text-[10px] text-gray-400">{n.created_at.slice(0, 10)}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account / Profile */}
            <div className="relative">
              {isAuthenticated ? (
                <div
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex flex-col items-center cursor-pointer select-none group"
                  title="My Account"
                >
                  <UserIcon className="w-6 h-6 text-gray-800 group-hover:text-black transition-colors" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold mt-1 uppercase text-gray-900 group-hover:text-black">
                    Account
                  </span>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl z-50 text-left"
                    >
                      <div className="border-b border-gray-100 px-3 py-2">
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Signed in as</div>
                        <div className="font-bold text-xs text-gray-900 truncate">{user?.name}</div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">{user?.role} Account</div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleAccountTrigger('profile');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleAccountTrigger('orders');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Package className="h-4 w-4 text-gray-400" />
                          My Orders
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleTrackTrigger();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <MapPin className="h-4 w-4 text-gray-400" />
                          Track Order
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleAdminTrigger();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 my-1"
                          >
                            <Sliders className="h-4 w-4 text-emerald-600" />
                            Admin Control
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={handleAuthTrigger}
                  className="flex flex-col items-center cursor-pointer select-none group"
                  title="Login / Register"
                >
                  <UserIcon className="w-6 h-6 text-gray-800 group-hover:text-black transition-colors" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold mt-1 uppercase text-gray-900 group-hover:text-black">
                    Account
                  </span>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <div
              onClick={() => {
                if (!isAuthenticated) {
                  handleAuthTrigger();
                } else {
                  handleAccountTrigger('wishlist');
                }
              }}
              className="flex flex-col items-center cursor-pointer relative select-none group"
              title="Wishlist"
            >
              <div className="relative">
                <Heart className="w-6 h-6 text-gray-800 group-hover:text-black transition-colors" strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {wishlistCount}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold mt-1 uppercase text-gray-900 group-hover:text-black">
                Wishlist
              </span>
            </div>

            {/* Cart */}
            <div
              onClick={handleCartTrigger}
              className="flex flex-col items-center cursor-pointer relative select-none group"
              title="Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-800 group-hover:text-black transition-colors" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {cartCount}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold mt-1 uppercase text-gray-900 group-hover:text-black">
                Cart
              </span>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full rounded-full border-none bg-gray-100 py-2.5 pl-4 pr-10 text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            <button type="submit" className="absolute right-3 text-gray-400">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION BAR (Clean Minimalism) */}
      <nav className="hidden lg:flex items-center justify-between border-t border-gray-100 px-4 sm:px-8 py-3 bg-white">
        <div className="mx-auto flex max-w-7xl w-full items-center justify-between">
          <div className="flex items-center gap-8 text-[12px] font-bold uppercase tracking-widest text-gray-500">
            {/* All Categories Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex items-center gap-2 text-gray-900 hover:text-black transition-colors font-bold uppercase"
              >
                <span>Categories</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {/* Mega Categories dropdown */}
              {categoryDropdownOpen && (
                <div
                  onMouseLeave={() => setCategoryDropdownOpen(false)}
                  className="absolute left-0 top-full mt-3 w-72 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in"
                >
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          if (onSelectCategory) onSelectCategory(cat.slug);
                          setCategoryDropdownOpen(false);
                        }}
                        className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors text-xs font-semibold text-gray-800"
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {cat.product_count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                handleViewChange('home');
                handleQueryChange('');
              }}
              className={`transition-colors ${
                currentView === 'home' && !searchQuery
                  ? 'text-black border-b-2 border-emerald-500 pb-1'
                  : 'hover:text-black'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                handleViewChange('products');
                handleSearchExecute('new_arrival');
              }}
              className={`hover:text-black transition-colors ${
                searchQuery === 'new_arrival' ? 'text-black border-b-2 border-emerald-500 pb-1' : ''
              }`}
            >
              New Arrivals
            </button>

            <button
              onClick={() => {
                handleViewChange('products');
                handleSearchExecute('best_seller');
              }}
              className={`hover:text-black transition-colors ${
                searchQuery === 'best_seller' ? 'text-black border-b-2 border-emerald-500 pb-1' : ''
              }`}
            >
              Best Sellers
            </button>

            <button
              onClick={() => {
                handleViewChange('products');
                handleSearchExecute('offers');
              }}
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Offers
            </button>

            <button
              onClick={() => {
                const footer = document.getElementById('footer-contact');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                else handleViewChange('contact');
              }}
              className="hover:text-black transition-colors"
            >
              Contact
            </button>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <span>Free Shipping Over $50</span>
            <span className="text-emerald-600">30-Day Returns</span>
          </div>
        </div>
      </nav>

      {/* 4. MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-base">
                    U
                  </div>
                  <span className="font-bold text-zinc-900">updates.</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User quick status in mobile */}
              <div className="mt-4 rounded-xl bg-zinc-50 p-3">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900">{user?.name}</div>
                      <div className="text-[11px] text-zinc-500">{user?.email}</div>
                    </div>
                    {isAdmin && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Admin
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full rounded-lg bg-zinc-900 py-2 text-center text-xs font-bold text-white"
                  >
                    Login / Create Account
                  </button>
                )}
              </div>

              {/* Navigation Links */}
              <div className="mt-5 space-y-1 text-sm font-semibold text-zinc-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveView('home');
                    setSearchQuery('');
                  }}
                  className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-zinc-100"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveView('products');
                    onSearch('');
                  }}
                  className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-zinc-100"
                >
                  All Products
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openTrackOrderModal();
                  }}
                  className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-zinc-100 flex items-center justify-between"
                >
                  <span>Track Order</span>
                  <Package className="h-4 w-4 text-emerald-600" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAdminModal();
                    }}
                    className="w-full text-left rounded-xl px-3 py-2.5 text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center justify-between"
                  >
                    <span>Admin Control Center</span>
                    <Sliders className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Categories listing */}
              <div className="mt-6">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-3 mb-2">
                  Shop by Categories
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSelectCategory(c.slug);
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 flex items-center justify-between"
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-zinc-400">({c.product_count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Footer logout */}
            {isAuthenticated && (
              <div className="border-t border-zinc-100 pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. LOCATION MODAL */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Choose Delivery Location
              </h3>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Select your delivery location to see product availability and real-time shipping speeds.
            </p>

            {/* Custom Location input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newLocationText.trim()) {
                  const loc = newLocationText.trim();
                  if (!availableLocations.includes(loc)) {
                    setAvailableLocations((prev) => [loc, ...prev]);
                  }
                  setSelectedLocation(loc);
                  setNewLocationText('');
                  setLocationModalOpen(false);
                }
              }}
              className="mt-4 flex gap-2"
            >
              <input
                type="text"
                placeholder="Enter city, sector or pincode..."
                value={newLocationText}
                onChange={(e) => setNewLocationText(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-black focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-colors uppercase tracking-wider shrink-0"
              >
                Apply
              </button>
            </form>

            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setLocationModalOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition-all ${
                    selectedLocation === loc
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span>{loc}</span>
                  {selectedLocation === loc && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
