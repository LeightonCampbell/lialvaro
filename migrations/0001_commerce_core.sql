-- Stage 5 commerce core (D1 / SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  markup_bps INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'apparel',
  provider TEXT,
  provider_product_id TEXT,
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  provider_variant_id TEXT,
  lane TEXT NOT NULL DEFAULT 'pod',
  vendor_cost_cents INTEGER NOT NULL DEFAULT 0,
  retail_price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(product_id, size, color)
);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  store_id TEXT REFERENCES stores(id),
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  design_id TEXT,
  UNIQUE(cart_id, variant_id, design_id)
);

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  status TEXT NOT NULL DEFAULT 'draft',
  r2_key TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  store_id TEXT REFERENCES stores(id),
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  currency TEXT NOT NULL DEFAULT 'usd',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  shipping_json TEXT,
  same_day_requested INTEGER NOT NULL DEFAULT 0,
  tracking_code TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  lane TEXT NOT NULL,
  provider TEXT,
  provider_order_id TEXT,
  provider_item_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  design_id TEXT REFERENCES designs(id),
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_id TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(source, event_id)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_lane ON order_items(lane);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
