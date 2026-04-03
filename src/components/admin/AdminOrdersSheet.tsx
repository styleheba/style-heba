'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { cn, formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: string;
  payment_method: string;
  payment_confirmed_at: string | null;
  fulfillment_type: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
  items: { product_name: string; quantity: number; product_price: number; selected_options: any }[];
}

const STATUS_FLOW = ['pending', 'paid', 'preparing', 'ready_pickup', 'ready_ship', 'shipped', 'delivered', 'cancelled', 'refunded'];

const PAYMENT_LABELS: Record<string, string> = { zelle: 'Zelle', venmo: 'Venmo' };
const FULFILLMENT_LABELS: Record<string, string> = { pickup: '픽업', shipping: '배송' };

export default function AdminOrdersSheet() {
  const supabase = createClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(product_name, quantity, product_price, selected_options)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      setOrders(data.map((o: any) => ({ ...o, items: o.order_items || [] })));
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
        }),
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success(`상태: ${ORDER_STATUS_LABELS[newStatus]}`);
      } else {
        toast.error('상태 변경 실패');
      }
    } catch {
      toast.error('상태 변경 중 오류');
    }
    setEditingStatus(null);
  };

  const updateAdminNote = async (orderId: string, note: string) => {
    await supabase.from('orders').update({ admin_note: note }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, admin_note: note } : o));
  };

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.items.some(i => i.product_name.toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (paymentFilter) result = result.filter(o => o.payment_method === paymentFilter);
    if (fulfillmentFilter) result = result.filter(o => o.fulfillment_type === fulfillmentFilter);
    if (dateFrom) result = result.filter(o => o.created_at >= dateFrom);
    if (dateTo) result = result.filter(o => o.created_at <= dateTo + 'T23:59:59');
    result.sort((a: any, b: any) => {
      let va = a[sortField]; let vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [orders, search, statusFilter, paymentFilter, fulfillmentFilter, dateFrom, dateTo, sortField, sortDir]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter(o => o.status === 'pending').length;
    const paid = filtered.filter(o => o.status === 'paid').length;
    const revenue = filtered.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').reduce((s, o) => s + o.total, 0);
    return { total, pending, paid, revenue };
  }, [filtered]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const exportCSV = () => {
    const headers = ['주문번호', '날짜', '고객명', '이메일', '전화', '상품', '수량', '상태', '결제', '수령', '소계', '배송비', '할인', '합계'];
    const rows = filtered.map(o => [
      o.order_number, new Date(o.created_at).toLocaleDateString('ko-KR'), o.customer_name, o.customer_email,
      o.customer_phone || '', o.items.map(i => i.product_name).join(' / '), o.items.reduce((s, i) => s + i.quantity, 0),
      ORDER_STATUS_LABELS[o.status] || o.status, PAYMENT_LABELS[o.payment_method] || o.payment_method,
      FULFILLMENT_LABELS[o.fulfillment_type] || o.fulfillment_type, o.subtotal, o.shipping_fee, o.discount_amount, o.total,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV 다운로드 완료');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">주문 관리</h1>
        <button onClick={exportCSV} className="btn-ghost text-sm"><Download className="w-4 h-4 mr-1" /> CSV 다운로드</button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card p-3 text-center"><p className="text-xs text-slate-400">전체</p><p className="text-xl font-bold text-slate-900">{stats.total}</p></div>
        <div className="card p-3 text-center"><p className="text-xs text-slate-400">입금대기</p><p className="text-xl font-bold text-amber-600">{stats.pending}</p></div>
        <div className="card p-3 text-center"><p className="text-xs text-slate-400">입금확인</p><p className="text-xl font-bold text-blue-600">{stats.paid}</p></div>
        <div className="card p-3 text-center"><p className="text-xs text-slate-400">매출</p><p className="text-xl font-bold text-brand-600">{formatPrice(stats.revenue)}</p></div>
      </div>

      <div className="card p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="주문번호, 고객명, 상품명..." className="input-base pl-10 py-1.5 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base py-1.5 text-sm w-auto">
            <option value="">전체 상태</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input-base py-1.5 text-sm w-auto">
            <option value="">전체 결제</option><option value="zelle">Zelle</option><option value="venmo">Venmo</option>
          </select>
          <select value={fulfillmentFilter} onChange={(e) => setFulfillmentFilter(e.target.value)} className="input-base py-1.5 text-sm w-auto">
            <option value="">전체 수령</option><option value="pickup">픽업</option><option value="shipping">배송</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-base py-1.5 text-sm w-auto" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-base py-1.5 text-sm w-auto" />
          {(search || statusFilter || paymentFilter || fulfillmentFilter || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); setFulfillmentFilter(''); setDateFrom(''); setDateTo(''); }} className="text-xs text-brand-500 hover:underline">초기화</button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('order_number')}><span className="flex items-center gap-1">주문번호 <SortIcon field="order_number" /></span></th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('created_at')}><span className="flex items-center gap-1">날짜 <SortIcon field="created_at" /></span></th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('customer_name')}><span className="flex items-center gap-1">고객 <SortIcon field="customer_name" /></span></th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">상품</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-slate-500">수령</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-slate-500">결제</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('status')}><span className="flex items-center justify-center gap-1">상태 <SortIcon field="status" /></span></th>
                <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('total')}><span className="flex items-center justify-end gap-1">합계 <SortIcon field="total" /></span></th>
                <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">로딩중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">{search ? '검색 결과 없음' : '주문이 없습니다'}</td></tr>
              ) : filtered.map((order) => (
                <>
                  <tr key={order.id} className={cn('border-b border-slate-50 hover:bg-slate-25 transition-colors cursor-pointer', expandedId === order.id && 'bg-brand-50/30')} onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                    <td className="px-3 py-2"><span className="text-xs font-mono font-medium text-brand-600">{order.order_number}</span></td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      <span className="text-slate-300 ml-1">{new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-3 py-2"><p className="text-xs font-medium text-slate-800 truncate max-w-[100px]">{order.customer_name}</p></td>
                    <td className="px-3 py-2"><p className="text-xs text-slate-600 truncate max-w-[160px]">{order.items.map(i => `${i.product_name}×${i.quantity}`).join(', ')}</p></td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', order.fulfillment_type === 'pickup' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600')}>
                        {FULFILLMENT_LABELS[order.fulfillment_type]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center"><span className="text-[10px] font-medium text-slate-500">{PAYMENT_LABELS[order.payment_method]}</span></td>
                    <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      {editingStatus === order.id ? (
                        <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} onBlur={() => setEditingStatus(null)} autoFocus className="input-base py-0.5 text-[11px] w-auto">
                          {STATUS_FLOW.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditingStatus(order.id)} className={cn('badge text-[10px] cursor-pointer hover:ring-2 hover:ring-brand-200 transition-all', ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600')}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right"><span className="text-xs font-bold text-slate-800">{formatPrice(order.total)}</span></td>
                    <td className="px-3 py-2 text-center"><Eye className={cn('w-3.5 h-3.5 transition-colors', expandedId === order.id ? 'text-brand-500' : 'text-slate-300')} /></td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`} className="bg-slate-50/50">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">고객 정보</p>
                            <p className="text-slate-600">{order.customer_name}</p>
                            <p className="text-slate-500">{order.customer_email}</p>
                            {order.customer_phone && <p className="text-slate-500">{order.customer_phone}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">주문 상품</p>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-slate-600">{item.product_name}{item.selected_options && Object.keys(item.selected_options).length > 0 && <span className="text-slate-400 ml-1">({Object.values(item.selected_options).join('/')})</span>}</span>
                                <span className="text-slate-500">{item.quantity}개 · {formatPrice(item.product_price * item.quantity)}</span>
                              </div>
                            ))}
                            <div className="pt-1 border-t border-slate-200 space-y-0.5">
                              <div className="flex justify-between"><span className="text-slate-400">소계</span><span>{formatPrice(order.subtotal)}</span></div>
                              {order.shipping_fee > 0 && <div className="flex justify-between"><span className="text-slate-400">배송비</span><span>{formatPrice(order.shipping_fee)}</span></div>}
                              {order.discount_amount > 0 && <div className="flex justify-between"><span className="text-brand-500">할인</span><span className="text-brand-500">-{formatPrice(order.discount_amount)}</span></div>}
                              <div className="flex justify-between font-bold"><span>합계</span><span className="text-brand-600">{formatPrice(order.total)}</span></div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">메모</p>
                            {order.customer_note && <div className="p-2 rounded bg-amber-50 text-amber-700 text-[11px]">고객: {order.customer_note}</div>}
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">관리자 메모</label>
                              <textarea defaultValue={order.admin_note || ''} onBlur={(e) => updateAdminNote(order.id, e.target.value)} placeholder="내부 메모 입력..." className="input-base py-1.5 text-xs h-16 resize-none" onClick={(e) => e.stopPropagation()} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
          <span>{filtered.length}건 표시</span>
          <span>상태 뱃지 클릭으로 변경 · 행 클릭으로 상세보기</span>
        </div>
      </div>
    </div>
  );
}
