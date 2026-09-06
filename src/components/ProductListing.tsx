import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import type { Product, Category, Brand } from '../types.ts';
import { ProductCard } from './ProductCard.tsx';

interface ProductListingProps {
  initialCategory?: string;
  initialSearch?: string;
  selectedCategory?: string | number | null;
  onSelectCategory?: (cat: any) => void;
  searchQuery?: string;
  onSelectProduct: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  categories: Category[];
  brands: Brand[];
}

export const ProductListing: React.FC<ProductListingProps> = ({
  initialCategory = '',
  initialSearch = '',
  selectedCategory: propCategory,
  onSelectCategory: onPropSelectCategory,
  searchQuery: propSearch,
  onSelectProduct,
  onBuyNow,
  categories,
  brands,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Compute effective initial category string from propCategory or initialCategory
  const getCategorySlug = (catVal: string | number | null | undefined): string => {
    if (!catVal) return '';
    if (typeof catVal === 'string') return catVal;
    const found = categories.find((c) => c.id === catVal);
    return found ? found.slug : String(catVal);
  };

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(
    getCategorySlug(propCategory) || initialCategory
  );
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync initial category or search when props change
  useEffect(() => {
    if (propCategory !== undefined) {
      setSelectedCategory(getCategorySlug(propCategory));
      setCurrentPage(1);
    } else if (initialCategory) {
      setSelectedCategory(initialCategory);
      setCurrentPage(1);
    }
  }, [propCategory, initialCategory, categories]);

  const activeSearch = propSearch !== undefined ? propSearch : initialSearch;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeSearch && activeSearch !== 'new_arrival' && activeSearch !== 'best_seller' && activeSearch !== 'offers') {
        params.append('q', activeSearch);
      }
      if (activeSearch === 'new_arrival') {
        params.append('isNewArrival', '1');
      }
      if (activeSearch === 'best_seller') {
        params.append('sort', 'popular');
      }
      if (activeSearch === 'offers') {
        params.append('discount', '20');
      }

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minRating) params.append('rating', String(minRating));
      if (minDiscount) params.append('discount', String(minDiscount));
      if (inStockOnly) params.append('inStock', 'true');

      params.append('sort', sortBy);
      params.append('page', String(currentPage));
      params.append('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalCount(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    activeSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    inStockOnly,
    sortBy,
    currentPage,
  ]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(null);
    setMinDiscount(null);
    setInStockOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory ||
    selectedBrand ||
    minPrice ||
    maxPrice ||
    minRating ||
    minDiscount ||
    inStockOnly;

  return (
    <div id="catalog-section" className="bg-white min-h-screen py-10 sm:py-12 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
              <span>Home</span>
              <span>/</span>
              <span className="text-gray-900 font-bold">{selectedCategory ? selectedCategory.replace('-', ' ') : 'All Products'}</span>
              {initialSearch && (
                <>
                  <span>/</span>
                  <span className="text-emerald-600 font-bold">Search: &quot;{initialSearch}&quot;</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 capitalize tracking-tight">
              {selectedCategory ? selectedCategory.replace('-', ' ') : initialSearch ? `Search: "${initialSearch}"` : 'Featured Collection'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Showing <span className="font-bold text-gray-900">{totalCount}</span> items in inventory
            </p>
          </div>

          {/* Sort By & View Mode & Mobile Filter Trigger */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow-xs uppercase tracking-wider"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-gray-400">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-800 focus:border-black focus:outline-hidden cursor-pointer"
              >
                <option value="popular">Popularity & Best Seller</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_low_high">Price: Low to High</option>
                <option value="price_high_low">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>

            {/* View Mode (Grid vs List) */}
            <div className="hidden sm:flex items-center rounded-full border border-gray-200 bg-white p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar Filters + Products Catalogue */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                <span className="font-extrabold text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                  Filter Options
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset All
                  </button>
                )}
              </div>

              {/* 1. Category Filter */}
              <div className="mt-5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Category
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <div
                    onClick={() => {
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCategory === '' ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>All Categories</span>
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setCurrentPage(1);
                      }}
                      className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                        selectedCategory === cat.slug ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className={`text-[10px] ${selectedCategory === cat.slug ? 'text-gray-300' : 'text-gray-400'}`}>
                        ({cat.product_count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Brand Filter */}
              <div className="mt-6 border-t border-gray-200/60 pt-5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Brand
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  <div
                    onClick={() => {
                      setSelectedBrand('');
                      setCurrentPage(1);
                    }}
                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedBrand === '' ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>All Brands</span>
                  </div>
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBrand(b.slug);
                        setCurrentPage(1);
                      }}
                      className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                        selectedBrand === b.slug ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      <span className={`text-[10px] ${selectedBrand === b.slug ? 'text-gray-300' : 'text-gray-400'}`}>
                        ({b.product_count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Price Range Filter */}
              <div className="mt-6 border-t border-gray-200/60 pt-5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Price Range ($)
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-hidden"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. Customer Rating Filter */}
              <div className="mt-6 border-t border-gray-200/60 pt-5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Customer Rating
                </h4>
                <div className="space-y-1">
                  {[4, 3, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setMinRating(minRating === r ? null : r);
                        setCurrentPage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        minRating === r ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{r}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>& above</span>
                      </div>
                      {minRating === r && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Discount Percentage Filter */}
              <div className="mt-6 border-t border-gray-200/60 pt-5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  Discount
                </h4>
                <div className="space-y-1">
                  {[10, 20, 30, 50].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setMinDiscount(minDiscount === d ? null : d);
                        setCurrentPage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        minDiscount === d ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{d}% and above</span>
                      {minDiscount === d && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Availability Checkbox */}
              <div className="mt-6 border-t border-gray-200/60 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>Exclude Out of Stock</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Catalog Grid / List */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 border border-gray-100">
                  <SlidersHorizontal className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">No matching products found</h3>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Try adjusting your filter criteria or search for another term.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 rounded-full bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'
                      : 'flex flex-col gap-4'
                  }
                >
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelectProduct={onSelectProduct}
                      onBuyNow={onBuyNow}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-9 w-9 rounded-full text-xs font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-black text-white shadow-xs'
                              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <span className="font-bold text-sm text-zinc-900">Filters</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Filter Content */}
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-zinc-400 mb-1">Categories</h4>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-zinc-400 mb-1">Brands</h4>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs"
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex gap-2">
              <button
                onClick={handleClearFilters}
                className="flex-1 rounded-xl border border-zinc-300 py-2 text-xs font-bold text-zinc-700"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
