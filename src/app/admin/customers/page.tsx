import { createServerSupabase } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '고객 관리' };

export default async function AdminCustomersPage() {
  const supabase = createServerSupabase();

  // Subscribers + their order stats
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
    .limit(200);

  // Get order stats per email
  const { data: orderStats } = await supabase
    .from('orders')
    .select('customer_email, total, status');

  // Aggregate
  const statsMap = new Map<string, { count: number; total: number }>();
  (orderStats || []).forEach((o: any) => {
    const existing = statsMap.get(o.customer_email) || { count: 0, total: 0 };
    existing.count += 1;
    if (o.status !== 'cancelled' && o.status !== 'refunded') {
      existing.total += o.total || 0;
    }
    statsMap.set(o.customer_email, existing);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">고객 관리</h1>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">이메일</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">이름</th>
                <th className="text-center text-xs font-medium text-slate-500 px-6 py-3">주문 수</th>
                <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">총 구매</th>
                <th className="text-center text-xs font-medium text-slate-500 px-6 py-3">상태</th>
                <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">가입일</th>
              </tr>
            </thead>
            <tbody>
              {(subscribers || []).map((sub) => {
                const stats = statsMap.get(sub.email) || { count: 0, total: 0 };
                return (
                  <tr key={sub.id} className="border-b border-slate-50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{sub.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{sub.name || '-'}</td>
                    <td className="px-6 py-3 text-center text-sm">{stats.count}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium">
                      {stats.total > 0 ? formatPrice(stats.total) : '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`badge ${sub.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {sub.is_active ? '구독중' : '해지'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-slate-400">
                      {new Date(sub.subscribed_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!subscribers || subscribers.length === 0) && (
            <div className="text-center py-12 text-slate-400">고객이 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}
