import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCw,
  MapPin,
  CheckCircle,
  ThumbsUp,
  CreditCard,
  Check,
  Share2,
} from 'lucide-react';
import type { Product, Review } from '../types.ts';
import { useCart } from '../context/CartWishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product, quantity: number, size?: string, color?: string) => void;
  openAuthModal: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onBuyNow,
  openAuthModal,
}) => {
  const { addToCart, toggleWishlist, isInWishlist, showToast } = useCart();
  const { isAuthenticated, token } = useAuth();

  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'shipping'>('details');

  // PIN code checker state
  const [pinCode, setPinCode] = useState('');
  const [pinChecked, setPinChecked] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Write Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);

  // Detailed product data fetched from backend
  const [fullProduct, setFullProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!product) return;

    // Reset state
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setPinChecked(false);
    setActiveTab('details');

    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullProduct(data.product);
          setReviewsList(data.reviews || []);

          if (data.images && data.images.length > 0) {
            setSelectedImage(data.images[0].image_url);
          } else {
            setSelectedImage(data.product.primary_image || '');
          }

          if (data.variants && data.variants.length > 0) {
            const sizes = Array.from(new Set(data.variants.map((v: any) => v.size).filter(Boolean))) as string[];
            if (sizes.length > 0) setSelectedSize(sizes[0]);

            const colors = Array.from(new Set(data.variants.map((v: any) => v.color).filter(Boolean))) as string[];
            if (colors.length > 0) setSelectedColor(colors[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      }
    };

    fetchDetails();
  }, [product]);

  if (!product) return null;

  const currentProduct = fullProduct || product;
  const inWishlist = isInWishlist(currentProduct.id);

  // Delivery check logic
  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.length < 3) return;
    setPinChecked(true);
    const date = new Date();
    date.setDate(date.getDate() + 2);
    setEstimatedDelivery(
      date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    );
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: currentProduct.id,
          rating: reviewRating,
          reviewText,
        }),
      });
      if (res.ok) {
        showToast('Review submitted! Thank you for your feedback ⭐');
        setShowReviewForm(false);
        setReviewText('');

        // Refresh reviews
        const refRes = await fetch(`/api/products/${currentProduct.id}`);
        if (refRes.ok) {
          const refData = await refRes.json();
          setReviewsList(refData.reviews || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Vote helpful
  const handleVoteHelpful = async (reviewId: number) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      setReviewsList((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful_votes: r.helpful_votes + 1 } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3.5 bg-white z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>{currentProduct.category_name || 'Products'}</span>
            <span>/</span>
            <span className="font-semibold text-zinc-800">{currentProduct.brand_name || 'Brand'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Product link copied to clipboard!');
              }}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Main Top Section: Image Gallery & Product Buy Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Gallery Column */}
            <div className="md:col-span-6 flex flex-col gap-4">
              {/* Main Image with Zoom container */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 group">
                <img
                  src={selectedImage || currentProduct.primary_image}
                  alt={currentProduct.name}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-125"
                  referrerPolicy="no-referrer"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {currentProduct.discount_percentage > 0 && (
                    <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black uppercase text-white shadow-xs">
                      {currentProduct.discount_percentage}% OFF
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 rounded-full bg-zinc-900/75 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-xs">
                  Hover to Zoom
                </div>
              </div>

              {/* Thumbnails */}
              {currentProduct.images && currentProduct.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {currentProduct.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        selectedImage === img.image_url
                          ? 'border-emerald-600 shadow-sm'
                          : 'border-zinc-200 hover:border-zinc-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt="thumbnail"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Buy Box & Product Info */}
            <div className="md:col-span-6 flex flex-col space-y-5">
              {/* Brand & Title */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  {currentProduct.brand_name || 'Official Store'}
                </span>
                <h1 className="mt-1 text-xl sm:text-2xl font-black text-zinc-900 leading-snug">
                  {currentProduct.name}
                </h1>
                <div className="mt-1 text-xs text-zinc-400">SKU: {currentProduct.sku}</div>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-3 border-y border-zinc-100 py-3 text-xs">
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-extrabold text-emerald-800">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{currentProduct.rating?.toFixed(1) || '4.8'}</span>
                </div>
                <span className="text-zinc-500 font-medium">
                  {currentProduct.review_count || 48} Ratings & Reviews
                </span>
                <span className="text-zinc-300">|</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> 100% Verified Genuine
                </span>
              </div>

              {/* Price & Discount Box */}
              <div className="rounded-2xl bg-zinc-50/80 p-4 border border-zinc-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-zinc-900">
                    ${currentProduct.discount_price?.toFixed(2)}
                  </span>
                  {currentProduct.original_price > currentProduct.discount_price && (
                    <span className="text-base text-zinc-400 line-through">
                      ${currentProduct.original_price?.toFixed(2)}
                    </span>
                  )}
                  {currentProduct.discount_percentage > 0 && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      Save ${(currentProduct.original_price - currentProduct.discount_price).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  Inclusive of all local taxes. Free shipping on orders above $50.
                </div>

                {/* EMI Box */}
                {currentProduct.emi_info && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2.5 border border-zinc-200 text-xs text-zinc-700">
                    <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{currentProduct.emi_info}</span>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div>
                {currentProduct.stock_quantity <= 0 ? (
                  <div className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                    Currently Out of Stock
                  </div>
                ) : currentProduct.stock_quantity <= 5 ? (
                  <div className="rounded-xl bg-amber-50 p-2.5 text-xs font-bold text-amber-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Hurry! Only {currentProduct.stock_quantity} left in stock.
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> In Stock & Ready to Ship
                  </div>
                )}
              </div>

              {/* Size Selector if available */}
              {currentProduct.variants && currentProduct.variants.some((v) => v.size) && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-800 mb-2">
                    <span>Select Size:</span>
                    <span className="text-emerald-600 underline cursor-pointer">Size Guide</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(currentProduct.variants.map((v) => v.size).filter(Boolean))).map(
                      (size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size as string)}
                          className={`min-w-10 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                            selectedSize === size
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-800">Quantity:</span>
                <div className="flex items-center rounded-xl border border-zinc-300 bg-white p-1">
                  <button
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-zinc-900">{quantity}</span>
                  <button
                    disabled={quantity >= currentProduct.stock_quantity}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: ADD TO CART, BUY NOW, WISHLIST */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  disabled={currentProduct.stock_quantity <= 0}
                  onClick={() => addToCart(currentProduct, quantity, selectedSize, selectedColor)}
                  className="flex-1 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-zinc-900 bg-white py-3.5 text-xs font-bold text-zinc-900 transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>ADD TO CART</span>
                </button>

                <button
                  disabled={currentProduct.stock_quantity <= 0}
                  onClick={() => {
                    onClose();
                    onBuyNow(currentProduct, quantity, selectedSize, selectedColor);
                  }}
                  className="flex-1 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <span>BUY NOW</span>
                </button>

                <button
                  onClick={() => toggleWishlist(currentProduct)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all ${
                    inWishlist
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                  }`}
                  title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* PIN Code Delivery Checker */}
              <div className="rounded-2xl border border-zinc-200 p-4">
                <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Delivery & Service Availability
                </div>
                <form onSubmit={handleCheckDelivery} className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Postal / PIN Code"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    Check
                  </button>
                </form>

                {pinChecked && (
                  <div className="mt-3 rounded-xl bg-emerald-50/70 p-2.5 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span>
                      Get it by <strong>{estimatedDelivery}</strong> with Standard Delivery!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Tabs: Description, Specs, Reviews, Shipping */}
          <div className="border-t border-zinc-200 pt-6">
            {/* Tabs Header */}
            <div className="flex border-b border-zinc-200 text-xs font-bold gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 transition-colors ${
                  activeTab === 'details'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Description & Highlights
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Customer Reviews ({reviewsList.length})
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-3 transition-colors ${
                  activeTab === 'shipping'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Shipping & Returns
              </button>
            </div>

            {/* Tab 1: Description & Key Features */}
            {activeTab === 'details' && (
              <div className="py-5 space-y-4">
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {currentProduct.description}
                </p>

                {currentProduct.features && currentProduct.features.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Key Highlights & Features
                    </h4>
                    <ul className="space-y-2">
                      {currentProduct.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Specifications Table */}
            {activeTab === 'specs' && (
              <div className="py-5">
                <div className="overflow-hidden rounded-2xl border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
                    <tbody className="divide-y divide-zinc-100">
                      <tr className="bg-zinc-50/60">
                        <td className="px-4 py-3 font-bold text-zinc-500 w-1/3">Brand</td>
                        <td className="px-4 py-3 text-zinc-900 font-semibold">{currentProduct.brand_name || 'Updates Select'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-zinc-500">Model / SKU</td>
                        <td className="px-4 py-3 text-zinc-900">{currentProduct.sku}</td>
                      </tr>
                      {currentProduct.specifications &&
                        Object.entries(currentProduct.specifications).map(([key, val]) => (
                          <tr key={key} className="odd:bg-zinc-50/40">
                            <td className="px-4 py-3 font-bold text-zinc-500 capitalize">{key.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-zinc-900">{val}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Customer Reviews */}
            {activeTab === 'reviews' && (
              <div className="py-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">Customer Feedback</h3>
                    <div className="text-xs text-zinc-500">Verified buyer ratings & real user thoughts</div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        openAuthModal();
                      } else {
                        setShowReviewForm(!showReviewForm);
                      }
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Write Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900">Submit Your Experience</h4>
                    <div>
                      <span className="text-xs text-zinc-600 mr-2">Your Rating:</span>
                      <div className="inline-flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setReviewRating(s)}
                            className="p-1"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your honest review about quality, delivery, and overall satisfaction..."
                      className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        {submittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviewsList.length === 0 ? (
                    <div className="rounded-2xl bg-zinc-50 p-6 text-center text-xs text-zinc-400">
                      No reviews yet. Be the first to review this product!
                    </div>
                  ) : (
                    reviewsList.map((rev) => (
                      <div key={rev.id} className="rounded-2xl border border-zinc-200/80 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-zinc-900">{rev.user_name}</span>
                            {rev.is_verified_purchase === 1 && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {rev.created_at ? rev.created_at.slice(0, 10) : 'Recent'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>

                        <p className="text-xs text-zinc-700">{rev.review_text}</p>

                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleVoteHelpful(rev.id)}
                            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span>Helpful ({rev.helpful_votes || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Shipping & Return Policy */}
            {activeTab === 'shipping' && (
              <div className="py-5 space-y-4 text-xs text-zinc-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <Truck className="h-5 w-5 text-emerald-600 mb-2" />
                    <h5 className="font-bold text-zinc-900 mb-1">Fast Delivery</h5>
                    <p className="text-zinc-500 leading-relaxed">
                      Orders placed before 2 PM are dispatched the same day. Standard delivery takes 2-4 business days.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <RefreshCw className="h-5 w-5 text-emerald-600 mb-2" />
                    <h5 className="font-bold text-zinc-900 mb-1">30-Day Hassle-Free Returns</h5>
                    <p className="text-zinc-500 leading-relaxed">
                      Return or exchange eligible items in original packaging within 30 days for a full refund.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />
                    <h5 className="font-bold text-zinc-900 mb-1">Brand Warranty</h5>
                    <p className="text-zinc-500 leading-relaxed">
                      All branded products come with a 1-year manufacturer replacement warranty.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
