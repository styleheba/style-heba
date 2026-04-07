'use client';

import Link from 'next/link';
import { cn, formatPrice, getStorageUrl, getSlotPercentage, CATEGORY_LABELS } from '@/lib/utils';
import type { Product } from '@/lib/database.types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const slotsPercent = getSlotPercentage(product.sold_count, product.total_slots);
  const isAlmostFull = slotsPercent >= 80;
  const href =
    product.product_type === 'preorder'
      ? `/preorder/${product.slug}`
      : `/shop/${product.slug}`;

  return (
    <Link href={href} className="product-card group">
      {/* Image - 4:5 비율 (인스타그램 피드) */}
      <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: '1/1' }}>
        <img
          src={getStorageUrl(product.thumbnail)}
          alt={product.name_ko || product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.product_type === 'preorder' && (
            <span className="badge bg-brand-500 text-white text-[10px] px-2 py-0.5">
              공구
            </span>
          )}
          {product.original_price && product.original_price > product.price && (
            <span className="badge bg-red-500 text-white text-[10px] px-2 py-0.5">
              {Math.round(
                ((product.original_price - product.price) / product.original_price) * 100
              )}
              % OFF
            </span>
          )}
          {isAlmostFull && (
            <span className="badge bg-amber-500 text-white text-[10px] px-2 py-0.5">
              마감임박
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <p className="text-[11px] text-slate-400 font-medium mb-1">
          {CATEGORY_LABELS[product.category] || product.category}
        </p>
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {product.name_ko || product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-brand-600">
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Slots Progress (preorder only) */}
        {product.product_type === 'preorder' && product.total_slots > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>{product.sold_count}/{product.total_slots}개</span>
              <span>{slotsPercent}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={cn(
                  'progress-bar-fill',
                  isAlmostFull && 'from-amber-400 to-red-500'
                )}
                style={{ width: `${Math.min(slotsPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
