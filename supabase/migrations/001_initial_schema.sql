-- ============================================================
-- Style Heba - Supabase Database Schema
-- Korean Group-Buy E-Commerce Platform
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for Korean text search

-- ============================================================
-- 1. ENUM Types
-- ============================================================

CREATE TYPE product_status AS ENUM ('draft', 'active', 'soldout', 'archived');
CREATE TYPE product_type AS ENUM ('preorder', 'instock');
CREATE TYPE product_category AS ENUM ('beauty', 'fashion', 'food', 'health', 'kitchen', 'kids', 'living', 'etc');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'ready_pickup', 'ready_ship', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('zelle', 'venmo');
CREATE TYPE fulfillment_type AS ENUM ('pickup', 'shipping');
CREATE TYPE group_buy_status AS ENUM ('upcoming', 'active', 'closed', 'completed');
CREATE TYPE email_type AS ENUM ('welcome', 'order_confirmation', 'preparing', 'ready_pickup', 'magic_link');
CREATE TYPE admin_role AS ENUM ('super', 'manager', 'viewer');

-- ============================================================
-- 2. Profiles (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT DEFAULT 'GA',
  zip TEXT,
  is_first_order_used BOOLEAN DEFAULT FALSE,  -- 첫 주문 5% 할인 사용 여부
  total_spent NUMERIC(10,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  marketing_consent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Admin Users
-- ============================================================

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role admin_role DEFAULT 'manager',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Products
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name TEXT NOT NULL,
  name_ko TEXT,                          -- 한국어 상품명
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ko TEXT,
  
  -- Pricing
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),          -- 할인 전 가격 (취소선 표시용)
  cost_price NUMERIC(10,2),              -- 원가 (관리자용)
  
  -- Classification
  product_type product_type NOT NULL DEFAULT 'preorder',
  category product_category NOT NULL DEFAULT 'beauty',
  status product_status DEFAULT 'draft',
  
  -- Inventory
  total_slots INTEGER DEFAULT 150,       -- 공구 슬롯
  sold_count INTEGER DEFAULT 0,
  
  -- Images (Supabase Storage paths)
  images TEXT[] DEFAULT '{}',            -- array of storage paths
  thumbnail TEXT,                         -- main thumbnail path
  
  -- Category-specific details (JSONB for flexibility)
  -- Beauty: {brand, volume, ingredients, how_to_use}
  -- Fashion: {brand, sizes, materials, care_instructions}
  -- Food: {origin, weight, expiry, storage, allergens}
  detail_tabs JSONB DEFAULT '{}',
  
  -- SEO & Display
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Group Buy Reference
  group_buy_id UUID,                     -- linked group buy round
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_group_buy ON products(group_buy_id);

-- ============================================================
-- 5. Group Buys (공동구매 라운드)
-- ============================================================

CREATE TABLE group_buys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,                    -- e.g., "3월 2차 공구"
  title_ko TEXT,
  description TEXT,
  
  status group_buy_status DEFAULT 'upcoming',
  
  -- Schedule
  open_at TIMESTAMPTZ NOT NULL,           -- 오픈 시간
  close_at TIMESTAMPTZ NOT NULL,          -- 마감 시간
  estimated_arrival DATE,                 -- 예상 입고일
  
  -- Stats (denormalized for performance)
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_buys_status ON group_buys(status);
CREATE INDEX idx_group_buys_dates ON group_buys(open_at, close_at);

-- Add FK after group_buys table exists
ALTER TABLE products 
  ADD CONSTRAINT fk_products_group_buy 
  FOREIGN KEY (group_buy_id) REFERENCES group_buys(id) ON DELETE SET NULL;

-- ============================================================
-- 6. Orders
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Order Number (human-readable)
  order_number TEXT NOT NULL UNIQUE,      -- e.g., "SH-20260327-0001"
  
  -- Customer
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Fulfillment
  fulfillment_type fulfillment_type NOT NULL DEFAULT 'pickup',
  shipping_address JSONB,                 -- {line1, line2, city, state, zip}
  
  -- Payment
  payment_method payment_method NOT NULL,
  payment_reference TEXT,                 -- Zelle/Venmo transaction reference
  payment_confirmed_at TIMESTAMPTZ,
  
  -- Pricing
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_fee NUMERIC(10,2) DEFAULT 0,   -- $0 if >= $150, else $10
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_code TEXT,
  total NUMERIC(10,2) NOT NULL,
  
  -- Status
  status order_status DEFAULT 'pending',
  
  -- Notes
  customer_note TEXT,
  admin_note TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- 7. Order Items
-- ============================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Snapshot at time of order (products can change)
  product_name TEXT NOT NULL,
  product_image TEXT,
  product_price NUMERIC(10,2) NOT NULL,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL,
  
  -- For fashion: selected size/option
  selected_options JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- 8. Cart (persistent server-side cart)
-- ============================================================

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_options JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id, selected_options)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ============================================================
-- 9. Email Log
-- ============================================================

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  email_type email_type NOT NULL,
  subject TEXT,
  resend_id TEXT,                          -- Resend API response ID
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'sent',              -- sent, failed, bounced
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);

-- ============================================================
-- 10. Site Settings (홈 콘텐츠 편집)
-- ============================================================

CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Default settings
INSERT INTO site_settings (key, value) VALUES
  ('hero', '{
    "title": "Style Heba",
    "subtitle": "미국 한인 여성을 위한 공동구매",
    "description": "한국 직배송 뷰티, 패션, 식품을 합리적인 가격에",
    "background_image": null,
    "cta_text": "공구 보러가기",
    "cta_link": "/preorder"
  }'::jsonb),
  ('announcement', '{
    "enabled": false,
    "text": "",
    "link": null,
    "bg_color": "#FEE2E2"
  }'::jsonb),
  ('footer', '{
    "instagram": "https://instagram.com/styleheba",
    "kakao_channel": "",
    "business_email": "hello@styleheba.com",
    "business_hours": "Mon-Fri 10AM - 6PM EST"
  }'::jsonb),
  ('shipping', '{
    "free_threshold": 150,
    "flat_rate": 10,
    "pickup_location": "Atlanta, GA",
    "pickup_note": "픽업 장소는 주문 확인 후 안내드립니다"
  }'::jsonb),
  ('payment', '{
    "zelle_email": "pay@styleheba.com",
    "venmo_handle": "@styleheba",
    "payment_note": "입금 시 주문번호를 메모에 적어주세요"
  }'::jsonb),
  ('new_customer_discount', '{
    "enabled": true,
    "min_order": 100,
    "discount_percent": 5,
    "description": "첫 주문 $100 이상 5% 할인"
  }'::jsonb);

-- ============================================================
-- 11. Newsletter Subscribers
-- ============================================================

CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'popup',            -- popup, checkout, admin
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_active ON subscribers(is_active) WHERE is_active = TRUE;

-- ============================================================
-- 12. Magic Links (이메일 인증 기반 마이페이지)
-- ============================================================

CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);

-- ============================================================
-- 13. Functions & Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_group_buys_updated
  BEFORE UPDATE ON group_buys FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_items_updated
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
  date_str TEXT;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO today_count
  FROM orders
  WHERE order_number LIKE 'SH-' || date_str || '-%';
  
  NEW.order_number := 'SH-' || date_str || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON orders FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- Update product sold_count on order item insert
CREATE OR REPLACE FUNCTION update_product_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET sold_count = sold_count + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_sold_count
  AFTER INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION update_product_sold_count();

-- Update customer stats on order completion
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE profiles
    SET 
      total_spent = total_spent + NEW.total,
      order_count = order_count + 1
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_stats
  AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 14. Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = $1 AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users see own, admins see all
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (is_admin(auth.uid()));

-- Products: public read, admin write
CREATE POLICY products_public_read ON products FOR SELECT USING (status = 'active');
CREATE POLICY products_admin_all ON products FOR ALL USING (is_admin(auth.uid()));

-- Group Buys: public read active, admin write
CREATE POLICY group_buys_public_read ON group_buys FOR SELECT USING (status IN ('upcoming', 'active'));
CREATE POLICY group_buys_admin_all ON group_buys FOR ALL USING (is_admin(auth.uid()));

-- Orders: users see own, admins see all
CREATE POLICY orders_select_own ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY orders_admin_all ON orders FOR ALL USING (is_admin(auth.uid()));

-- Order Items: users see own order items, admins see all
CREATE POLICY order_items_select_own ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
CREATE POLICY order_items_insert ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
CREATE POLICY order_items_admin_all ON order_items FOR ALL USING (is_admin(auth.uid()));

-- Cart: users manage own
CREATE POLICY cart_own ON cart_items FOR ALL USING (user_id = auth.uid());

-- Site Settings: public read, admin write
CREATE POLICY settings_public_read ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY settings_admin_write ON site_settings FOR ALL USING (is_admin(auth.uid()));

-- Subscribers: admin only (except insert via anon for signup)
CREATE POLICY subscribers_anon_insert ON subscribers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY subscribers_admin_all ON subscribers FOR ALL USING (is_admin(auth.uid()));

-- Email Logs: admin only
CREATE POLICY email_logs_admin ON email_logs FOR ALL USING (is_admin(auth.uid()));

-- Admin Users: admin only
CREATE POLICY admin_users_admin ON admin_users FOR ALL USING (is_admin(auth.uid()));

-- Magic Links: service role only (handled via API routes)
CREATE POLICY magic_links_service ON magic_links FOR ALL USING (FALSE);

-- ============================================================
-- 15. Storage Buckets
-- ============================================================
-- Run these in Supabase Dashboard > Storage or via API:
-- 
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('products', 'products', true),
--   ('site', 'site', true);
--
-- Storage policies:
-- products bucket: public read, admin write
-- site bucket: public read, admin write
