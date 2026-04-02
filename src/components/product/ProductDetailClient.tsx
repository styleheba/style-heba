'use client';

import { useState } from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCartStore } from '@/lib/store/cart';
import {
  cn, formatPrice, getStorageUrl,
  getSlotPercentage, getTimeRemaining, CATEGORY_LABELS,
} from '@/lib/utils';
import type { Product, GroupBuy } from '@/lib/database.types';

// ── 옵션 타입 (ProductOptions.tsx와 동일) ──────────────────
interface ColorOption   { name: string; code: string; }
interface PackageOption { label: string; price: string; originalPrice: string; }
interface SizeOption    { value: string; }

interface DetailTabs {
  colors?: ColorOption[];
  packages?: PackageOption[];
  sizes?: SizeOption[];
  sizeType?: string;
  [key: string]: any;
}

interface ProductWithGroupBuy extends Product {
  group_buys?: GroupBuy | null;
}

interface Props {
  product: ProductWithGroupBuy;
}

export default function ProductDetailClient({ product }: Props) {
  const [selectedImage, setSelectedImage]   = useState(0);
  const [quantity, setQuantity]             = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab]           = useState('description');
  const addItem    = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const images       = product.images?.length ? product.images : [product.thumbnail];
  const slotsPercent = getSlotPercentage(product.sold_count, product.total_slots);
  const remainingSlots = product.total_slots - product.sold_count;
  const groupBuy     = product.group_buys;
  const detailTabs   = (product.detail_tabs || {}) as DetailTabs;

  // ── 옵션 파싱 ──────────────────────────────────────────
  const colors: ColorOption[]     = Array.isArray(detailTabs.colors)   ? detailTabs.colors   : [];
  const packages: PackageOption[] = Array.isArray(detailTabs.packages) ? detailTabs.packages : [];
  const sizes: SizeOption[]       = Array.isArray(detailTabs.sizes)    ? detailTabs.sizes    : [];

  // 선택된 패키지의 가격 (없으면 기본 상품가)
  const selectedPkg = packages.find((p) => p.label === selectedOptions.package);
  const effectivePrice = selectedPkg ? parseFloat(selectedPkg.price) || product.price : product.price;
  const effectiveOriginal = selectedPkg
    ? parseFloat(selectedPkg.originalPrice) || product.original_price
    : product.original_price;

  // ── 유효성 검사 ──────────────────────────────────────
  const handleAddToCart = () => {
    if (colors.length > 0 && !selectedOptions.color) {
      toast.error('컬러를 선택해주세요'); return;
    }
    if (sizes.length > 0 && !selectedOptions.size) {
      toast.error('사이즈를 선택해주세요'); return;
    }
    // 패키지가 있으면 선택 필수
    if (packages.length > 0 && !selectedOptions.package) {
      toast.error('옵션을 선택해주세요'); return;
    }

    addItem({
      product: {
        id: product.id,
        name: product.name,
        name_ko: product.name_ko,
        price: effectivePrice,
        original_price: effectiveOriginal,
        thumbnail: product.thumbnail,
        product_type: product.product_type,
      },
      quantity,
      selectedOptions,
    });

    toast.success('장바구니에 추가했습니다!');
    setCartOpen(true);
  };

  // 상세정보 탭에 보여줄 key (옵션 관련 키 제외)
  const excludedKeys = ['colors', 'packages', 'sizes', 'sizeType'];
  const detailEntries = Object.entries(detailTabs).filter(([k]) => !excludedKeys.includes(k));

  return (
    <div className="container-app py-6">
      {/* Back */}
      <Link
        href={product.product_type === 'preorder' ? '/preorder' : '/shop'}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        뒤로가기
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* ── 이미지 갤러리 ── */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={getStorageUrl(images[selectedImage])}
              alt={product.name_ko || product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                    idx === selectedImage ? 'border-brand-500' : 'border-transparent'
                  )}
                >
                  <img src={getStorageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 상품 정보 ── */}
        <div>
          {/* 카테고리 & 타입 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-brand">{CATEGORY_LABELS[product.category]}</span>
            {product.product_type === 'preorder' && (
              <span className="badge bg-brand-500 text-white">공구</span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {product.name_ko || product.name}
          </h1>

          {/* 가격 */}
          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-bold text-brand-600">
              {formatPrice(effectivePrice)}
            </span>
            {effectiveOriginal && effectiveOriginal > effectivePrice && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatPrice(effectiveOriginal)}
                </span>
                <span className="badge bg-red-100 text-red-600">
                  {Math.round(((effectiveOriginal - effectivePrice) / effectiveOriginal) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* 공구 정보 */}
          {groupBuy && (
            <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100">
              <p className="text-sm font-semibold text-brand-700">
                {groupBuy.title_ko || groupBuy.title}
              </p>
              <p className="text-xs text-brand-500 mt-1">
                {groupBuy.status === 'active'
                  ? `마감까지 ${getTimeRemaining(groupBuy.close_at)}`
                  : `오픈: ${new Date(groupBuy.open_at).toLocaleDateString('ko-KR')}`}
              </p>
            </div>
          )}

          {/* 슬롯 진행률 */}
          {product.product_type === 'preorder' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500">{product.sold_count}개 구매 ({slotsPercent}%)</span>
                <span className="text-slate-400 font-medium">{remainingSlots}개 남음</span>
              </div>
              <div className="progress-bar h-3">
                <div
                  className={cn('progress-bar-fill', slotsPercent >= 80 && 'from-amber-400 to-red-500')}
                  style={{ width: `${Math.min(slotsPercent, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* ── 컬러 옵션 ── */}
          {colors.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                컬러
                {selectedOptions.color && (
                  <span className="text-brand-500 font-normal">— {selectedOptions.color}</span>
                )}
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, color: color.name }))}
                    title={color.name}
                    className={cn(
                      'w-9 h-9 rounded-full border-2 transition-all relative',
                      selectedOptions.color === color.name
                        ? 'border-brand-500 scale-110 shadow-md'
                        : 'border-slate-200 hover:border-slate-400'
                    )}
                    style={{ backgroundColor: color.code }}
                  >
                    {/* 흰색 계열은 구분선 */}
                    {color.code === '#FFFFFF' || color.code === '#FFFFF0' || color.code === '#FFFDD0' ? (
                      <span className="absolute inset-0 rounded-full border border-slate-200" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 사이즈 옵션 ── */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">사이즈</label>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, size: size.value }))}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                      selectedOptions.size === size.value
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {size.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 패키지 옵션 ── */}
          {packages.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">옵션 선택</label>
              <div className="space-y-2">
                {/* 기본 단품 */}
                <button
                  onClick={() => setSelectedOptions((prev) => {
                    const next = { ...prev };
                    delete next.package;
                    return next;
                  })}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all',
                    !selectedOptions.package
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <span className="font-medium text-slate-700">단품</span>
                  <span className="font-bold text-slate-900">{formatPrice(product.price)}</span>
                </button>

                {packages.map((pkg) => {
                  const pkgPrice = parseFloat(pkg.price) || 0;
                  const pkgOriginal = parseFloat(pkg.originalPrice) || 0;
                  const discount = pkgOriginal > pkgPrice
                    ? Math.round(((pkgOriginal - pkgPrice) / pkgOriginal) * 100)
                    : 0;
                  const isSelected = selectedOptions.package === pkg.label;

                  return (
                    <button
                      key={pkg.label}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, package: pkg.label }))}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all',
                        isSelected
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{pkg.label}</span>
                        {discount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md font-bold">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatPrice(pkgPrice)}</span>
                        {pkgOriginal > pkgPrice && (
                          <span className="text-xs text-slate-400 line-through ml-2">
                            {formatPrice(pkgOriginal)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 수량 & 장바구니 ── */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.status === 'soldout' || remainingSlots <= 0}
              className="btn-primary flex-1"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {product.status === 'soldout' || remainingSlots <= 0
                ? '품절'
                : `장바구니 담기 · ${formatPrice(effectivePrice * quantity)}`}
            </button>
          </div>

          {/* 배송 안내 */}
          <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs text-slate-500 space-y-1">
            <p>📦 $150 이상 무료배송 / 미만 $10</p>
            <p>📍 Atlanta, GA 픽업 가능</p>
            <p>💳 Zelle / Venmo 결제</p>
          </div>

          {/* ── 설명 탭 ── */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex gap-1 border-b border-slate-100">
              <button
                onClick={() => setActiveTab('description')}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === 'description'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                )}
              >
                상품설명
              </button>
              {detailEntries.length > 0 && (
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeTab === 'details'
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  )}
                >
                  상세정보
                </button>
              )}
            </div>

            <div className="py-4 text-sm text-slate-600 leading-relaxed">
              {activeTab === 'description' && (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: product.description_ko || product.description || '상품 설명이 없습니다.',
                  }}
                />
              )}
              {activeTab === 'details' && (
                <div className="space-y-3">
                  {detailEntries.map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="w-24 flex-shrink-0 font-medium text-slate-700 capitalize">{key}</span>
                      <span className="text-slate-500">{value as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
