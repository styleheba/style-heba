'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { cn, formatPrice, getStorageUrl, SHIPPING } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, getSubtotal } =
    useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const subtotal = getSubtotal();

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, setCartOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-slate-900">장바구니</h2>
            <span className="badge-brand">{items.length}</span>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400 text-sm">장바구니가 비어있습니다</p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-4 text-sm text-brand-500 font-medium hover:underline"
              >
                쇼핑 계속하기
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item, idx) => (
                <div
                  key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`}
                  className="flex gap-3 p-3 rounded-xl bg-slate-50"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    <img
                      src={getStorageUrl(item.product.thumbnail)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                      {item.product.name_ko || item.product.name}
                    </h3>
                    {Object.entries(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {Object.values(item.selectedOptions).join(' / ')}
                      </p>
                    )}
                    <p className="text-sm font-bold text-brand-600 mt-1">
                      {formatPrice(item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.selectedOptions
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.selectedOptions
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.selectedOptions)
                        }
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">소계</span>
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(subtotal)}
              </span>
            </div>

            {subtotal < SHIPPING.FREE_THRESHOLD && (
              <p className="text-xs text-brand-500 mb-3">
                {formatPrice(SHIPPING.FREE_THRESHOLD - subtotal)} 더 담으면 무료배송!
              </p>
            )}

            <Link
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="btn-primary w-full text-center block"
            >
              결제하기
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
