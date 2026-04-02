import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Upsert subscriber
    const { error } = await supabase
      .from('subscribers')
      .upsert(
        { email, name, source: 'popup', is_active: true },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Subscribe error:', error);
      return NextResponse.json({ error: '구독 처리 중 오류' }, { status: 500 });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
      await supabase.from('email_logs').insert({
        recipient_email: email,
        email_type: 'welcome',
        subject: 'Style Heba에 오신 것을 환영합니다!',
        status: 'sent',
      });
    } catch (emailErr) {
      console.error('Welcome email error:', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
