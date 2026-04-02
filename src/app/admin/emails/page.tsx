import { createServerSupabase } from '@/lib/supabase/server';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: '이메일' };

const TYPE_LABELS: Record<string, string> = {
  welcome: '웰컴',
  order_confirmation: '주문확인',
  preparing: '배송준비',
  ready_pickup: '픽업준비',
  magic_link: '매직링크',
};

const TYPE_COLORS: Record<string, string> = {
  welcome: 'bg-purple-100 text-purple-700',
  order_confirmation: 'bg-blue-100 text-blue-700',
  preparing: 'bg-indigo-100 text-indigo-700',
  ready_pickup: 'bg-emerald-100 text-emerald-700',
  magic_link: 'bg-slate-100 text-slate-600',
};

export default async function AdminEmailsPage() {
  const supabase = createServerSupabase();

  const { data: emails } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const emailList = (emails || []) as any[];
  const total = emailList.length;
  const sent = emailList.filter((e: any) => e.status === 'sent').length;
  const failed = emailList.filter((e: any) => e.status === 'failed').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">이메일 발송 내역</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <Send className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-slate-500">전체</p>
            <p className="text-lg font-bold">{total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs text-slate-500">성공</p>
            <p className="text-lg font-bold text-emerald-600">{sent}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-xs text-slate-500">실패</p>
            <p className="text-lg font-bold text-red-600">{failed}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">상태</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">유형</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">수신자</th>
              <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">제목</th>
              <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">발송일시</th>
            </tr>
          </thead>
          <tbody>
            {emailList.map((email: any) => (
              <tr key={email.id} className="border-b border-slate-50">
                <td className="px-6 py-3">
                  {email.status === 'sent' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className={cn('badge text-[11px]', TYPE_COLORS[email.email_type] || 'bg-slate-100 text-slate-600')}>
                    {TYPE_LABELS[email.email_type] || email.email_type}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-800">{email.recipient_email}</td>
                <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[300px]">{email.subject || '-'}</td>
                <td className="px-6 py-3 text-right text-xs text-slate-400">
                  {new Date(email.created_at).toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!emails || emails.length === 0) && (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">발송된 이메일이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}