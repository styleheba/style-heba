export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { sendStatusUpdateEmail } from '@/lib/email';

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, customerEmail, customerName, orderNumber } =
      await request.json();

    const supabase = createServiceSupabase();

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 });
    }

    if (status === 'paid' || status === 'ready_pickup') {
      try {
        await sendStatusUpdateEmail(
          customerEmail,
          orderNumber,
          status as 'paid' | 'ready_pickup',
          customerName
        );

        await supabase.from('email_logs').insert({
          recipient_email: customerEmail,
          email_type: status === 'paid' ? 'paid' : 'ready_pickup',
          subject: `[Style Heba] 주문 상태 업데이트 - ${orderNumber}`,
          order_id: orderId,
          status: 'sent',
        });
      } catch (emailErr) {
        console.error('Status email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}