import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: '이메일이 필요합니다' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total, created_at,
      order_items (product_name, quantity, product_price)
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: '조회 오류' }, { status: 500 });
  }

  const formatted = (orders || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
    items: o.order_items || [],
  }));

  return NextResponse.json({ orders: formatted });
}
