import { createServerSupabase } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createServerSupabase();

  // Stats
  const [ordersRes, productsRes, customersRes, pendingRes, revenueRes] =
    await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('total').eq('status', 'paid'),
    ]);

  const totalRevenue = (revenueRes.data || []).reduce(
    (sum: number, o: any) => sum + (o.total || 0),
    0
  );

  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, status, total, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const stats = [
    {
      label: '총 주문',
      value: ordersRes.count || 0,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: '총 매출',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: '입금대기',
      value: pendingRes.count || 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: '구독자',
      value: customersRes.count || 0,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: '활성 상품',
      value: productsRes.count || 0,
      icon: Package,
      color: 'bg-brand-50 text-brand-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">대시보드</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">최근 주문</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-brand-500 font-medium hover:underline"
          >
            전체보기 →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">주문번호</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">고객</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">상태</th>
                <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">금액</th>
                <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">일시</th>
              </tr>
            </thead>
            <tbody>
              {((recentOrders || []) as any[]).map((order: any) => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-25">
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm text-slate-800">{order.customer_name}</p>
                    <p className="text-xs text-slate-400">{order.customer_email}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`badge ${
                      {
                        pending: 'bg-yellow-100 text-yellow-800',
                        paid: 'bg-blue-100 text-blue-800',
                        preparing: 'bg-indigo-100 text-indigo-800',
                        ready_pickup: 'bg-emerald-100 text-emerald-800',
                        shipped: 'bg-purple-100 text-purple-800',
                        delivered: 'bg-green-100 text-green-800',
                        cancelled: 'bg-red-100 text-red-800',
                      }[order.status as string] || 'bg-slate-100 text-slate-600'
                    }`}>
                      {{
                        pending: '입금대기',
                        paid: '입금확인',
                        preparing: '준비중',
                        ready_pickup: '픽업준비',
                        shipped: '배송중',
                        delivered: '완료',
                        cancelled: '취소',
                      }[order.status as string] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!recentOrders || recentOrders.length === 0) && (
            <div className="text-center py-8 text-slate-400 text-sm">
              주문이 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
