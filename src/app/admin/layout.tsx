import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: { default: '관리자', template: '%s | Style Heba 관리자' },
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/admin-login');
  }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!admin) {
    redirect('/auth/admin-login?error=unauthorized');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar admin={admin} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}