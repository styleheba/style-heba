# Style Heba - Next.js 14 + Supabase 리빌드

## 프로젝트 구조

```
style-heba/
├── src/
│   ├── app/
│   │   ├── (shop)/              # 고객 페이지 (공통 레이아웃)
│   │   │   ├── layout.tsx       # Header + Footer + CartDrawer
│   │   │   ├── page.tsx         # 홈페이지
│   │   │   ├── preorder/
│   │   │   │   ├── page.tsx     # 프리오더 목록
│   │   │   │   └── [slug]/page.tsx  # 상품 상세
│   │   │   ├── shop/
│   │   │   │   ├── page.tsx     # 바로구매 목록
│   │   │   │   └── [slug]/page.tsx  # 상품 상세
│   │   │   ├── checkout/page.tsx    # 결제
│   │   │   └── mypage/page.tsx      # 마이페이지
│   │   ├── admin/               # 관리자 패널
│   │   │   ├── layout.tsx       # 관리자 레이아웃 (사이드바)
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx         # 대시보드
│   │   │   ├── products/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── group-buys/page.tsx
│   │   │   └── site-settings/page.tsx
│   │   ├── auth/verify/page.tsx     # 매직링크 인증
│   │   ├── api/
│   │   │   ├── orders/route.ts      # 주문 생성
│   │   │   ├── subscribe/route.ts   # 이메일 구독
│   │   │   ├── auth/magic-link/route.ts
│   │   │   ├── admin/orders/status/route.ts
│   │   │   └── mypage/orders/route.ts
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/Header.tsx, Footer.tsx
│   │   ├── cart/CartDrawer.tsx
│   │   ├── product/ProductCard.tsx, ProductDetailClient.tsx, CategoryFilter.tsx
│   │   ├── home/GroupBuyBanner.tsx, EmailPopup.tsx
│   │   └── admin/AdminSidebar.tsx, OrderStatusUpdater.tsx
│   ├── lib/
│   │   ├── supabase/client.ts, server.ts, middleware.ts
│   │   ├── database.types.ts
│   │   ├── email.ts             # Resend 이메일 서비스
│   │   ├── validations.ts       # Zod 스키마
│   │   ├── utils.ts             # 유틸리티 함수
│   │   └── store/cart.ts        # Zustand 장바구니
│   └── middleware.ts            # Next.js 미들웨어
├── supabase/
│   └── migrations/001_initial_schema.sql
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Step 1: Supabase 세팅

### 1-1. Supabase 프로젝트 생성
1. https://supabase.com 에서 새 프로젝트 생성
2. Region: **US East (N. Virginia)** (Atlanta에 가장 가까움)
3. 비밀번호 안전하게 보관

### 1-2. 데이터베이스 마이그레이션
1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/001_initial_schema.sql` 내용 전체 복사 → 실행
3. 테이블 13개 + ENUM + Trigger + RLS + 기본 설정 자동 생성

### 1-3. Storage 버킷 생성
Dashboard → Storage:
- `products` 버킷 생성 (Public)
- `site` 버킷 생성 (Public)

### 1-4. 관리자 계정 생성
1. Dashboard → Authentication → Users → Create user
2. 이메일/비밀번호 입력
3. SQL Editor에서:
```sql
INSERT INTO admin_users (user_id, email, role)
VALUES (
  '여기에-auth-user-uuid',
  'your-admin@email.com',
  'super'
);
```

### 1-5. API 키 복사
Dashboard → Settings → API:
- `Project URL` → NEXT_PUBLIC_SUPABASE_URL
- `anon public key` → NEXT_PUBLIC_SUPABASE_ANON_KEY
- `service_role key` → SUPABASE_SERVICE_ROLE_KEY (비밀!)

---

## Step 2: Resend 이메일 설정

### 2-1. DNS 설정 (Cloudflare)
1. https://resend.com → Domain 추가: styleheba.com
2. Cloudflare DNS에 Resend DKIM/SPF 레코드 추가
3. Verify 완료까지 대기 (보통 5-10분)

### 2-2. API Key
Resend Dashboard → API Keys → 새 키 생성 → RESEND_API_KEY

---

## Step 3: 로컬 개발 시작

```bash
# 1. 의존성 설치
cd style-heba
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 편집하여 실제 키 입력

# 3. Supabase 타입 생성 (선택)
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > src/lib/database.types.ts

# 4. 개발 서버 실행
npm run dev
```

---

## Step 4: Cloudflare Pages 배포

### 4-1. GitHub 연결
```bash
git init
git add .
git commit -m "Initial: Style Heba Next.js + Supabase"
git remote add origin https://github.com/YOUR/style-heba.git
git push -u origin main
```

### 4-2. Cloudflare Pages 설정
1. Cloudflare Dashboard → Pages → Create project
2. GitHub repo 연결
3. Build settings:
   - Framework: Next.js
   - Build command: `npx @cloudflare/next-on-pages`
   - Output: `.vercel/output/static`
4. Environment variables: 위 `.env.local` 키 모두 추가

### 4-3. 커스텀 도메인
Cloudflare Pages → Custom domain → `styleheba.com` 추가
(이미 Cloudflare DNS 사용중이면 자동 연결)

---

## 데이터베이스 스키마 요약

| 테이블 | 설명 | 주요 필드 |
|--------|------|-----------|
| profiles | 고객 프로필 | email, name, address, total_spent |
| products | 상품 | name, price, category, product_type, slots |
| group_buys | 공구 라운드 | title, open_at, close_at, status |
| orders | 주문 | order_number, status, total, payment_method |
| order_items | 주문 항목 | product snapshot, quantity, options |
| cart_items | 장바구니 | user_id, product_id, quantity |
| subscribers | 뉴스레터 | email, is_active, source |
| site_settings | 사이트 설정 | key-value JSONB |
| email_logs | 이메일 로그 | type, resend_id, status |
| admin_users | 관리자 | email, role (super/manager/viewer) |
| magic_links | 매직링크 | token, expires_at |

---

## 이메일 트리거

| 이벤트 | 이메일 | 트리거 시점 |
|--------|--------|------------|
| Welcome | 구독 환영 | 이메일 구독 시 |
| Order Confirmation | 주문 확인 | 주문 생성 시 |
| Preparing | 배송 준비 | 관리자 상태 변경 → preparing |
| Ready Pickup | 픽업 준비 | 관리자 상태 변경 → ready_pickup |
| Magic Link | 로그인 링크 | 마이페이지 접속 요청 시 |

---

## 비즈니스 로직

- **배송비**: $150+ 무료, 미만 $10, 픽업 무료
- **신규 할인**: 첫 주문 $100+ → 5% 할인
- **공구 슬롯**: 기본 150개, 진행률 표시
- **결제**: Zelle (pay@styleheba.com) / Venmo (@styleheba)
- **주문번호**: SH-YYYYMMDD-0001 형식 자동 생성
