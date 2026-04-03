export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

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
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({ order_id: order.id, order_number: order.order_number });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}