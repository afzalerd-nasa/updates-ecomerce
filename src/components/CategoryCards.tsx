import React from 'react';
import type { Category } from '../types.ts';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardsProps {
  categories: Category[];
  onSelectCategory: (cat: any) => void;
  selectedCategoryId?: number | null;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ categories, onSelectCategory, selectedCategoryId }) => {
  return (
    <section className="py-10 sm:py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1 block">
              Browse Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Shop by Category
            </h2>
          </div>
          <p className="text-xs text-gray-500 max-w-md">
            Explore authentic handpicked items across 11 curated premier retail departments.
          </p>
        </div>

        {/* 11 Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 transition-all duration-300 hover:border-gray-300 hover:shadow-xs"
            >
              {/* Category Image */}
              <div className="aspect-square w-full overflow-hidden bg-gray-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>

              {/* Card Label */}
              <div className="p-3.5 bg-white border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-black transition-colors truncate">
                    {cat.name}
                  </h3>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-gray-400">
                  {cat.product_count} {cat.product_count === 1 ? 'Product' : 'Products'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
