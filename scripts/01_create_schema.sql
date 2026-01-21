-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  allocation JSONB NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('once', 'weekly')),
  monitoring_frequency TEXT NOT NULL,
  ai_explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executing', 'completed', 'failed')),
  tx_hash TEXT,
  -- x402 specific fields
  x402_order_id TEXT,
  x402_enabled BOOLEAN DEFAULT FALSE,
  mev_protection BOOLEAN DEFAULT FALSE,
  cross_chain BOOLEAN DEFAULT FALSE,
  estimated_gas TEXT,
  estimated_time INTEGER,
  gas_used TEXT,
  execution_time INTEGER,
  mev_savings TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  step_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  contract_address TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- x402 Orders table
CREATE TABLE IF NOT EXISTS x402_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  intent TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  source_chain INTEGER NOT NULL,
  target_chain INTEGER NOT NULL,
  source_token TEXT NOT NULL,
  target_token TEXT NOT NULL,
  allocation JSONB NOT NULL,
  routes JSONB NOT NULL,
  execution_type TEXT NOT NULL,
  mev_protection BOOLEAN DEFAULT TRUE,
  cross_chain BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  estimated_gas TEXT,
  estimated_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- x402 Settlements table
CREATE TABLE IF NOT EXISTS x402_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES x402_orders(order_id) ON DELETE CASCADE,
  tx_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used TEXT,
  execution_time INTEGER,
  actual_output TEXT,
  mev_savings TEXT,
  settlement_steps JSONB,
  block_number BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- x402 Routes table
CREATE TABLE IF NOT EXISTS x402_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES x402_orders(order_id) ON DELETE CASCADE,
  route_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  protocol TEXT NOT NULL,
  source_token TEXT NOT NULL,
  target_token TEXT NOT NULL,
  amount TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  price_impact DECIMAL(10, 6),
  gas_estimate TEXT,
  path JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_strategies_user ON strategies(user_id);
CREATE INDEX idx_strategies_status ON strategies(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_strategy ON transactions(strategy_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_x402_orders_user ON x402_orders(user_id);
CREATE INDEX idx_x402_orders_status ON x402_orders(status);
CREATE INDEX idx_x402_settlements_order ON x402_settlements(order_id);
CREATE INDEX idx_x402_routes_order ON x402_routes(order_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE x402_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE x402_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE x402_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.uid() IS NULL);

-- RLS Policies for strategies
CREATE POLICY "Users can view their own strategies" ON strategies
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own strategies" ON strategies
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own strategies" ON strategies
  FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity" ON activity_logs
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own activity" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- RLS Policies for x402_orders
CREATE POLICY "Users can view their own x402 orders" ON x402_orders
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own x402 orders" ON x402_orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own x402 orders" ON x402_orders
  FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.uid() IS NULL);

-- RLS Policies for x402_settlements
CREATE POLICY "Users can view their own x402 settlements" ON x402_settlements
  FOR SELECT USING (order_id IN (SELECT order_id FROM x402_orders WHERE auth.uid()::text = user_id::text OR auth.uid() IS NULL));

CREATE POLICY "Users can insert x402 settlements" ON x402_settlements
  FOR INSERT WITH CHECK (order_id IN (SELECT order_id FROM x402_orders WHERE auth.uid()::text = user_id::text OR auth.uid() IS NULL));

CREATE POLICY "Users can update x402 settlements" ON x402_settlements
  FOR UPDATE USING (order_id IN (SELECT order_id FROM x402_orders WHERE auth.uid()::text = user_id::text OR auth.uid() IS NULL));

-- RLS Policies for x402_routes
CREATE POLICY "Users can view their own x402 routes" ON x402_routes
  FOR SELECT USING (order_id IN (SELECT order_id FROM x402_orders WHERE auth.uid()::text = user_id::text OR auth.uid() IS NULL));

CREATE POLICY "Users can insert x402 routes" ON x402_routes
  FOR INSERT WITH CHECK (order_id IN (SELECT order_id FROM x402_orders WHERE auth.uid()::text = user_id::text OR auth.uid() IS NULL));
