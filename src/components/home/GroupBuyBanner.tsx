'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Package } from 'lucide-react';
import type { GroupBuy, Product } from '@/lib/database.types';
import { cn, formatPrice, getStorageUrl } from '@/lib/utils';

interface GroupBuyBannerProps {
  groupBuy: GroupBuy;
  products?: Product[];
}

export default function GroupBuyBanner({ groupBuy, products = [] }: GroupBuyBannerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const isActive = groupBuy.status === 'active';

  useEffect(() => {
    const target = isActive
      ? new Date(groupBuy.close_at).getTime()
      : new Date(groupBuy.open_at).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(isActive ? '마감' : '오픈!');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (d > 0) setTimeLeft(`${d}일 ${h}시간 ${m}분`);
      else setTimeLeft(`${h}시간 ${m}분 ${s}초`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [groupBuy, isActive]);

  const previewProducts = products.slice(0, 2);

  return (
    <Link
      href="/preorder"
      className={cn(
        'block rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group',
        isActive
          ? 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 border border-pink-200'
          : 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-purple-200'
      )}
    >
      <div className="flex">
        <div className="flex-1 p-5">
          <span
            className={cn(
              'inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2',
              isActive
                ? 'bg-pink-200/60 text-pink-700'
                : 'bg-purple-200/60 text-purple-700'
            )}
          >
            {isActive ? '✨ 진행중' : '📅 오픈 예정'}
          </span>

          <h4 className={cn(
            'text-lg font-bold leading-snug',
            isActive ? 'text-pink-900' : 'text-purple-900'
          )}>
            {groupBuy.title_ko || groupBuy.title}
          </h4>

          {groupBuy.description && (
            <p className={cn(
              'text-xs mt-1',
              isActive ? 'text-pink-600/70' : 'text-purple-600/70'
            )}>
              {groupBuy.description}
            </p>
          )}

          <div className={cn(
            'mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl',
            isActive ? 'bg-pink-200/40' : 'bg-purple-200/40'
          )}>
            <Clock className={cn(
              'w-5 h-5',
              isActive ? 'text-pink-600' : 'text-purple-600'
            )} />
            <div>
              <p className={cn(
                'text-[10px] font-medium leading-none',
                isActive ? 'text-pink-500' : 'text-purple-500'
              )}>
                {isActive ? '마감까지' : '오픈까지'}
              </p>
              <p className={cn(
                'text-lg font-bold leading-tight tracking-tight',
                isActive ? 'text-pink-800' : 'text-purple-800'
              )}>
                {timeLeft}
              </p>
            </div>
          </div>

          {products.length > 0 && (
            <div className={cn(
              'mt-2 flex items-center gap-1 text-xs font-medium',
              isActive ? 'text-pink-500' : 'text-purple-500'
            )}>
              <Package className="w-3.5 h-3.5" />
              {products.length}개 상품
            </div>
          )}
        </div>

        {previewProducts.length > 0 && (
          <div className="flex flex-col gap-1 w-36 md:w-44 flex-shrink-0 p-2">
            {previewProducts.map((product) => (
              <div
                key={product.id}
                className="flex-1 rounded-xl overflow-hidden"
              >
                {product.thumbnail ? (
                  <img
                    src={getStorageUrl(product.thumbnail)}
                    alt={product.name_ko || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    'w-full h-full flex items-center justify-center text-xs',
                    isActive ? 'bg-pink-100 text-pink-400' : 'bg-purple-100 text-purple-400'
                  )}>
                    IMG
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}