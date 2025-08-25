-- Create products table (mirrors Stripe product)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, -- Stripe product ID
  active BOOLEAN DEFAULT TRUE,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prices table (mirrors Stripe price)
CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY, -- Stripe price ID
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  currency TEXT NOT NULL,
  type TEXT NOT NULL, -- 'one_time' or 'recurring'
  unit_amount BIGINT, -- in cents
  interval TEXT, -- for recurring: 'day', 'week', 'month', 'year'
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table (to track purchases)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  price_id TEXT REFERENCES prices(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  amount_total BIGINT, -- in cents
  currency TEXT,
  customer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products and prices are readable by everyone (for pricing page)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Prices are viewable by everyone" ON prices
  FOR SELECT USING (true);

-- Orders are tenant isolated
CREATE POLICY "Org members can view orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = orders.org_id
      AND org_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Orders can be inserted by server" ON orders
  FOR INSERT WITH CHECK (true); -- This will be inserted by server using service role

CREATE POLICY "Orders can be updated by server" ON orders
  FOR UPDATE USING (true); -- This will be updated by server using service role

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();