'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Users, Crown, Star, Heart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Customer {
  email: string;
  name: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  tier: string;
  tierColor: string;
  tierBg: string;
  tierIcon: 'crown' | 'star' | 'heart' | 'user';
}

const TIERS = [
  { name: 'VVIP', min: 1000, color: 'text-amber-700', bg: 'bg-amber-100', icon: 'crown' as const },
  { name: 'VIP', min: 500, color: 'text-purple-700', bg: 'bg-purple-100', icon: 'star' as const },
  { name: 'Gold', min: 250, color: 'text-blue-700', bg: 'bg-blue-100', icon: 'heart' as const },
  { name: 'Member', min: 0, color: 'text-slate-600', bg: 'bg-slate-100', icon: 'user' as const },
];

function getTier(totalSpent: number) {
  for (const tier of TIERS) {
    if (totalSpent >= tier.min) return tier;
  }
  return TIERS[TIERS.length - 1];
}

const TierIcon = ({ icon, className }: { icon: string; className?: string }) => {
  switch (icon) {
    case 'crown': return <Crown className={className} />;
    case 'star': return <Star className={className} />;
    case 'heart': return <Heart className={className} />;
    default: return <Users className={className} />;
  }
};

export default function AdminCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: orders, error } = await supabase
      .from('orders')
      .select('customer_email, customer_name, customer_phone, total, status, created_at')
      .not('status', 'in', '("cancelled","refunded")')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('고객 데이터 로딩 실패');
      setLoading(false);
      return;
    }

    const customerMap = new Map<string, {
      email: string; name: string; phone: string | null;
      orderCount: number; totalSpent: number; lastOrderDate: string;
    }>();

    (orders || []).forEach((o: any) => {
      const existing = customerMap.get(o.customer_email);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += o.total || 0;
        if (o.created_at > existing.lastOrderDate) {
          existing.lastOrderDate = o.created_at;
          existing.name = o.customer_name || existing.name;
          existing.phone = o.customer_phone || existing.phone;
        }
      } else {
        customerMap.set(o.customer_email, {
          email: o.customer_email,
          name: o.customer_name || '',
          phone: o.customer_phone,
          orderCount: 1,
          totalSpent: o.total || 0,
          lastOrderDate: o.created_at,
        });
      }
    });

    const result: Customer[] = Array.from(customerMap.values())
      .map(c => {
        const tier = getTier(c.totalSpent);
        return {
          ...c,
          tier: tier.name,
          tierColor: tier.color,
          tierBg: tier.bg,
          tierIcon: tier.icon,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    setCustomers(result);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = [...customers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    }
    if (tierFilter) result = result.filter(c => c.tier === tierFilter);
    return result;
  }, [customers, search, tierFilter]);

  const stats = useMemo(() => {
    const total = customers.length;
    const vvip = customers.filter(c => c.tier === 'VVIP').length;
    const vip = customers.filter(c => c.tier === 'VIP').length;
    const gold = customers.filter(c => c.tier === 'Gold').length;
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
    return { total, vvip, vip, gold, totalRevenue };
  }, [customers]);

  const exportCSV = () => {
    const headers = ['이름', '이메일', '전화', '등급', '주문횟수', '총구매액', '최근주문'];
    const rows = filtered.map(c => [
      c.name, c.email, c.phone || '', c.tier, c.orderCount,
      c.totalSpent.toFixed(2),
      new Date(c.lastOrderDate).toLocaleDateString('ko-KR'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV 다운로드 완료');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">고객 관리</h1>
        <button onClick={exportCSV} className="btn-ghost text-sm">
          <Download className="w-4 h-4 mr-1" /> CSV 다운로드
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-400">전체 고객</p>
          <p className="text-xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-amber-500 flex items-center justify-center gap-1"><Crown className="w-3 h-3" />VVIP</p>
          <p className="text-xl font-bold text-amber-600">{stats.vvip}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-purple-500 flex items-center justify-center gap-1"><Star className="w-3 h-3" />VIP</p>
          <p className="text-xl font-bold text-purple-600">{stats.vip}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-blue-500 flex items-center justify-center gap-1"><Heart className="w-3 h-3" />Gold</p>
          <p className="text-xl font-bold text-blue-600">{stats.gold}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-400">총 매출</p>
          <p className="text-xl font-bold text-brand-600">{formatPrice(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Tier Guide */}
      <div className="card p-3 mb-3">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-medium text-slate-700">등급 기준:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>VVIP $1,000+</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span>VIP $500+</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Gold $250+</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span>Member</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 이메일, 전화번호..." className="input-base pl-10 py-1.5 text-sm" />
          </div>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="input-base py-1.5 text-sm w-auto">
            <option value="">전체 등급</option>
            <option value="VVIP">VVIP</option>
            <option value="VIP">VIP</option>
            <option value="Gold">Gold</option>
            <option value="Member">Member</option>
          </select>
          {(search || tierFilter) && (
            <button onClick={() => { setSearch(''); setTierFilter(''); }} className="text-xs text-brand-500 hover:underline">초기화</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 w-16">등급</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">고객명</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">이메일</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">전화</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-slate-500">주문횟수</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">총 구매액</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">최근 주문</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">로딩중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{search ? '검색 결과 없음' : '고객이 없습니다'}</td></tr>
              ) : filtered.map((customer) => (
                <tr key={customer.email} className="border-b border-slate-50 hover:bg-slate-25 transition-colors">
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', customer.tierBg, customer.tierColor)}>
                      <TierIcon icon={customer.tierIcon} className="w-3 h-3" />
                      {customer.tier}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-medium text-slate-800">{customer.name || '—'}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-slate-500">{customer.email}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-slate-500">{customer.phone || '—'}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-semibold text-slate-700">{customer.orderCount}회</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs font-bold text-slate-800">{formatPrice(customer.totalSpent)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-slate-400">
                      {new Date(customer.lastOrderDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
          <span>{filtered.length}명 표시</span>
          <span>취소/환불 주문 제외 · 총 구매액 기준 등급</span>
        </div>
      </div>
    </div>
  );
}
