'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Clock,
  Package,
  Plus,
  X,
  Trash2,
  Search,
  AlertTriangle,
  ExternalLink,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatPrice, CATEGORY_LABELS, getStorageUrl } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { GroupBuy, Product } from '@/lib/database.types';

// ============================================================
// Types
// ============================================================

interface GroupBuyFormProps {
  groupBuy?: GroupBuy | null;
  linkedProducts?: Product[];      // 이미 연결된 상품들
  availableProducts?: Product[];   // 연결 가능한 상품들 (unlinked)
}

const STATUS_OPTIONS = [
  { value: 'upcoming', label: '오픈 예정', color: 'bg-blue-100 text-blue-700', icon: '📅' },
  { value: 'active', label: '진행중', color: 'bg-emerald-100 text-emerald-700', icon: '🔥' },
  { value: 'closed', label: '마감', color: 'bg-amber-100 text-amber-700', icon: '🔒' },
  { value: 'completed', label: '완료', color: 'bg-slate-100 text-slate-600', icon: '✅' },
];

// ============================================================
// Helper: datetime-local 변환
// ============================================================

function toLocalDatetime(isoString: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  // datetime-local expects YYYY-MM-DDTHH:mm
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetime(localStr: string): string {
  if (!localStr) return '';
  return new Date(localStr).toISOString();
}

function toLocalDate(isoString: string | null): string {
  if (!isoString) return '';
  return isoString.slice(0, 10);
}

// ============================================================
// Component
// ============================================================

export default function GroupBuyForm({
  groupBuy,
  linkedProducts = [],
  availableProducts = [],
}: GroupBuyFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!groupBuy;

  // ---- Form State ----
  const [title, setTitle] = useState(groupBuy?.title || '');
  const [titleKo, setTitleKo] = useState(groupBuy?.title_ko || '');
  const [description, setDescription] = useState(groupBuy?.description || '');
  const [status, setStatus] = useState(groupBuy?.status || 'upcoming');
  const [openAt, setOpenAt] = useState(toLocalDatetime(groupBuy?.open_at || null));
  const [closeAt, setCloseAt] = useState(toLocalDatetime(groupBuy?.close_at || null));
  const [estimatedArrival, setEstimatedArrival] = useState(
    toLocalDate(groupBuy?.estimated_arrival || null)
  );

  // ---- Product Linking State ----
  const [linked, setLinked] = useState<Product[]>(linkedProducts);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // ---- UI State ----
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ---- Computed: available products minus already linked ----
  const linkedIds = useMemo(() => new Set(linked.map((p) => p.id)), [linked]);
  const pickableProducts = useMemo(() => {
    const unlinked = availableProducts.filter((p) => !linkedIds.has(p.id));
    if (!productSearch) return unlinked;
    const q = productSearch.toLowerCase();
    return unlinked.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.name_ko && p.name_ko.toLowerCase().includes(q)) ||
        p.slug.includes(q)
    );
  }, [availableProducts, linkedIds, productSearch]);

  // ---- Schedule validation ----
  const scheduleWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (openAt && closeAt) {
      const open = new Date(openAt);
      const close = new Date(closeAt);
      if (close <= open) {
        warnings.push('마감 시간이 오픈 시간보다 빨라요');
      }
      const diffHours = (close.getTime() - open.getTime()) / (1000 * 60 * 60);
      if (diffHours < 1) {
        warnings.push('공구 기간이 1시간 미만입니다');
      }
      if (diffHours > 720) {
        warnings.push('공구 기간이 30일을 초과합니다');
      }
    }
    if (status === 'active' && !openAt) {
      warnings.push('진행중 상태인데 오픈 시간이 없습니다');
    }
    return warnings;
  }, [openAt, closeAt, status]);

  // ---- Stats (edit mode) ----
  const totalLinkedSlots = linked.reduce((sum, p) => sum + (p.total_slots || 0), 0);
  const totalLinkedSold = linked.reduce((sum, p) => sum + (p.sold_count || 0), 0);

  // ---- Link / Unlink Product ----
  const linkProduct = (product: Product) => {
    setLinked((prev) => [...prev, product]);
    setShowProductPicker(false);
    setProductSearch('');
  };

  const unlinkProduct = (productId: string) => {
    setLinked((prev) => prev.filter((p) => p.id !== productId));
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!title.trim()) { toast.error('제목을 입력해주세요'); return; }
    if (!openAt) { toast.error('오픈 시간을 설정해주세요'); return; }
    if (!closeAt) { toast.error('마감 시간을 설정해주세요'); return; }

    setSaving(true);

    try {
      const groupBuyData = {
        title: title.trim(),
        title_ko: titleKo.trim() || null,
        description: description.trim() || null,
        status: status as any,
        open_at: fromLocalDatetime(openAt),
        close_at: fromLocalDatetime(closeAt),
        estimated_arrival: estimatedArrival || null,
      };

      let savedId: string;

      if (isEdit && groupBuy) {
        const { error } = await supabase
          .from('group_buys')
          .update(groupBuyData)
          .eq('id', groupBuy.id);

        if (error) throw error;
        savedId = groupBuy.id;
      } else {
        const { data, error } = await supabase
          .from('group_buys')
          .insert(groupBuyData)
          .select('id')
          .single();

        if (error) throw error;
        savedId = data.id;
      }

      // ---- Update product linkages ----
      // 1. Unlink products that were removed
      const currentLinkedIds = new Set(linked.map((p) => p.id));
      const previousLinkedIds = new Set(linkedProducts.map((p) => p.id));

      const toUnlink = linkedProducts.filter((p) => !currentLinkedIds.has(p.id));
      const toLink = linked.filter((p) => !previousLinkedIds.has(p.id));

      // Unlink: set group_buy_id to null
      if (toUnlink.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ group_buy_id: null })
          .in('id', toUnlink.map((p) => p.id));

        if (error) console.error('Unlink error:', error);
      }

      // Link: set group_buy_id
      if (toLink.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ group_buy_id: savedId })
          .in('id', toLink.map((p) => p.id));

        if (error) console.error('Link error:', error);
      }

      toast.success(isEdit ? '공구 일정이 수정되었습니다!' : '공구 일정이 등록되었습니다!');
      router.push('/admin/group-buys');
      router.refresh();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('저장 실패: ' + (err?.message || '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!groupBuy) return;
    setDeleting(true);

    try {
      // Unlink all products first
      if (linked.length > 0) {
        await supabase
          .from('products')
          .update({ group_buy_id: null })
          .eq('group_buy_id', groupBuy.id);
      }

      const { error } = await supabase
        .from('group_buys')
        .delete()
        .eq('id', groupBuy.id);

      if (error) throw error;

      toast.success('공구 일정이 삭제되었습니다');
      router.push('/admin/group-buys');
      router.refresh();
    } catch {
      toast.error('삭제 실패');
    } finally {
      setDeleting(false);
    }
  };

  // ---- Quick status shortcuts ----
  const quickSetDates = (preset: 'today_3d' | 'today_7d' | 'next_week') => {
    const now = new Date();
    let open: Date;
    let close: Date;

    switch (preset) {
      case 'today_3d':
        open = now;
        close = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
      case 'today_7d':
        open = now;
        close = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'next_week':
        // Next Monday 10AM
        open = new Date(now);
        open.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
        open.setHours(10, 0, 0, 0);
        close = new Date(open.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
    }

    setOpenAt(toLocalDatetime(open!.toISOString()));
    setCloseAt(toLocalDatetime(close!.toISOString()));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/group-buys"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? '공구 일정 수정' : '공구 일정 등록'}
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================== */}
        {/* Left Column: Main Content */}
        {/* ============================== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">공구 정보</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    공구 제목 (영문) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="March Round 2"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    공구 제목 (한국어)
                  </label>
                  <input
                    type="text"
                    value={titleKo}
                    onChange={(e) => setTitleKo(e.target.value)}
                    placeholder="3월 2차 공구"
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-base h-20 resize-y"
                  placeholder="이번 공구 특별 안내사항, 배송 일정 등..."
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">일정</h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => quickSetDates('today_3d')}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  오늘~3일
                </button>
                <button
                  type="button"
                  onClick={() => quickSetDates('today_7d')}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  오늘~7일
                </button>
                <button
                  type="button"
                  onClick={() => quickSetDates('next_week')}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  다음주 월요일
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  오픈 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={openAt}
                  onChange={(e) => setOpenAt(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  마감 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={closeAt}
                  onChange={(e) => setCloseAt(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-brand-500" />
                예상 입고일
              </label>
              <input
                type="date"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className="input-base w-auto"
              />
            </div>

            {/* Duration display */}
            {openAt && closeAt && new Date(closeAt) > new Date(openAt) && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
                <span className="font-medium">공구 기간:</span>{' '}
                {(() => {
                  const diff = new Date(closeAt).getTime() - new Date(openAt).getTime();
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  return days > 0 ? `${days}일 ${hours}시간` : `${hours}시간`;
                })()}
              </div>
            )}

            {/* Warnings */}
            {scheduleWarnings.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {scheduleWarnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-amber-600 p-2 rounded-lg bg-amber-50">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Products */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">연결된 상품</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {linked.length}개 상품 · 총 {totalLinkedSlots}슬롯 · {totalLinkedSold}개 판매
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductPicker(true)}
                className="btn-secondary text-sm py-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                상품 연결
              </button>
            </div>

            {/* Linked Products List */}
            {linked.length > 0 ? (
              <div className="space-y-2">
                {linked.map((product) => {
                  const percent = product.total_slots > 0
                    ? Math.round((product.sold_count / product.total_slots) * 100)
                    : 0;

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        {product.thumbnail ? (
                          <img
                            src={getStorageUrl(product.thumbnail, 'products')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                            IMG
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {product.name_ko || product.name}
                          </p>
                          <span className="badge text-[10px] bg-slate-200 text-slate-600">
                            {CATEGORY_LABELS[product.category]}
                          </span>
                          <span className={cn(
                            'badge text-[10px]',
                            product.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          )}>
                            {product.status === 'active' ? '활성' : product.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium text-brand-600">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {product.sold_count}/{product.total_slots}개 ({percent}%)
                          </span>
                          {/* Mini progress bar */}
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                percent >= 80 ? 'bg-red-400' : 'bg-brand-400'
                              )}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-1.5 rounded-md hover:bg-white transition-colors"
                          title="상품 수정"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => unlinkProduct(product.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="연결 해제"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">연결된 상품이 없습니다</p>
                <button
                  type="button"
                  onClick={() => setShowProductPicker(true)}
                  className="mt-2 text-sm text-brand-500 font-medium hover:underline"
                >
                  상품 추가하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================== */}
        {/* Right Column: Sidebar */}
        {/* ============================== */}
        <div className="space-y-6">

          {/* Status */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">상태</h2>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value as any)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                    status === opt.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats (edit mode) */}
          {isEdit && groupBuy && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">통계</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">총 주문</span>
                  <span className="text-sm font-bold text-slate-900">{groupBuy.total_orders}건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">총 매출</span>
                  <span className="text-sm font-bold text-brand-600">{formatPrice(groupBuy.total_revenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">연결 상품</span>
                  <span className="text-sm font-bold">{linked.length}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">전체 판매</span>
                  <span className="text-sm font-bold">{totalLinkedSold}/{totalLinkedSlots}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {isEdit && (
            <div className="card p-6 space-y-3">
              <h2 className="text-lg font-bold text-slate-900 mb-2">빠른 작업</h2>

              {status !== 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus('active');
                    toast.success('상태가 "진행중"으로 변경됩니다. 저장해주세요.');
                  }}
                  className="w-full btn-primary text-sm py-2"
                >
                  🔥 공구 시작하기
                </button>
              )}

              {status === 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus('closed');
                    toast.success('상태가 "마감"으로 변경됩니다. 저장해주세요.');
                  }}
                  className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  🔒 공구 마감하기
                </button>
              )}

              {(status === 'closed' || status === 'active') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus('completed');
                    toast.success('상태가 "완료"로 변경됩니다. 저장해주세요.');
                  }}
                  className="w-full btn-ghost text-sm"
                >
                  ✅ 공구 완료 처리
                </button>
              )}
            </div>
          )}

          {/* Delete */}
          {isEdit && (
            <div className="card p-6 border-red-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-sm text-red-500 font-medium hover:text-red-600 transition-colors py-2"
                >
                  공구 일정 삭제
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium text-center">
                    정말 삭제하시겠습니까?
                    <br />
                    <span className="text-xs text-red-400">
                      연결된 상품 {linked.length}개의 공구 연결도 해제됩니다
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn-ghost flex-1 text-sm"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '삭제 확인'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================== */}
      {/* Product Picker Modal */}
      {/* ============================== */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowProductPicker(false);
              setProductSearch('');
            }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[70vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">상품 연결</h3>
              <button
                onClick={() => {
                  setShowProductPicker(false);
                  setProductSearch('');
                }}
                className="p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="상품명, 슬러그 검색..."
                  className="input-base pl-10 py-2"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {pickableProducts.length > 0 ? (
                <div className="space-y-1.5">
                  {pickableProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => linkProduct(product)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                        {product.thumbnail ? (
                          <img
                            src={getStorageUrl(product.thumbnail, 'products')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {product.name_ko || product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-brand-600 font-medium">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {CATEGORY_LABELS[product.category]}
                          </span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded',
                            product.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          )}>
                            {product.status === 'active' ? '활성' : product.status}
                          </span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {productSearch
                    ? '검색 결과가 없습니다'
                    : '연결 가능한 상품이 없습니다'}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
              프리오더 상품만 표시됩니다 · 이미 다른 공구에 연결된 상품은 제외
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
