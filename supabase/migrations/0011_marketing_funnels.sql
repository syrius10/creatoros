-- Create funnels table
CREATE TABLE IF NOT EXISTS funnels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create funnel_steps table
CREATE TABLE IF NOT EXISTS funnel_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lead_capture', 'email', 'wait', 'condition')),
  name TEXT NOT NULL,
  description TEXT,
  config JSONB, -- Stores step-specific configuration
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create funnel_leads table to track leads through funnels
CREATE TABLE IF NOT EXISTS funnel_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES funnel_steps(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(funnel_id, contact_id)
);

-- Create funnel_lead_activities table to track lead progression
CREATE TABLE IF NOT EXISTS funnel_lead_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_lead_id UUID NOT NULL REFERENCES funnel_leads(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('entered', 'exited', 'completed', 'skipped')),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Additional data about the activity
);

-- Enable RLS
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funnels
CREATE POLICY "Users can manage org funnels" ON funnels
  FOR ALL USING (org_id IN (
    SELECT get_orgs_for_authenticated_user()
  ));

-- RLS Policies for funnel_steps
CREATE POLICY "Users can manage org funnel steps" ON funnel_steps
  FOR ALL USING (funnel_id IN (
    SELECT id FROM funnels WHERE org_id IN (
      SELECT get_orgs_for_authenticated_user()
    )
  ));

-- RLS Policies for funnel_leads
CREATE POLICY "Users can view org funnel leads" ON funnel_leads
  FOR SELECT USING (funnel_id IN (
    SELECT id FROM funnels WHERE org_id IN (
      SELECT get_orgs_for_authenticated_user()
    )
  ));

-- RLS Policies for funnel_lead_activities
CREATE POLICY "Users can view org funnel lead activities" ON funnel_lead_activities
  FOR SELECT USING (funnel_lead_id IN (
    SELECT id FROM funnel_leads WHERE funnel_id IN (
      SELECT id FROM funnels WHERE org_id IN (
        SELECT get_orgs_for_authenticated_user()
      )
    )
  ));

-- Add updated_at triggers
CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_steps_updated_at BEFORE UPDATE ON funnel_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_leads_updated_at BEFORE UPDATE ON funnel_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();