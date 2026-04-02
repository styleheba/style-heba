import { z } from 'zod';

// ============================================================
// Product
// ============================================================

export const productSchema = z.object({
  name: z.string().min(1, '상품명을 입력해주세요'),
  name_ko: z.string().optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  description_ko: z.string().optional(),
  price: z.number().positive('가격을 입력해주세요'),
  original_price: z.number().positive().optional().nullable(),
  cost_price: z.number().positive().optional().nullable(),
  product_type: z.enum(['preorder', 'instock']),
  category: z.enum(['beauty', 'fashion', 'food', 'health', 'kitchen', 'kids', 'living', 'etc']),
  status: z.enum(['draft', 'active', 'soldout', 'archived']).default('draft'),
  total_slots: z.number().int().positive().default(150),
  is_featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  detail_tabs: z.record(z.any()).default({}),
  group_buy_id: z.string().uuid().optional().nullable(),
});

// ============================================================
// Order / Checkout
// ============================================================

export const checkoutSchema = z.object({
  customer_name: z.string().min(1, '이름을 입력해주세요'),
  customer_email: z.string().email('올바른 이메일을 입력해주세요'),
  customer_phone: z.string().optional(),
  fulfillment_type: z.enum(['pickup', 'shipping']),
  payment_method: z.enum(['zelle', 'venmo']),
  customer_note: z.string().optional(),
  
  // Shipping address (conditional)
  shipping_address: z.object({
    line1: z.string().min(1, '주소를 입력해주세요'),
    line2: z.string().optional(),
    city: z.string().min(1, '도시를 입력해주세요'),
    state: z.string().min(1).default('GA'),
    zip: z.string().min(5, '우편번호를 입력해주세요'),
  }).optional(),
}).refine(
  (data) => {
    if (data.fulfillment_type === 'shipping') {
      return !!data.shipping_address?.line1;
    }
    return true;
  },
  { message: '배송 주소를 입력해주세요', path: ['shipping_address'] }
);

// ============================================================
// Subscriber
// ============================================================

export const subscriberSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  name: z.string().optional(),
});

// ============================================================
// Magic Link
// ============================================================

export const magicLinkSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
});

// ============================================================
// Group Buy
// ============================================================

export const groupBuySchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  title_ko: z.string().optional(),
  description: z.string().optional(),
  open_at: z.string().min(1, '오픈 시간을 설정해주세요'),
  close_at: z.string().min(1, '마감 시간을 설정해주세요'),
  estimated_arrival: z.string().optional(),
});

// ============================================================
// Profile Update
// ============================================================

export const profileUpdateSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

// Type exports
export type ProductInput = z.infer<typeof productSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SubscriberInput = z.infer<typeof subscriberSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type GroupBuyInput = z.infer<typeof groupBuySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
