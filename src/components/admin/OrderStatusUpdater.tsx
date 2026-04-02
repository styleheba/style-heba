'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUS_FLOW = [
  'pending',
  'paid',
  'preparing',
  'ready_pickup',
  'ready_ship',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

interface Props {
  orderId: string;
  currentStatus: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
}

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  customerEmail,
  customerName,
  orderNumber,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          customerEmail,
          customerName,
          orderNumber,
        }),
      });

      if (res.ok) {
        toast.success(`상태 변경: ${ORDER_STATUS_LABELS[newStatus]}`);
        window.location.reload();
      } else {
        toast.error('상태 변경 실패');
      }
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="btn-ghost text-xs flex items-center gap-1"
      >
        상태 변경
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
            {STATUS_FLOW.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                  status === currentStatus ? 'font-bold text-brand-600 bg-brand-50' : 'text-slate-600'
                }`}
              >
                {ORDER_STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
