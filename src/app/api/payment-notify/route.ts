export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@styleheba.com';
const ADMIN_EMAIL = 'jamie@hebajewelryinc.com';

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, customerName, customerEmail, senderName, paymentMethod } = await request.json();

    if (!orderNumber || !customerEmail) {
      return NextResponse.json({ error: '필수 정보가 없습니다' }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({ payment_reference: `입금확인요청: ${senderName || customerName}` })
      .eq('order_number', orderNumber);

    // Send admin notification email
    await resend.emails.send({
      from: `Style Heba <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[입금 확인 요청] ${orderNumber} - ${customerName}`,
      html: `
        <h2>입금 확인 요청이 들어왔습니다!</h2>
        <p><strong>주문번호:</strong> ${orderNumber}</p>
        <p><strong>고객명:</strong> ${customerName}</p>
        <p><strong>이메일:</strong> ${customerEmail}</p>
        <p><strong>결제수단:</strong> ${(paymentMethod || '').toUpperCase()}</p>
        <p><strong>입금자명:</strong> ${senderName || customerName}</p>
        <hr />
        <p>확인 후 <a href="https://styleheba.com/admin/orders">주문 관리</a>에서 상태를 <strong>입금확인</strong>으로 변경해주세요.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Payment notify error:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
