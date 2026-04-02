import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Calendar, Clock, Package, ArrowRight, DollarSign } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '공구 일정' };

export default async function AdminGroupBuysPage() {
  const supabase = createServerSupabase();

  // Fetch group buys with linked product count
  const { data: groupBuys } = await supabase
    .from('group_buys')
    .select('*')
    .order('open_at', { ascending: false });

  // Fetch product counts per group buy
  const { data: productCounts } = await supabase
    .from('products')
    .select('group_buy_id, id, sold_count, total_slots')
    .not('group_buy_id', 'is', null);

  // Aggregate product stats per group buy
  const gbStats = new Map<string, { count: number; sold: number; slots: number }>();
  (productCounts || []).forEach((p: any) => {
    const existing = gbStats.get(p.group_buy_id) || { count: 0, sold: 0, slots: 0 };
    existing.count += 1;
    existing.sold += p.sold_count || 0;
    existing.slots += p.total_slots || 0;
    gbStats.set(p.group_buy_id, existing);
  });

  const statusLabel: Record<string, string> = {
    upcoming: '오픈 예정',
    active: '진행중',
    closed: '마감',
    completed: '완료',
  };

  const statusColor: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    active: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
  };

  const statusIcon: Record<string, string> = {
    upcoming: '📅',
    active: '🔥',
    closed: '🔒',
    completed: '✅',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">공구 일정 관리</h1>
        <Link href="/admin/group-buys/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          공구 추가
        </Link>
      </div>

      {/* Active / Upcoming first */}
      <div className="grid gap-4">
        {(groupBuys || []).map((gb: any) => {
          const stats = gbStats.get(gb.id) || { count: 0, sold: 0, slots: 0 };
          const percent = stats.slots > 0 ? Math.round((stats.sold / stats.slots) * 100) : 0;
          const isLive = gb.status === 'active';
          const isPast = gb.status === 'completed' || gb.status === 'closed';

          return (
            <Link
              key={gb.id}
              href={`/admin/group-buys/${gb.id}`}
              className={cn(
                'card p-5 hover:shadow-md transition-all group',
                isLive && 'ring-2 ring-emerald-200'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{statusIcon[gb.status]}</span>
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {gb.title_ko || gb.title}
                    </h3>
                    <span className={`badge text-[11px] ${statusColor[gb.status]}`}>
                      {statusLabel[gb.status]}
                    </span>
                  </div>
                  {gb.description && (
                    <p className="text-sm text-slate-500 truncate">{gb.description}</p>
                  )}

                  {/* Schedule */}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      오픈: {new Date(gb.open_at).toLocaleString('ko-KR', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      마감: {new Date(gb.close_at).toLocaleString('ko-KR', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {gb.estimated_arrival && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        입고: {gb.estimated_arrival}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right stats */}
                <div className="flex-shrink-0 text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <DollarSign className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-sm font-bold text-brand-600">
                      {formatPrice(gb.total_revenue)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{gb.total_orders}건 주문</p>
                  <div className="flex items-center gap-1.5 justify-end mt-2">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      상품 {stats.count}개
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar (if has products) */}
              {stats.slots > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>전체 판매 진행률</span>
                    <span className="font-medium">{stats.sold}/{stats.slots} ({percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        percent >= 80
                          ? 'bg-gradient-to-r from-amber-400 to-red-500'
                          : 'bg-gradient-to-r from-brand-400 to-brand-500'
                      )}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Edit arrow hint */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>
          );
        })}

        {(!groupBuys || groupBuys.length === 0) && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">등록된 공구 일정이 없습니다</p>
            <Link
              href="/admin/group-buys/new"
              className="mt-3 inline-flex text-sm text-brand-500 font-medium hover:underline"
            >
              첫 공구 만들기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
