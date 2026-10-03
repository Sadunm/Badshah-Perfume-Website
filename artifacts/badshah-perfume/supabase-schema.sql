-- ====================================================================
-- BADSHAH PREMIUM PERFUME - OFFICIAL SUPABASE POSTGRESQL SCHEMA
-- Tables: products, orders, custom_requests, site_settings, wholesale_catalog
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. PRODUCTS & SIZES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || uuid_generate_v4()::text),
    name VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    additional_images TEXT[] DEFAULT '{}',
    fragrance_type VARCHAR(255) NOT NULL DEFAULT 'Extrait de Parfum',
    longevity VARCHAR(100) NOT NULL DEFAULT '10-14+ Hours',
    fragrance_notes TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    stock_status VARCHAR(50) NOT NULL DEFAULT 'In Stock' CHECK (stock_status IN ('In Stock', 'Out of Stock')),
    starting_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    wholesale_price_50ml NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_sizes (
    id TEXT PRIMARY KEY DEFAULT ('size-' || uuid_generate_v4()::text),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_label VARCHAR(50) NOT NULL, -- '3 ml', '6 ml', '12 ml', '50 ml'
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_size UNIQUE (product_id, size_label)
);

-- ====================================================================
-- 3. ORDERS & ORDER ITEMS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || uuid_generate_v4()::text),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    delivery_area VARCHAR(150),
    delivery_location VARCHAR(50) NOT NULL CHECK (delivery_location IN ('inside_dhaka', 'outside_dhaka')),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 80 CHECK (delivery_charge >= 0),
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash on Delivery',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    order_type VARCHAR(50) NOT NULL DEFAULT 'RETAIL' CHECK (order_type IN ('RETAIL', 'WHOLESALE')),
    is_wholesale BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT ('item-' || uuid_generate_v4()::text),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT NOT NULL,
    size_label VARCHAR(50) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. CUSTOM PERFUME REQUESTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS custom_requests (
    id TEXT PRIMARY KEY DEFAULT ('req-' || uuid_generate_v4()::text),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    perfume_name VARCHAR(255) NOT NULL,
    volume_ml INT NOT NULL DEFAULT 30 CHECK (volume_ml > 0),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Contacted', 'Fulfilled', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 5. SITE SETTINGS & THEME CMS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Badshah Premium Perfume',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Artisanal Extrait de Parfum & Concentrated Attar',
    logo_url TEXT DEFAULT '',
    brand_logo_url TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    primary_color VARCHAR(50) NOT NULL DEFAULT '#d4af37',
    secondary_color VARCHAR(50) NOT NULL DEFAULT '#b89628',
    background_color VARCHAR(50) NOT NULL DEFAULT '#08080a',
    text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    accent_color VARCHAR(50) NOT NULL DEFAULT '#f59e0b',
    hero_title VARCHAR(255) NOT NULL DEFAULT 'Crafted for Kings & Royalty',
    hero_subtitle TEXT NOT NULL DEFAULT 'Immerse yourself in authentic artisanal perfumes and concentrated attars.',
    hero_cta_text VARCHAR(100) NOT NULL DEFAULT 'Our Popular Collections',
    hero_image_url TEXT DEFAULT '',
    announcement_bar_text TEXT DEFAULT 'Complimentary luxury velvet gift pouch with all qualifying flacon orders · Nationwide Cash on Delivery',
    announcement_bar_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp_number VARCHAR(50) NOT NULL DEFAULT '+8801700000000',
    contact_phone VARCHAR(50) NOT NULL DEFAULT '+880 1700-000000',
    contact_email VARCHAR(100) NOT NULL DEFAULT 'contact@badshahperfume.com',
    store_address TEXT NOT NULL DEFAULT 'Banani, Dhaka - 1213, Bangladesh',
    facebook_url TEXT DEFAULT 'https://facebook.com/badshahperfume',
    instagram_url TEXT DEFAULT 'https://instagram.com/badshahperfume',
    telegram_url TEXT DEFAULT 'https://t.me/badshahperfume',
    delivery_fee_inside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 80,
    delivery_fee_outside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 130,
    footer_copyright_text TEXT DEFAULT '© 2026 Badshah Premium Perfume. All rights reserved.',
    default_bottle_image_url TEXT DEFAULT '',
    homepage_video_url TEXT DEFAULT '',
    homepage_banner_image_url TEXT DEFAULT '',
    auth_background_image_url TEXT DEFAULT '',
    wholesale_notice_bangla TEXT DEFAULT 'পাইকারি অর্ডারের জন্য সর্বনিম্ন ৫০ মিলি ভলিউম প্রয়োজন।',
    wholesale_min_qty INT NOT NULL DEFAULT 5,
    wholesale_discount_percent INT NOT NULL DEFAULT 25,
    customer_service_badge_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    meta_pixel_id VARCHAR(100) DEFAULT '',
    google_analytics_id VARCHAR(100) DEFAULT '',
    tiktok_pixel_id VARCHAR(100) DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure default single row exists
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 6. WHOLESALE CATALOG TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS wholesale_catalog (
    id TEXT PRIMARY KEY DEFAULT ('ws-' || uuid_generate_v4()::text),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    perfume_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Extrait de Parfum',
    volume_ml INT NOT NULL DEFAULT 50,
    wholesale_unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    minimum_order_qty INT NOT NULL DEFAULT 5,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 7. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_product_sizes_prod ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_wholesale_product ON wholesale_catalog(product_id);

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES & REALTIME REPLICATION
-- ====================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_catalog ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public products view" ON products FOR SELECT USING (is_archived = FALSE);
CREATE POLICY "Public sizes view" ON product_sizes FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public site_settings view" ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Public wholesale view" ON wholesale_catalog FOR SELECT USING (in_stock = TRUE);

-- Public Insert Policies (Checkout & Custom Order)
CREATE POLICY "Public create order" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public create order_items" ON order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public create custom request" ON custom_requests FOR INSERT WITH CHECK (TRUE);

-- Authenticated Admin Policies (Full Access)
CREATE POLICY "Admin products full" ON products FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin sizes full" ON product_sizes FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin orders full" ON orders FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin order_items full" ON order_items FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin custom_requests full" ON custom_requests FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin site_settings full" ON site_settings FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin wholesale full" ON wholesale_catalog FOR ALL TO authenticated USING (TRUE);

-- Enable Realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE wholesale_catalog;
