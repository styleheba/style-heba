export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@styleheba.com';
const ADMIN_EMAIL = 'jamie@hebajewelryinc.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceSupabase();

    const {
      customer_name, customer_email, customer_phone,
      fulfillment_type, payment_method, customer_note,
      shipping_line1, shipping_line2, shipping_city,
      shipping_state, shipping_zip,
      items, subtotal, shipping_fee, discount_amount, total,
    } = body;

    if (!customer_name || !customer_email || !items?.length) {
      return NextResponse.json({ error: '필수 정보를 입력해주세요' }, { status: 400 });
    }

    const shipping_address = fulfillment_type === 'shipping'
      ? { line1: shipping_line1, line2: shipping_line2, city: shipping_city, state: shipping_state, zip: shipping_zip }
      : null;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email, customer_name, customer_phone,
        fulfillment_type, payment_method, customer_note,
        shipping_address, subtotal, shipping_fee, discount_amount, total,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: '주문 생성 중 오류가 발생했습니다' }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.product_price * item.quantity,
      selected_options: item.selected_options || {},
    }));

    await supabase.from('order_items').insert(orderItems);

    // 1. 고객에게 주문확인 이메일
    try {
      await sendOrderConfirmationEmail(customer_email, {
        orderNumber: order.order_number,
        customerName: customer_name,
        items: items.map((item: any) => ({
          name: item.product_name, quantity: item.quantity, price: item.product_price,
        })),
        subtotal, shippingFee: shipping_fee, discountAmount: discount_amount,
        total, paymentMethod: payment_method, fulfillmentType: fulfillment_type,
      });

      await supabase.from('email_logs').insert({
        recipient_email: customer_email,
        email_type: 'order_confirmation',
        subject: `[Style Heba] 주문 접수 완료 - ${order.order_number}`,
        order_id: order.id,
        status: 'sent',
      });
    } catch (emailErr) {
      console.error('Customer email error:', emailErr);
    }

    // 2. 관리자에게 주문 알림 이메일
    try {
      const itemList = items.map((item: any) => `${item.product_name} × ${item.quantity}`).join('\n');
      await resend.emails.send({
        from: `Style Heba <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `[새 주문] ${order.order_number} - ${customer_name}`,
        html: `
          <h2>새 주문이 접수되었습니다!</h2>
          <p><strong>주문번호:</strong> ${order.order_number}</p>
          <p><strong>고객:</strong> ${customer_name} (${customer_email})</p>
          <p><strong>전화:</strong> ${customer_phone || '미입력'}</p>
          <p><strong>결제:</strong> ${payment_method.toUpperCase()}</p>
          <p><strong>수령:</strong> ${fulfillment_type === 'pickup' ? '픽업' : '배송'}</p>
          <hr />
          <p><strong>주문 상품:</strong></p>
          <pre>${itemList}</pre>
          <hr />
          <p><strong>소계:</strong> $${subtotal.toFixed(2)}</p>
          ${shipping_fee > 0 ? `<p><strong>배송비:</strong> $${shipping_fee.toFixed(2)}</p>` : ''}
          ${discount_amount > 0 ? `<p><strong>할인:</strong> -$${discount_amount.toFixed(2)}</p>` : ''}
          <p><strong>합계:</strong> $${total.toFixed(2)}</p>
          ${customer_note ? `<hr /><p><strong>고객 메모:</strong> ${customer_note}</p>` : ''}
          <hr />
          <p><a href="https://styleheba.com/admin/orders">주문 관리 바로가기</a></p>
        `,
      });
    } catch (adminEmailErr) {
      console.error('Admin email error:', adminEmailErr);
    }

    return NextResponse.json({ order_id: order.id, order_number: order.order_number });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}