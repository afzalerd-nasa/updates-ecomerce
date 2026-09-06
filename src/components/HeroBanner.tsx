import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onShopNow: () => void;
  onExplore?: (category?: string) => void;
  onExploreDeals?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, onExplore, onExploreDeals }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleExplore = (cat?: string) => {
    if (onExplore) onExplore(cat);
    else if (onExploreDeals) onExploreDeals();
  };

  const slides = [
    {
      id: 1,
      badge: 'SUMMER MEGA SALE • UP TO 50% OFF',
      title: 'SHOP SMART.',
      titleAccent: 'SHOP BETTER.',
      subtitle: 'Discover quality products at the best prices with lightning-fast delivery and verified reviews.',
      ctaText: 'SHOP NOW',
      secondaryCta: 'EXPLORE ELECTRONICS',
      targetCategory: 'electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
      tag: 'Flagship Audio & Gadgets',
      priceSnippet: 'From $199.99',
    },
    {
      id: 2,
      badge: 'EXCLUSIVE NEW ARRIVALS 2026',
      title: 'ELEVATE YOUR',
      titleAccent: 'EVERYDAY STYLE.',
      subtitle: 'Curated premium fashion, luxury timepieces, and statement essentials designed for everyday living.',
      ctaText: 'SHOP FASHION',
      secondaryCta: 'VIEW WATCHES',
      targetCategory: 'fashion',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
      tag: 'Trending Streetwear',
      priceSnippet: 'Up to 40% Off',
    },
    {
      id: 3,
      badge: 'LIMITED TIME TECH SPECIALS',
      title: 'NEXT-GEN TECH.',
      titleAccent: 'UNBEATABLE SPEED.',
      subtitle: 'Supercharge your productivity with the newest M3 Pro laptops, smart devices, and accessories.',
      ctaText: 'EXPLORE TECH',
      secondaryCta: 'VIEW LAPTOPS',
      targetCategory: 'laptops',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80',
      tag: 'Pro Performance',
      priceSnippet: 'Save $200 Today',
    },
  ];

  // Auto-play slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Clean Minimalism Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-10">
          {/* Main Hero Showcase (8 cols) */}
          <div className="lg:col-span-8 bg-gray-50 rounded-2xl p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[380px] sm:min-h-[420px]">
            <div className="z-10 max-w-md">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2 block">
                {slide.badge}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
                {slide.title} <span className="text-emerald-600">{slide.titleAccent}</span>
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed line-clamp-3">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onShopNow}
                  className="bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-xs group"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => handleExplore(slide.targetCategory)}
                  className="bg-white border border-gray-200 text-gray-900 text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                  {slide.secondaryCta}
                </button>
              </div>
            </div>

            {/* Slide Image with subtle overlay */}
            <div className="absolute right-0 bottom-0 top-0 w-full sm:w-1/2 overflow-hidden flex items-center justify-center pointer-events-none opacity-20 sm:opacity-90">
              <img
                src={slide.image}
                alt={slide.title}
                className="object-cover h-full w-full transition-transform duration-700 hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/60 to-transparent sm:block hidden" />
            </div>

            {/* Slide indicators & arrow controls */}
            <div className="z-10 mt-6 flex items-center justify-between pt-4 border-t border-gray-200/50">
              <div className="flex items-center gap-2">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentSlide === idx ? 'w-6 bg-black' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Promotional Stack (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Card 1: Minimalist Dark Feature Card */}
            <div className="bg-gray-950 text-white rounded-2xl p-6 sm:p-7 flex-1 flex flex-col justify-between relative overflow-hidden min-h-[190px]">
              <div className="z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Limited Edition
                </span>
                <h3 className="text-xl font-bold mt-1 text-white">Titanium Chrono</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                  Precision-crafted luxury timepieces with sapphire crystal.
                </p>
              </div>
              <div className="flex items-end justify-between z-10 mt-4">
                <span className="text-base font-bold text-emerald-400">$499.00</span>
                <button
                  onClick={() => handleExplore('watches')}
                  className="text-xs font-bold uppercase tracking-wider text-white underline hover:text-emerald-400 transition-colors"
                >
                  Explore Collection
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 w-36 h-36 opacity-30 pointer-events-none">
                <img
                  className="object-cover w-full h-full rounded-full"
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
                  alt="Watch"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Card 2: Minimalist Discount Coupon Card */}
            <div className="border border-gray-200 rounded-2xl p-6 flex-1 flex items-center justify-between bg-white hover:border-gray-300 transition-colors">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Special Offer
                </span>
                <h3 className="text-lg font-bold text-gray-900">Get 20% Off</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Use coupon <span className="font-mono font-bold text-black bg-gray-100 px-1.5 py-0.5 rounded">MINIMAL20</span>
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-sm shrink-0 border border-emerald-100">
                20%
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Trust & Guarantee Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-y border-gray-100 text-center">
          <div className="flex items-center justify-center gap-3">
            <Truck className="h-5 w-5 text-gray-400 shrink-0" strokeWidth={1.5} />
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">Free Global Shipping</p>
              <p className="text-[11px] text-gray-500">On all orders over $50</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <ShieldCheck className="h-5 w-5 text-gray-400 shrink-0" strokeWidth={1.5} />
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">100% Genuine Quality</p>
              <p className="text-[11px] text-gray-500">Certified authentic brands</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 text-gray-400 shrink-0" strokeWidth={1.5} />
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">30-Day Free Returns</p>
              <p className="text-[11px] text-gray-500">No hassle return policy</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Zap className="h-5 w-5 text-gray-400 shrink-0" strokeWidth={1.5} />
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">24/7 Dedicated Support</p>
              <p className="text-[11px] text-gray-500">Always here to help you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
