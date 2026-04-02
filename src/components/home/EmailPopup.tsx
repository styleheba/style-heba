'use client';

import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('sh-popup-dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('sh-popup-dismissed', Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        toast.success('구독 완료! 감사합니다 🎉');
        handleDismiss();
      } else {
        toast.error('잠시 후 다시 시도해주세요');
      }
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7 text-brand-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            첫 주문 5% 할인!
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            이메일을 등록하고 공구 오픈 알림과
            <br />
            첫 주문 할인 혜택을 받아보세요.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="input-base text-center"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '처리중...' : '할인 받기'}
            </button>
          </form>

          <button
            onClick={handleDismiss}
            className="mt-3 text-xs text-slate-400 hover:text-slate-500"
          >
            괜찮아요, 다음에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
