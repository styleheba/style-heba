'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, MoreHorizontal, ChevronDown } from 'lucide-react';
import { cn, formatPrice, CATEGORY_LABELS, getStorageUrl } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Product } from '@/lib/database.types';

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'active', label: '활성', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'draft', label: '초안', color: 'bg-slate-100 text-slate-600' },
  { value: 'soldout', label: '품절', color: 'bg-red-100 text-red-700' },
  { value: 'archived', label: '보관', color: 'bg-gray-100 text-gray-600' },
];

const TYPE_OPTIONS = [
  { value: '', label: '전체 타입' },
  { value: 'preorder', label: '프리오더 공구' },
  { value: 'instock', label: '바로구매' },
];

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, typeFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);
    if (typeFilter) query = query.eq('product_type', typeFilter);

    const { data, error } = await query;
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  // Filter by search (client-side)
  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.name_ko && p.name_ko.toLowerCase().includes(q)) ||
      p.slug.includes(q)
    );
  });

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  // Bulk status update
  const bulkUpdateStatus = async (newStatus: string) => {
    if (selected.size === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus as any })
        .in('id', Array.from(selected));

      if (error) throw error;

      toast.success(`${selected.size}개 상품 상태 변경 완료`);
      setSelected(new Set());
      setBulkMenuOpen(false);
      fetchProducts();
    } catch {
      toast.error('상태 변경 실패');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">상품 관리</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          상품 추가
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명, 슬러그 검색..."
              className="input-base pl-10 py-2"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base py-2 w-auto"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-base py-2 w-auto"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <span className="text-sm text-slate-400">
            {filtered.length}개 상품
          </span>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between animate-slide-up">
          <span className="text-sm font-medium text-brand-700">
            {selected.size}개 선택됨
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                className="btn-ghost text-sm text-brand-700"
              >
                상태 일괄 변경
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </button>
              {bulkMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    {STATUS_OPTIONS.filter((s) => s.value).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => bulkUpdateStatus(opt.value)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSelected(new Set())}
              className="btn-ghost text-sm text-slate-500"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-400"
                  />
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">상품</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">카테고리</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">타입</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">가격</th>
                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3 hidden lg:table-cell">판매</th>
                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    로딩중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {search ? '검색 결과가 없습니다' : '등록된 상품이 없습니다'}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={cn(
                      'border-b border-slate-50 transition-colors',
                      selected.has(product.id) ? 'bg-brand-50/50' : 'hover:bg-slate-25'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {product.thumbnail ? (
                            <img
                              src={getStorageUrl(product.thumbnail, 'products')}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 group-hover:text-brand-600 truncate max-w-[200px]">
                            {product.name_ko || product.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            /{product.product_type === 'preorder' ? 'preorder' : 'shop'}/{product.slug}
                          </p>
                        </div>
                        {product.is_featured && (
                          <span className="text-amber-500 text-xs flex-shrink-0">⭐</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                      {CATEGORY_LABELS[product.category]}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={cn(
                          'badge text-[11px]',
                          product.product_type === 'preorder'
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {product.product_type === 'preorder' ? '공구' : '바로구매'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                      {product.original_price && product.original_price > product.price && (
                        <p className="text-xs text-slate-400 line-through">
                          {formatPrice(product.original_price)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-500 hidden lg:table-cell">
                      <span className="font-medium">{product.sold_count}</span>
                      <span className="text-slate-300">/{product.total_slots}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'badge text-[11px]',
                          {
                            active: 'bg-emerald-100 text-emerald-700',
                            draft: 'bg-slate-100 text-slate-600',
                            soldout: 'bg-red-100 text-red-700',
                            archived: 'bg-gray-100 text-gray-600',
                          }[product.status]
                        )}
                      >
                        {
                          {
                            active: '활성',
                            draft: '초안',
                            soldout: '품절',
                            archived: '보관',
                          }[product.status]
                        }
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
