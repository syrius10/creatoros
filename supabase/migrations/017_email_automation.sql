-- First, create the email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_triggers table
CREATE TABLE IF NOT EXISTS automation_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'user_signup',
    'course_enrollment', 
    'course_completion',
    'purchase_completed',
    'days_inactive',
    'content_accessed'
  )),
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequences table
CREATE TABLE IF NOT EXISTS sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence_steps table (now email_templates exists)
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email', 'delay', 'condition')),
  delay_days INTEGER,
  email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  conditions JSONB,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sequence_id, step_order)
);

-- Create user_journeys table
CREATE TABLE IF NOT EXISTS user_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  trigger_id UUID NOT NULL REFERENCES automation_triggers(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES sequence_steps(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Create journey_events table
CREATE TABLE IF NOT EXISTS journey_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES user_journeys(id) ON DELETE CASCADE,
  step_id UUID REFERENCES sequence_steps(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('step_started', 'email_sent', 'email_opened', 'email_clicked', 'step_completed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Users can view their org's email templates" 
  ON email_templates FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's email templates" 
  ON email_templates FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

-- RLS Policies for automation_triggers
CREATE POLICY "Users can view their org's automation triggers" 
  ON automation_triggers FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's automation triggers" 
  ON automation_triggers FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

-- RLS Policies for sequences
CREATE POLICY "Users can view their org's sequences" 
  ON sequences FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's sequences" 
  ON sequences FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

-- RLS Policies for sequence_steps (inherit from sequence's org)
CREATE POLICY "Users can view their org's sequence steps" 
  ON sequence_steps FOR SELECT 
  USING (sequence_id IN (
    SELECT id FROM sequences WHERE org_id IN (
      SELECT org_id FROM org_members WHERE profile_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage their org's sequence steps" 
  ON sequence_steps FOR ALL 
  USING (sequence_id IN (
    SELECT id FROM sequences WHERE org_id IN (
      SELECT org_id FROM org_members WHERE profile_id = auth.uid()
    )
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_org_id ON email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_org_id ON automation_triggers(org_id);
CREATE INDEX IF NOT EXISTS idx_sequences_org_id ON sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_sequence_id ON user_journeys(sequence_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_journey_id ON journey_events(journey_id);

-- Add updated_at triggers (assuming the function exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_triggers_updated_at BEFORE UPDATE ON automation_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journeys_updated_at BEFORE UPDATE ON user_journeys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();