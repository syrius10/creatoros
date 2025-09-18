-- Create affiliate_programs table
CREATE TABLE IF NOT EXISTS affiliate_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  cookie_duration INTEGER DEFAULT 30, -- Days
  is_active BOOLEAN DEFAULT TRUE,
  terms TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

-- Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL,
  purchase_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create affiliate_payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create affiliate_referrals table to track clicks and conversions
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  landing_page TEXT,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's affiliate programs" 
  ON affiliate_programs FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's affiliate programs" 
  ON affiliate_programs FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Affiliates can view their own data" 
  ON affiliates FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Program managers can view affiliates" 
  ON affiliates FOR SELECT 
  USING (program_id IN (
    SELECT id FROM affiliate_programs WHERE org_id IN (
      SELECT org_id FROM org_members WHERE profile_id = auth.uid()
    )
  ));

CREATE POLICY "Affiliates can view their own commissions" 
  ON affiliate_commissions FOR SELECT 
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Program managers can view all commissions" 
  ON affiliate_commissions FOR SELECT 
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE program_id IN (
      SELECT id FROM affiliate_programs WHERE org_id IN (
        SELECT org_id FROM org_members WHERE profile_id = auth.uid()
      )
    )
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_org_id ON affiliate_programs(org_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_program_id ON affiliates(program_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON affiliate_referrals(code);

-- Add updated_at triggers
CREATE TRIGGER update_affiliate_programs_updated_at BEFORE UPDATE ON affiliate_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();