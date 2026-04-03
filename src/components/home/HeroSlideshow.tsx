'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatPrice, getStorageUrl } from '@/lib/utils';
import type { Product } from '@/lib/database.types';

interface HeroSlideshowProps {
  products: Product[];
  hero?: Record<string, string>;
}

export default function HeroSlideshow({ products, hero }: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasProducts = products.length > 0;
  const total = hasProducts ? products.length : 1;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent((index + total) % total);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning, total]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (!hasProducts) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, hasProducts]);

  return (
    <section className="relative w-full h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden bg-white">
      {hasProducts ? (
        products.map((product, idx) => (
          <div
            key={product.id}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-out',
              idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            )}
          >
            <img
              src={getStorageUrl(product.thumbnail)}
              alt={product.name_ko || product.name}
              className="w-full h-full object-cover object-center scale-125"
            />
          </div>
        ))
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent via-30% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-l from-white/50 via-transparent via-10% to-transparent" />

      <div className="relative h-full container-app flex items-start pt-20">
        <div className="max-w-lg z-10">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 backdrop-blur-sm border border-brand-200/50">
              깐깐한 안목으로 고른 프리미엄 리스트
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
            {hero?.title || '한국 직배송'}
            <br />
            <span className="text-gradient text-4xl md:text-4xl lg:text-3xl">
              {hero?.subtitle || '뷰티 · 패션 · 식품'}
            </span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed max-w-md">
            "믿고 사는 스타일헤바 컬렉션"
            <br />
            한국의 핫한 제품들을 스타일헤바에서 만나보세요.
          </p>
        </div>
      </div>

      {/* Bottom Bar: Buttons (left) + Dots (center) + Thumbnails (right) */}
      <div className="absolute bottom-6 left-0 right-0 z-20 container-app">
        <div className="flex items-end justify-between">
          {/* Left: CTA Buttons */}
          <div className="flex gap-2">
            <Link href="/preorder" className="btn-primary text-sm px-5 py-2.5 shadow-lg shadow-brand-500/20">
              지금 공구 보러가기
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
            <Link href="/shop" className="btn-secondary text-sm px-5 py-2.5 bg-white/70 backdrop-blur-sm">
              바로구매
            </Link>
          </div>

          {/* Center: Dots */}
          {hasProducts && products.length > 1 && (
            <div className="flex items-center gap-2">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    idx === current
                      ? 'w-8 h-2 bg-brand-500'
                      : 'w-2 h-2 bg-slate-400/40 hover:bg-slate-400/70'
                  )}
                />
              ))}
            </div>
          )}

          {/* Right: Thumbnail Strip */}
          {hasProducts && products.length > 1 && (
            <div className="hidden lg:flex items-end gap-2">
              {products.slice(0, 6).map((product, idx) => (
                <button
                  key={product.id}
                  onClick={() => goTo(idx)}
                  className={cn(
                    'rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-sm',
                    idx === current
                      ? 'w-16 h-16 border-brand-500 ring-2 ring-brand-200 scale-110'
                      : 'w-12 h-12 border-white/70 opacity-70 hover:opacity-100 hover:scale-105'
                  )}
                >
                  <img
                    src={getStorageUrl(product.thumbnail)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Arrows */}
      {hasProducts && products.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center text-slate-600 hover:bg-white/90 hover:text-slate-900 transition-all shadow-sm opacity-0 md:opacity-100 hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center text-slate-600 hover:bg-white/90 hover:text-slate-900 transition-all shadow-sm opacity-0 md:opacity-100 hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  );
}
