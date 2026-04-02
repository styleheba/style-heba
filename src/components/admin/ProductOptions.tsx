'use client';

import { useState } from 'react';
import { Plus, X, Palette, Package, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface ColorOption {
  name: string;
  code: string;
}

export interface PackageOption {
  label: string;
  price: string;
  originalPrice: string;
}

export interface SizeOption {
  value: string;
}

export interface ProductOptionsData {
  colors: ColorOption[];
  packages: PackageOption[];
  sizes: SizeOption[];
  sizeType: 'letter' | 'number' | 'custom';
}

interface ProductOptionsProps {
  data: ProductOptionsData;
  onChange: (data: ProductOptionsData) => void;
  category: string;
}

// ============================================================
// Preset Data
// ============================================================

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const NUMBER_SIZES = ['44', '55', '66', '77', '88', '90', '95', '100', '105', '110'];
const COMMON_COLORS = [
  { name: '블랙', code: '#000000' },
  { name: '화이트', code: '#FFFFFF' },
  { name: '네이비', code: '#1E3A5F' },
  { name: '베이지', code: '#D4B896' },
  { name: '그레이', code: '#808080' },
  { name: '브라운', code: '#6B4226' },
  { name: '핑크', code: '#F4A7B9' },
  { name: '레드', code: '#D32F2F' },
  { name: '블루', code: '#1976D2' },
  { name: '그린', code: '#388E3C' },
  { name: '퍼플', code: '#7B1FA2' },
  { name: '아이보리', code: '#FFFFF0' },
  { name: '카키', code: '#8B7355' },
  { name: '와인', code: '#722F37' },
  { name: '크림', code: '#FFFDD0' },
  { name: '민트', code: '#98FF98' },
];

// ============================================================
// Component
// ============================================================

export default function ProductOptions({ data, onChange, category }: ProductOptionsProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCode, setCustomColorCode] = useState('#000000');

  const isFashion = category === 'fashion' || category === 'kids';

  // ---- Color Options ----
  const addColor = (color: ColorOption) => {
    if (data.colors.find((c) => c.name === color.name)) return;
    onChange({ ...data, colors: [...data.colors, color] });
  };

  const removeColor = (idx: number) => {
    onChange({ ...data, colors: data.colors.filter((_, i) => i !== idx) });
  };

  const addCustomColor = () => {
    if (!customColorName.trim()) return;
    addColor({ name: customColorName.trim(), code: customColorCode });
    setCustomColorName('');
    setCustomColorCode('#000000');
  };

  // ---- Package Options ----
  const addPackage = () => {
    onChange({
      ...data,
      packages: [...data.packages, { label: '', price: '', originalPrice: '' }],
    });
  };

  const updatePackage = (idx: number, field: string, value: string) => {
    onChange({
      ...data,
      packages: data.packages.map((pkg, i) =>
        i === idx ? { ...pkg, [field]: value } : pkg
      ),
    });
  };

  const removePackage = (idx: number) => {
    onChange({ ...data, packages: data.packages.filter((_, i) => i !== idx) });
  };

  // ---- Size Options ----
  const toggleSize = (value: string) => {
    const exists = data.sizes.find((s) => s.value === value);
    if (exists) {
      onChange({ ...data, sizes: data.sizes.filter((s) => s.value !== value) });
    } else {
      onChange({ ...data, sizes: [...data.sizes, { value }] });
    }
  };

  const addCustomSize = (value: string) => {
    if (!value.trim() || data.sizes.find((s) => s.value === value.trim())) return;
    onChange({ ...data, sizes: [...data.sizes, { value: value.trim() }] });
  };

  const removeSize = (idx: number) => {
    onChange({ ...data, sizes: data.sizes.filter((_, i) => i !== idx) });
  };

  const setSizeType = (type: 'letter' | 'number' | 'custom') => {
    onChange({ ...data, sizeType: type, sizes: [] });
  };

  const [customSizeInput, setCustomSizeInput] = useState('');

  return (
    <div className="space-y-6">

      {/* ====== Color Options ====== */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900">컬러 옵션</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="text-xs text-brand-500 font-medium hover:underline"
          >
            {showColorPicker ? '닫기' : '+ 컬러 추가'}
          </button>
        </div>

        {/* Selected Colors */}
        {data.colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.colors.map((color, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div
                  className="w-4 h-4 rounded-full border border-slate-300"
                  style={{ backgroundColor: color.code }}
                />
                <span className="text-xs font-medium text-slate-700">{color.name}</span>
                <button
                  type="button"
                  onClick={() => removeColor(idx)}
                  className="text-slate-400 hover:text-red-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Color Picker */}
        {showColorPicker && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">자주 쓰는 컬러</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_COLORS.map((color) => {
                const isSelected = data.colors.find((c) => c.name === color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => isSelected ? null : addColor(color)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all',
                      isSelected
                        ? 'bg-brand-100 text-brand-600 font-semibold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: color.code }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 items-end pt-2 border-t border-slate-200">
              <div className="flex-1">
                <label className="text-[11px] text-slate-500 mb-1 block">직접 입력</label>
                <input
                  type="text"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder="컬러명"
                  className="input-base py-1.5 text-xs"
                />
              </div>
              <div className="w-16">
                <label className="text-[11px] text-slate-500 mb-1 block">색상</label>
                <input
                  type="color"
                  value={customColorCode}
                  onChange={(e) => setCustomColorCode(e.target.value)}
                  className="w-full h-[34px] rounded-lg cursor-pointer border border-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={addCustomColor}
                className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {data.colors.length === 0 && !showColorPicker && (
          <p className="text-xs text-slate-400">컬러 옵션이 없습니다</p>
        )}
      </div>

      {/* ====== Package Options (1+1 etc) ====== */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900">패키지 옵션</h3>
            <span className="text-[10px] text-slate-400">1+1, 세트 등</span>
          </div>
          <button
            type="button"
            onClick={addPackage}
            className="text-xs text-brand-500 font-medium hover:underline"
          >
            + 옵션 추가
          </button>
        </div>

        {data.packages.length > 0 ? (
          <div className="space-y-2">
            {data.packages.map((pkg, idx) => (
              <div key={idx} className="flex gap-2 items-start p-2.5 rounded-lg bg-slate-50">
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={pkg.label}
                    onChange={(e) => updatePackage(idx, 'label', e.target.value)}
                    placeholder="옵션명 (예: 1+1, 2개 세트, 3+1)"
                    className="input-base py-1.5 text-xs"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={pkg.price}
                        onChange={(e) => updatePackage(idx, 'price', e.target.value)}
                        placeholder="판매가 ($)"
                        className="input-base py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={pkg.originalPrice}
                        onChange={(e) => updatePackage(idx, 'originalPrice', e.target.value)}
                        placeholder="정가 ($)"
                        className="input-base py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePackage(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">패키지 옵션이 없습니다</p>
        )}
      </div>

      {/* ====== Size Options ====== */}
      {isFashion && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900">사이즈 옵션</h3>
          </div>

          {/* Size Type Selector */}
          <div className="flex gap-2 mb-3">
            {[
              { value: 'letter', label: '영문 (S~XL)' },
              { value: 'number', label: '숫자 (44~110)' },
              { value: 'custom', label: '직접 입력' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSizeType(type.value as any)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  data.sizeType === type.value
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Letter Sizes */}
          {data.sizeType === 'letter' && (
            <div className="flex flex-wrap gap-2">
              {LETTER_SIZES.map((size) => {
                const isSelected = data.sizes.find((s) => s.value === size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={cn(
                      'w-12 h-10 rounded-lg text-xs font-semibold border-2 transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}

          {/* Number Sizes */}
          {data.sizeType === 'number' && (
            <div className="flex flex-wrap gap-2">
              {NUMBER_SIZES.map((size) => {
                const isSelected = data.sizes.find((s) => s.value === size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={cn(
                      'w-12 h-10 rounded-lg text-xs font-semibold border-2 transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom Sizes */}
          {data.sizeType === 'custom' && (
            <div className="space-y-2">
              {data.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.sizes.map((size, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200"
                    >
                      <span className="text-xs font-semibold text-brand-600">{size.value}</span>
                      <button
                        type="button"
                        onClick={() => removeSize(idx)}
                        className="text-brand-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSize(customSizeInput);
                      setCustomSizeInput('');
                    }
                  }}
                  placeholder="사이즈 입력 후 Enter"
                  className="input-base py-1.5 text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    addCustomSize(customSizeInput);
                    setCustomSizeInput('');
                  }}
                  className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* Selected sizes summary */}
          {data.sizes.length > 0 && (
            <p className="text-[11px] text-slate-400 mt-2">
              선택됨: {data.sizes.map((s) => s.value).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
