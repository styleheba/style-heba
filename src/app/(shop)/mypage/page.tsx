'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Clock, LogOut, Mail, Send, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  formatPrice, formatDateKo, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, cn,
} from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: { product_name: string; quantity: number; product_price: number }[];
}

function MyPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [notifyingOrder, setNotifyingOrder] = useState<string | null>(null);
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(new Set());
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const authEmail = searchParams.get('auth');
    const error = searchParams.get('error');
    if (error === 'expired') toast.error('링크가 만료되었습니다. 다시 요청해주세요.');
    if (authEmail) {
      setEmail(authEmail);
      localStorage.setItem('sh-email', authEmail);
      window.history.replaceState({}, '', '/mypage');
    } else {
      const saved = localStorage.getItem('sh-email');
      if (saved) setEmail(saved);
    }
  }, [searchParams]);

  useEffect(() => { if (!email) return; fetchOrders(); }, [email]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mypage/orders?email=${encodeURIComponent(email)}`);
      if (res.ok) { const data = await res.json(); setOrders(data.orders || []); }
    } catch { toast.error('주문 조회 중 오류가 발생했습니다'); }
    finally { setLoading(false); }
  };

  const handleRequestLink = async () => {
    if (!inputEmail) return;
    setSendingLink(true);
    try {
      const res = await fetch('/api/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inputEmail }) });
      if (res.ok) toast.success('로그인 링크가 발송되었습니다! 이메일을 확인해주세요.');
      else toast.error('링크 발송 중 오류가 발생했습니다');
    } catch { toast.error('네트워크 오류'); }
    finally { setSendingLink(false); }
  };

  const handlePaymentNotify = async (order: Order) => {
    setNotifyingOrder(order.order_number);
    try {
      const res = await fetch('/api/payment-notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.order_number,
          customerName: email,
          customerEmail: email,
          senderName: senderNames[order.order_number] || '',
          paymentMethod: order.payment_method,
        }),
      });
      if (res.ok) {
        setNotifiedOrders(prev => new Set([...prev, order.order_number]));
        toast.success('입금 확인 요청이 전송되었습니다!');
      } else { toast.error('전송 실패'); }
    } catch { toast.error('네트워크 오류'); }
    finally { setNotifyingOrder(null); }
  };

  const handleLogout = () => { setEmail(''); setOrders([]); localStorage.removeItem('sh-email'); };

  if (!email) {
    return (
      <div className="container-app py-16">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6"><Mail className="w-8 h-8 text-brand-500" /></div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">마이페이지</h1>
          <p className="text-slate-500 text-sm mb-6">이메일을 입력하면 로그인 링크를 보내드립니다</p>
          <div className="flex gap-2">
            <input type="email" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} placeholder="이메일 주소" className="input-base flex-1" onKeyDown={(e) => e.key === 'Enter' && handleRequestLink()} />
            <button onClick={handleRequestLink} disabled={sendingLink || !inputEmail} className="btn-primary flex-shrink-0">{sendingLink ? '발송중...' : '로그인'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-slate-900">마이페이지</h1><p className="text-sm text-slate-500 mt-1">{email}</p></div>
        <button onClick={handleLogout} className="btn-ghost text-slate-400"><LogOut className="w-4 h-4 mr-1" />로그아웃</button>
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-4">주문 내역</h2>

      {loading ? (
        <div className="text-center py-12 text-slate-400">로딩중...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12"><Package className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">주문 내역이 없습니다</p></div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatDateKo(order.created_at)}</p>
                </div>
                <span className={cn('badge', ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600')}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.product_name} × {item.quantity}</span>
                    <span className="text-slate-500">{formatPrice(item.product_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <span className="text-sm text-slate-500">총 결제금액</span>
                <span className="text-base font-bold text-brand-600">{formatPrice(order.total)}</span>
              </div>

              {/* 입금 확인 요청 버튼 - pending 상태일 때만 */}
              {order.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {notifiedOrders.has(order.order_number) ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      <Check className="w-4 h-4" /> 입금 확인 요청이 전송되었습니다
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-brand-600 font-medium">📢 입금 후 아래 버튼을 눌러주시면 빠르게 확인해드립니다</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={senderNames[order.order_number] || ''}
                          onChange={(e) => setSenderNames(prev => ({ ...prev, [order.order_number]: e.target.value }))}
                          placeholder="입금자명 (본인과 다를 경우)"
                          className="input-base text-xs flex-1"
                        />
                        <button
                          onClick={() => handlePaymentNotify(order)}
                          disabled={notifyingOrder === order.order_number}
                          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          {notifyingOrder === order.order_number ? '전송중...' : '입금 완료 알림'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={<div className="container-app py-16 text-center text-slate-400">로딩중...</div>}>
      <MyPageContent />
    </Suspense>
  );
}
