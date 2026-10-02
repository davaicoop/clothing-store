CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL DEFAULT 'Shop owner',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id),
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES categories(id),
  audience text NOT NULL DEFAULT 'Unisex' CHECK (audience IN ('Men','Women','Unisex')),
  price numeric(12,2) NOT NULL CHECK (price > 0),
  cost_price numeric(12,2) CHECK (cost_price >= 0),
  images jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  size text NOT NULL,
  color text NOT NULL,
  sku text UNIQUE NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (product_id, size, color)
);
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total numeric(12,2) NOT NULL CHECK (total = subtotal + delivery_fee),
  currency text NOT NULL DEFAULT 'KES',
  payment_method text NOT NULL CHECK (payment_method IN ('M-Pesa','Cash on Delivery','Pay on Pickup')),
  payment_status text NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Paid','Refunded')),
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New','Confirmed','Preparing','Ready','Out for Delivery','Delivered','Cancelled')),
  fulfilment text NOT NULL CHECK (fulfilment IN ('Delivery','Pickup')),
  town text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  request_key uuid UNIQUE NOT NULL,
  request_hash text NOT NULL,
  lookup_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  product_id uuid NOT NULL REFERENCES products(id),
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  product_name text NOT NULL,
  category_name text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  sku text NOT NULL,
  image text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0)
);
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  method text NOT NULL,
  status text NOT NULL CHECK (status IN ('Pending','Paid','Refunded')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  reference text,
  note text NOT NULL DEFAULT '',
  recorded_by uuid REFERENCES admins(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  quantity integer NOT NULL,
  stock_after integer NOT NULL CHECK (stock_after >= 0),
  reason text NOT NULL,
  order_id uuid REFERENCES orders(id),
  admin_id uuid REFERENCES admins(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  type text NOT NULL,
  message text NOT NULL,
  admin_id uuid REFERENCES admins(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS business_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  shop_name text NOT NULL DEFAULT 'FORME',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Nairobi, Kenya',
  delivery_fee numeric(12,2) NOT NULL DEFAULT 300 CHECK (delivery_fee >= 0),
  currency text NOT NULL DEFAULT 'KES',
  currency_symbol text NOT NULL DEFAULT 'KSh',
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0)
);
INSERT INTO business_settings(id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS variants_product_idx ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS movements_variant_idx ON inventory_movements(variant_id, created_at);
CREATE INDEX IF NOT EXISTS items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS payments_order_idx ON payments(order_id);
CREATE INDEX IF NOT EXISTS events_order_idx ON order_events(order_id);
