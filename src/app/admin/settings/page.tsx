'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, LogOut, Shield, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error('비밀번호 변경 실패: ' + error.message);
    } else {
      toast.success('비밀번호가 변경되었습니다');
      setNewPassword('');
    }
    setChangingPassword(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/admin-login');
    router.refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">설정</h1>

      <div className="space-y-6 max-w-xl">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-slate-900">비밀번호 변경</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)"
              className="input-base flex-1"
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn-primary flex-shrink-0"
            >
              {changingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '변경'
              )}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-slate-900">알림 설정</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700">새 주문 알림 이메일</span>
              <span className="text-xs text-slate-400">추후 지원 예정</span>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700">재고 부족 알림</span>
              <span className="text-xs text-slate-400">추후 지원 예정</span>
            </label>
          </div>
        </div>

        <div className="card p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-500 font-medium hover:text-red-600 transition-colors py-2"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}