import React from 'react';
import { Star, Heart, ShoppingBag, Eye, Check } from 'lucide-react';
import type { Product } from '../types.ts';
import { useCart } from '../context/CartWishlistContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct, onBuyNow }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const inWishlist = isInWishlist(product.id);

  const displayImage =
    product.primary_image ||
    (product.images && product.images.length > 0 ? product.images[0].image_url : '') ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-md">
      {/* Top Image Container */}
      <div
        className="relative aspect-square w-full overflow-hidden bg-gray-50 cursor-pointer flex items-center justify-center p-4 border-b border-gray-100/60"
        onClick={() => onSelectProduct(product)}
      >
        <img
          src={displayImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 rounded-xl"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.discount_percentage > 0 ? (
            <span className="bg-white text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-2xs border border-gray-100">
              {product.discount_percentage}% OFF
            </span>
          ) : product.is_new_arrival === 1 ? (
            <span className="bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
              NEW
            </span>
          ) : null}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            inWishlist
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white text-gray-400 hover:text-black shadow-2xs'
          }`}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Quick View Pill on Hover */}
        <div className="absolute inset-x-4 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-gray-900 shadow-md hover:bg-gray-50 border border-gray-100"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand & Stock Pill */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-gray-400 uppercase tracking-wider truncate max-w-[120px]">
            {product.brand_name || 'Updates Select'}
          </span>
          {isOutOfStock ? (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-bold text-gray-500">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700 animate-pulse">
              Only {product.stock_quantity} left
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
              <Check className="h-3 w-3" /> In Stock
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onSelectProduct(product)}
          className="mt-1.5 text-sm font-bold text-gray-900 line-clamp-1 cursor-pointer hover:text-emerald-600 transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Ratings & Category */}
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-700 font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating?.toFixed(1) || '4.8'}</span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({product.review_count || 42})
            </span>
          </div>
          <span className="text-[11px] text-gray-400 truncate max-w-[100px]">
            {product.category_name}
          </span>
        </div>

        {/* Pricing */}
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-gray-900">
              ${product.discount_price?.toFixed(2)}
            </span>
            {product.original_price > product.discount_price && (
              <span className="text-xs text-gray-400 line-through">
                ${product.original_price?.toFixed(2)}
              </span>
            )}
          </div>
          {product.discount_percentage > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 uppercase">
              Save ${(product.original_price - product.discount_price).toFixed(0)}
            </span>
          )}
        </div>

        {/* Action Buttons: Add to Bag & Buy Now */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
          <button
            disabled={isOutOfStock}
            onClick={() => addToCart(product, 1)}
            className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white py-2 text-xs font-bold text-gray-900 transition-colors hover:border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>

          <button
            disabled={isOutOfStock}
            onClick={() => onBuyNow(product)}
            className="flex items-center justify-center rounded-full bg-emerald-600 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            <span>Buy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
