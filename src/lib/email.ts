import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@styleheba.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://styleheba.com';

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'zelle' | 'venmo';
  fulfillmentType: 'pickup' | 'shipping';
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; margin: 0; padding: 0; background: #FFF5F5; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo h1 { color: #E84C6A; font-size: 24px; margin: 0; letter-spacing: -0.5px; }
    .divider { height: 1px; background: #f1f1f1; margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 24px; line-height: 1.6; }
    h2 { color: #1a1a1a; font-size: 18px; margin: 0 0 12px 0; }
    p { color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 12px 0; }
    .btn { display: inline-block; background: #E84C6A; color: white !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; font-size: 14px; color: #444; }
    .total-row td { font-weight: 700; font-size: 16px; color: #E84C6A; border-top: 2px solid #f1f1f1; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo"><h1>Style Heba</h1></div>
      ${content}
    </div>
    <div class="footer">
      <p>Style Heba | 미국 한인 여성을 위한 공동구매</p>
      <p>Atlanta, GA | hello@styleheba.com</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(email: string, name?: string) {
  const html = baseTemplate(`
    <h2>${name ? `${name}님, ` : ''}환영합니다! 🎉</h2>
    <p>Style Heba에 가입해 주셔서 감사합니다.</p>
    <p>한국 직배송 뷰티, 패션, 식품을 합리적인 가격에 만나보세요.</p>
    <div class="divider"></div>
    <p><strong>🎁 첫 주문 혜택</strong></p>
    <p>첫 주문 $100 이상 시 5% 할인이 자동 적용됩니다!</p>
    <div class="divider"></div>
    <p style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}" class="btn">공구 보러가기 →</a>
    </p>
  `);

  return resend.emails.send({
    from: `Style Heba <${FROM_EMAIL}>`,
    to: email,
    subject: 'Style Heba에 오신 것을 환영합니다! 🎉',
    html,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  data: OrderEmailData
) {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.name} × ${item.quantity}</td>
      <td style="text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const paymentInfo =
    data.paymentMethod === 'zelle'
      ? `Zelle: pay@styleheba.com`
      : `Venmo: @styleheba`;

  const html = baseTemplate(`
    <h2>주문이 접수되었습니다 📦</h2>
    <p>주문번호: <strong>${data.orderNumber}</strong></p>
    <div class="divider"></div>
    <table>
      ${itemRows}
      <tr><td>소계</td><td style="text-align:right;">$${data.subtotal.toFixed(2)}</td></tr>
      ${data.shippingFee > 0 ? `<tr><td>배송비</td><td style="text-align:right;">$${data.shippingFee.toFixed(2)}</td></tr>` : ''}
      ${data.discountAmount > 0 ? `<tr><td>할인</td><td style="text-align:right;color:#E84C6A;">-$${data.discountAmount.toFixed(2)}</td></tr>` : ''}
      <tr class="total-row"><td>총 결제금액</td><td style="text-align:right;">$${data.total.toFixed(2)}</td></tr>
    </table>
    <div class="divider"></div>
    <p><strong>💳 입금 안내</strong></p>
    <p>${paymentInfo}</p>
    <p style="color:#E84C6A;font-size:13px;">입금 시 메모에 주문번호 <strong>${data.orderNumber}</strong> 을 적어주세요.</p>
    <div class="divider"></div>
    <p>${data.fulfillmentType === 'pickup' ? '📍 픽업 장소는 입금 확인 후 별도 안내드립니다.' : '📦 입금 확인 후 배송이 시작됩니다.'}</p>
    <p style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/mypage" class="btn">주문 확인하기</a>
    </p>
  `);

  return resend.emails.send({
    from: `Style Heba <${FROM_EMAIL}>`,
    to: email,
    subject: `[Style Heba] 주문 접수 완료 - ${data.orderNumber}`,
    html,
  });
}

export async function sendStatusUpdateEmail(
  email: string,
  orderNumber: string,
  status: 'paid' | 'ready_pickup',
  customerName?: string
) {
  const statusMessages = {
    paid: {
      title: '입금이 확인되었습니다 ✅',
      body: '입금이 정상적으로 확인되었습니다. 상품 준비가 시작되면 다시 안내드리겠습니다. 감사합니다!',
    },
    ready_pickup: {
      title: '픽업 준비가 완료되었습니다 📍',
      body: '주문하신 상품이 준비되었습니다. 아래 링크에서 픽업 장소를 확인해주세요.',
    },
  };

  const msg = statusMessages[status];

  const html = baseTemplate(`
    <h2>${msg.title}</h2>
    <p>${customerName ? `${customerName}님, ` : ''}${msg.body}</p>
    <p>주문번호: <strong>${orderNumber}</strong></p>
    <div class="divider"></div>
    <p style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/mypage" class="btn">주문 상세보기</a>
    </p>
  `);

  return resend.emails.send({
    from: `Style Heba <${FROM_EMAIL}>`,
    to: email,
    subject: `[Style Heba] ${msg.title} - ${orderNumber}`,
    html,
  });
}

export async function sendMagicLinkEmail(email: string, token: string) {
  const magicUrl = `${APP_URL}/auth/verify?token=${token}`;

  const html = baseTemplate(`
    <h2>로그인 링크입니다 🔑</h2>
    <p>아래 버튼을 클릭하면 마이페이지로 이동합니다.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${magicUrl}" class="btn">마이페이지 접속하기</a>
    </p>
    <p style="color:#999;font-size:12px;">이 링크는 30분 후 만료됩니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>
  `);

  return resend.emails.send({
    from: `Style Heba <${FROM_EMAIL}>`,
    to: email,
    subject: '[Style Heba] 로그인 링크',
    html,
  });
}
