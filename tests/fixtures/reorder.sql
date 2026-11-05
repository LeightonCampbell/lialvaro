INSERT OR IGNORE INTO vendors (id, slug, name, email) VALUES ('vnd_studio_north', 'studio-north', 'Studio North', 'studio-north@example.com');
INSERT OR IGNORE INTO products (id, slug, name, vendor_id) VALUES ('dsn_coffee_lover', 'coffee-lover-tee', 'Coffee Lover Tee', 'vnd_studio_north');
INSERT OR IGNORE INTO variants (id, product_id, name, size, color, retail_price_cents) VALUES ('var_coffee_s_black', 'dsn_coffee_lover', 'Coffee Lover Tee / S / Black', 'S', 'Black', 2495);
INSERT OR IGNORE INTO orders (id, email, status, total_cents, stripe_session_id, tracking_code) VALUES ('ord_stage9reorder', 'reorder-check@example.com', 'fulfilled', 2495, 'cs_stage9', 'LASTAGE9REORDER');
INSERT OR IGNORE INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price_cents) VALUES ('oit_stage9', 'ord_stage9reorder', 'var_coffee_s_black', 'Coffee Lover Tee', 'Coffee Lover Tee / S / Black', 1, 2495);
UPDATE order_items SET variant_id = 'var_coffee_s_black', product_name = 'Coffee Lover Tee', variant_name = 'Coffee Lover Tee / S / Black', unit_price_cents = 2495 WHERE id = 'oit_stage9';
