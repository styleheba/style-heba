'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Truck,
  Store,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/lib/store/cart';
import {
  cn,
  formatPrice,
  getStorageUrl,
  calculateShippingFee,
  calculateNewCustomerDiscount,
  calculateOrderTotal,
  SHIPPING,
} from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    fulfillment_type: 'pickup' as 'pickup' | 'shipping',
    payment_method: 'zelle' as 'zelle' | 'venmo',
    customer_note: '',
    shipping_line1: '',
    shipping_line2: '',
    shipping_city: '',
    shipping_state: 'GA',
    shipping_zip: '',
  });

  // 저장된 고객 정보 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('sh-customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(prev => ({
          ...prev,
          customer_name: parsed.customer_name || prev.customer_name,
          customer_email: parsed.customer_email || prev.customer_email,
          customer_phone: parsed.customer_phone || prev.customer_phone,
          shipping_line1: parsed.shipping_line1 || prev.shipping_line1,
          shipping_line2: parsed.shipping_line2 || prev.shipping_line2,
          shipping_city: parsed.shipping_city || prev.shipping_city,
          shipping_state: parsed.shipping_state || prev.shipping_state,
          shipping_zip: parsed.shipping_zip || prev.shipping_zip,
        }));
      } catch {}
    }
  }, []);

  const [isFirstOrder] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const shippingFee = calculateShippingFee(subtotal, form.fulfillment_type);
  const discount = calculateNewCustomerDiscount(subtotal, isFirstOrder);
  const total = calculateOrderTotal(subtotal, shippingFee, discount);

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    try {
      // 고객 정보 브라우저에 저장
      localStorage.setItem('sh-customer', JSON.stringify({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        shipping_line1: form.shipping_line1,
        shipping_line2: form.shipping_line2,
        shipping_city: form.shipping_city,
        shipping_state: form.shipping_state,
        shipping_zip: form.shipping_zip,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name_ko || item.product.name,
            product_image: item.product.thumbnail,
            product_price: item.product.price,
            quantity: item.quantity,
            selected_options: item.selectedOptions,
          })),
          subtotal,
          shipping_fee: shippingFee,
          discount_amount: discount,
          total,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrderComplete(data.order_number);
        clearCart();
      } else {
        toast.error(data.error || '주문 처리 중 오류가 발생했습니다');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container-app py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">주문이 완료되었습니다!</h1>
          <p className="text-slate-500 mb-2">주문번호: {orderComplete}</p>
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-2">💳 입금 안내</p>
            <p className="text-sm text-amber-700">
              {form.payment_method === 'zelle' ? 'Zelle: pay@styleheba.com' : 'Venmo: @styleheba'}
            </p>
            <p className="text-xs text-amber-600 mt-1">메모에 주문번호 <strong>{orderComplete}</strong>를 적어주세요</p>
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/" className="btn-secondary">홈으로</Link>
            <Link href="/mypage" className="btn-primary">주문 확인</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-slate-400">장바구니가 비어있습니다</p>
        <Link href="/preorder" className="btn-primary mt-4 inline-block">쇼핑하러 가기</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" />쇼핑 계속하기
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">결제하기</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">주문자 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">이름 *</label>
                <input type="text" value={form.customer_name} onChange={(e) => updateForm('customer_name', e.target.value)} className="input-base" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">이메일 *</label>
                <input type="email" value={form.customer_email} onChange={(e) => updateForm('customer_email', e.target.value)} className="input-base" required />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1 block">전화번호</label>
                <input type="tel" value={form.customer_phone} onChange={(e) => updateForm('customer_phone', e.target.value)} className="input-base" placeholder="선택사항" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">수령 방법</h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => updateForm('fulfillment_type', 'pickup')}
                className={cn('p-4 rounded-xl border-2 text-left transition-all', form.fulfillment_type === 'pickup' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300')}>
                <Store className="w-5 h-5 text-brand-500 mb-2" />
                <p className="text-sm font-semibold">픽업</p>
                <p className="text-xs text-slate-500 mt-0.5">Atlanta, GA</p>
              </button>
              <button type="button" onClick={() => updateForm('fulfillment_type', 'shipping')}
                className={cn('p-4 rounded-xl border-2 text-left transition-all', form.fulfillment_type === 'shipping' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300')}>
                <Truck className="w-5 h-5 text-brand-500 mb-2" />
                <p className="text-sm font-semibold">배송</p>
                <p className="text-xs text-slate-500 mt-0.5">{subtotal >= SHIPPING.FREE_THRESHOLD ? '무료배송' : `$${SHIPPING.FLAT_RATE}`}</p>
              </button>
            </div>

            {form.fulfillment_type === 'shipping' && (
              <div className="mt-4 space-y-3">
                <input type="text" value={form.shipping_line1} onChange={(e) => updateForm('shipping_line1', e.target.value)} placeholder="주소 *" className="input-base" required />
                <input type="text" value={form.shipping_line2} onChange={(e) => updateForm('shipping_line2', e.target.value)} placeholder="상세주소 (Apt, Suite 등)" className="input-base" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" value={form.shipping_city} onChange={(e) => updateForm('shipping_city', e.target.value)} placeholder="도시 *" className="input-base" required />
                  <input type="text" value={form.shipping_state} onChange={(e) => updateForm('shipping_state', e.target.value)} placeholder="주" className="input-base" />
                  <input type="text" value={form.shipping_zip} onChange={(e) => updateForm('shipping_zip', e.target.value)} placeholder="ZIP *" className="input-base" required />
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">결제 방법</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['zelle', 'venmo'] as const).map((method) => (
                <button key={method} type="button" onClick={() => updateForm('payment_method', method)}
                  className={cn('p-4 rounded-xl border-2 text-center transition-all', form.payment_method === method ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300')}>
                  <CreditCard className="w-5 h-5 text-brand-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold capitalize">{method}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{method === 'zelle' ? 'pay@styleheba.com' : '@styleheba'}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">주문 후 안내되는 계정으로 입금해주세요. 입금 확인 후 발송됩니다.</p>
          </div>

          <div className="card p-6">
            <label className="text-sm font-medium text-slate-700 mb-2 block">요청사항 (선택)</label>
            <textarea value={form.customer_note} onChange={(e) => updateForm('customer_note', e.target.value)} className="input-base h-20 resize-none" placeholder="배송 메모, 특별 요청 등" />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-28">
            <h2 className="text-lg font-bold text-slate-900 mb-4">주문 요약</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`} className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={getStorageUrl(item.product.thumbnail)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.product.name_ko || item.product.name}</p>
                    <p className="text-xs text-slate-400">{formatPrice(item.product.price)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">소계</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">배송비</span><span>{shippingFee === 0 ? <span className="text-emerald-600">무료</span> : formatPrice(shippingFee)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-brand-500">첫 주문 5% 할인</span><span className="text-brand-500">-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-100"><span>총 결제금액</span><span className="text-brand-600">{formatPrice(total)}</span></div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">{loading ? '주문 처리중...' : `${formatPrice(total)} 주문하기`}</button>
            <p className="text-[11px] text-slate-400 text-center mt-3">주문 완료 후 안내되는 계정으로 입금해주세요</p>
          </div>
        </div>
      </form>
    </div>
  );
}
