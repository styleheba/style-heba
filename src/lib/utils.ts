import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Price formatting
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Shipping fee calculation
export const SHIPPING = {
  FREE_THRESHOLD: 150,
  FLAT_RATE: 10,
} as const;

export function calculateShippingFee(
  subtotal: number,
  fulfillmentType: 'pickup' | 'shipping'
): number {
  if (fulfillmentType === 'pickup') return 0;
  return subtotal >= SHIPPING.FREE_THRESHOLD ? 0 : SHIPPING.FLAT_RATE;
}

// New customer discount
export const NEW_CUSTOMER_DISCOUNT = {
  MIN_ORDER: 100,
  PERCENT: 5,
} as const;

export function calculateNewCustomerDiscount(
  subtotal: number,
  isFirstOrder: boolean
): number {
  if (!isFirstOrder) return 0;
  if (subtotal < NEW_CUSTOMER_DISCOUNT.MIN_ORDER) return 0;
  return Math.round(subtotal * (NEW_CUSTOMER_DISCOUNT.PERCENT / 100) * 100) / 100;
}

// Order total
export function calculateOrderTotal(
  subtotal: number,
  shippingFee: number,
  discountAmount: number
): number {
  return Math.max(0, subtotal + shippingFee - discountAmount);
}

// Slug generator (Korean-safe)
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Date formatting (Korean)
export function formatDateKo(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// Relative time
export function getTimeRemaining(endDate: string | Date): string {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return '마감';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

// Percentage
export function getSlotPercentage(sold: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((sold / total) * 100);
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Supabase Storage URL helper
export function getStorageUrl(path: string | null, bucket: string = 'products'): string {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Category labels (Korean)
export const CATEGORY_LABELS: Record<string, string> = {
  beauty: '뷰티',
  fashion: '패션',
  food: '식품',
  health: '건강',
  kitchen: '주방',
  kids: '키즈',
  living: '리빙',
  etc: '기타',
};

// Order status labels (Korean)
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '입금대기',
  paid: '입금확인',
  preparing: '배송준비중',
  ready_pickup: '픽업준비완료',
  ready_ship: '발송준비완료',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '주문취소',
  refunded: '환불완료',
};

// Order status colors
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  ready_pickup: 'bg-emerald-100 text-emerald-800',
  ready_ship: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};
