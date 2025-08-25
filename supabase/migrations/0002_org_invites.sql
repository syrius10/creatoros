-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Invites policies: only org members can view invites for their org
CREATE POLICY "Org members can view invites" ON invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = invites.org_id
      AND org_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can create invites" ON invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = invites.org_id
      AND org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can update invites" ON invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = invites.org_id
      AND org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can delete invites" ON invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = invites.org_id
      AND org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Add updated_at trigger for invites
CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();