-- Create ai_audit_log table to track AI usage
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT,
  type TEXT CHECK (type IN ('course_outline', 'landing_copy', 'email_sequence')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own org's AI audit logs
CREATE POLICY "Users can view own org's AI audit logs" ON ai_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = ai_audit_log.org_id
      AND org_members.profile_id = auth.uid()
    )
  );

-- Only server can insert (via service role) or users with appropriate permissions
CREATE POLICY "Users can insert AI audit logs" ON ai_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = ai_audit_log.org_id
      AND org_members.profile_id = auth.uid()
    )
  );