'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface Settings {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta_text: string;
    cta_link: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
    bg_color: string;
  };
  footer: {
    instagram: string;
    kakao_channel: string;
    business_email: string;
    business_hours: string;
  };
  shipping: {
    free_threshold: number;
    flat_rate: number;
    pickup_location: string;
    pickup_note: string;
  };
  payment: {
    zelle_email: string;
    venmo_handle: string;
    payment_note: string;
  };
  new_customer_discount: {
    enabled: boolean;
    min_order: number;
    discount_percent: number;
    description: string;
  };
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('site_settings').select('*');

    if (data) {
      const mapped: any = {};
      data.forEach((s: any) => {
        mapped[s.key] = s.value;
      });
      setSettings(mapped);
    }
    setLoading(false);
  };

  const saveAll = async () => {
    if (!settings) return;
    setSaving(true);

    const supabase = createClient();

    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('site_settings')
          .update({ value: value as any })
          .eq('key', key);
      }
      toast.success('설정이 저장되었습니다!');
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: keyof Settings, field: string, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: { ...prev[section], [field]: value },
      };
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">홈 콘텐츠 편집</h1>
        <button onClick={saveAll} disabled={saving} className="btn-primary">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          저장
        </button>
      </div>

      <div className="space-y-6">
        {/* Hero */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">히어로 섹션</h2>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">제목</label>
              <input
                type="text"
                value={settings.hero.title}
                onChange={(e) => updateField('hero', 'title', e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">부제목</label>
              <input
                type="text"
                value={settings.hero.subtitle}
                onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">설명</label>
              <textarea
                value={settings.hero.description}
                onChange={(e) => updateField('hero', 'description', e.target.value)}
                className="input-base h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">CTA 텍스트</label>
                <input
                  type="text"
                  value={settings.hero.cta_text}
                  onChange={(e) => updateField('hero', 'cta_text', e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">CTA 링크</label>
                <input
                  type="text"
                  value={settings.hero.cta_link}
                  onChange={(e) => updateField('hero', 'cta_link', e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">공지 배너</h2>
          <div className="grid gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.announcement.enabled}
                onChange={(e) => updateField('announcement', 'enabled', e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">배너 표시</span>
            </label>
            <input
              type="text"
              value={settings.announcement.text}
              onChange={(e) => updateField('announcement', 'text', e.target.value)}
              placeholder="공지 내용"
              className="input-base"
            />
          </div>
        </div>

        {/* Payment */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">결제 설정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Zelle 이메일</label>
              <input
                type="text"
                value={settings.payment.zelle_email}
                onChange={(e) => updateField('payment', 'zelle_email', e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Venmo 핸들</label>
              <input
                type="text"
                value={settings.payment.venmo_handle}
                onChange={(e) => updateField('payment', 'venmo_handle', e.target.value)}
                className="input-base"
              />
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">배송 설정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">무료배송 기준 ($)</label>
              <input
                type="number"
                value={settings.shipping.free_threshold}
                onChange={(e) => updateField('shipping', 'free_threshold', Number(e.target.value))}
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">기본 배송비 ($)</label>
              <input
                type="number"
                value={settings.shipping.flat_rate}
                onChange={(e) => updateField('shipping', 'flat_rate', Number(e.target.value))}
                className="input-base"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">픽업 안내</label>
              <input
                type="text"
                value={settings.shipping.pickup_note}
                onChange={(e) => updateField('shipping', 'pickup_note', e.target.value)}
                className="input-base"
              />
            </div>
          </div>
        </div>

        {/* Discount */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">신규 할인</h2>
          <div className="grid gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.new_customer_discount.enabled}
                onChange={(e) => updateField('new_customer_discount', 'enabled', e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">할인 활성화</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">최소 주문 ($)</label>
                <input
                  type="number"
                  value={settings.new_customer_discount.min_order}
                  onChange={(e) => updateField('new_customer_discount', 'min_order', Number(e.target.value))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">할인율 (%)</label>
                <input
                  type="number"
                  value={settings.new_customer_discount.discount_percent}
                  onChange={(e) => updateField('new_customer_discount', 'discount_percent', Number(e.target.value))}
                  className="input-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
