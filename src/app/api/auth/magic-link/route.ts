import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServiceSupabase } from '@/lib/supabase/server';
import { sendMagicLinkEmail } from '@/lib/email';

// POST - Request magic link
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    // Save magic link
    const { error } = await supabase.from('magic_links').insert({
      email,
      token,
      expires_at: expiresAt,
    });

    if (error) {
      console.error('Magic link save error:', error);
      return NextResponse.json({ error: '처리 중 오류' }, { status: 500 });
    }

    // Send email
    try {
      await sendMagicLinkEmail(email, token);
      await supabase.from('email_logs').insert({
        recipient_email: email,
        email_type: 'magic_link',
        subject: '[Style Heba] 로그인 링크',
        status: 'sent',
      });
    } catch (emailErr) {
      console.error('Magic link email error:', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
