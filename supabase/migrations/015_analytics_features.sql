-- Create analytics_events table to track user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'course_view', 'course_enrollment', 'course_completion',
    'checkout_initiated', 'purchase_completed', 'forum_view', 'thread_created',
    'comment_created', 'reaction_added'
  )),
  entity_type TEXT, -- e.g., 'course', 'forum', 'page'
  entity_id UUID, -- ID of the related entity
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB, -- Additional event data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table for saved reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('custom', 'standard')),
  config JSONB NOT NULL, -- Report configuration (filters, date ranges, metrics)
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_configs table for customizable dashboards
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- Dashboard layout and widget configuration
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id, name)
);

-- Add updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Analytics events policies
CREATE POLICY "Users can view their org's analytics events" 
  ON analytics_events FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Server can insert analytics events" 
  ON analytics_events FOR INSERT 
  WITH CHECK (true); -- This will be used by server-side functions

-- Reports policies
CREATE POLICY "Users can manage their org's reports" 
  ON reports FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

-- Dashboard configs policies
CREATE POLICY "Users can manage their dashboard configs" 
  ON dashboard_configs FOR ALL 
  USING (
    user_id = auth.uid() AND 
    org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_id ON analytics_events(org_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON reports(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_user_id ON dashboard_configs(user_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_date ON analytics_events(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_type_date ON analytics_events(org_id, event_type, created_at);

-- Add updated_at triggers
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at BEFORE UPDATE ON dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert analytics exports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('analytics-exports', 'analytics-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for analytics exports
CREATE POLICY "Users can access their org's analytics exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'analytics-exports' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Users can create analytics exports for their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'analytics-exports' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE profile_id = auth.uid()
  )
);