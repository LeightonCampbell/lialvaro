-- Stage 8: broker quotes. Request stays in the modal; the owner builds the quote here.

ALTER TABLE quotes ADD COLUMN name TEXT;
ALTER TABLE quotes ADD COLUMN phone TEXT;
ALTER TABLE quotes ADD COLUMN public_token TEXT;
ALTER TABLE quotes ADD COLUMN partner_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN markup_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN deposit_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN total_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN stripe_session_id TEXT;
ALTER TABLE quotes ADD COLUMN order_id TEXT;
ALTER TABLE quotes ADD COLUMN tracking_code TEXT;
ALTER TABLE quotes ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_token ON quotes(public_token);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cents INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
