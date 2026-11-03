INSERT OR IGNORE INTO vendors (id, slug, name, email) VALUES ('vnd_studio_north', 'studio-north', 'Studio North', 'studio-north@example.com');
INSERT OR IGNORE INTO products (id, slug, name, vendor_id) VALUES ('dsn_la_sunrise', 'la-sunrise-tee', 'LA Sunrise Tee', 'vnd_studio_north');
INSERT OR IGNORE INTO variants (id, product_id, name, size, color, retail_price_cents) VALUES ('var_sunrise_s_white', 'dsn_la_sunrise', 'LA Sunrise Tee / S / White', 'S', 'White', 2499);
INSERT OR IGNORE INTO orders (id, email, status, total_cents, stripe_session_id, tracking_code) VALUES ('ord_stage9reorder', 'reorder-check@example.com', 'fulfilled', 2499, 'cs_stage9', 'LASTAGE9REORDER');
INSERT OR IGNORE INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price_cents) VALUES ('oit_stage9', 'ord_stage9reorder', 'var_sunrise_s_white', 'LA Sunrise Tee', 'LA Sunrise Tee / S / White', 1, 2499);
UPDATE order_items SET variant_id = 'var_sunrise_s_white', product_name = 'LA Sunrise Tee', variant_name = 'LA Sunrise Tee / S / White', unit_price_cents = 2499 WHERE id = 'oit_stage9';
