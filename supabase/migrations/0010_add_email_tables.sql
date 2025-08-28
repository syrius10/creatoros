-- Create the function to get orgs for the authenticated user
CREATE OR REPLACE FUNCTION get_orgs_for_authenticated_user()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id
  FROM org_members
  WHERE profile_id = auth.uid()
$$;

-- Email lists
CREATE TABLE IF NOT EXISTS email_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE email_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org email lists" ON email_lists
  FOR ALL USING (org_id IN (
    SELECT get_orgs_for_authenticated_user()
  ));

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscribed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, email)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org contacts" ON contacts
  FOR ALL USING (org_id IN (
    SELECT get_orgs_for_authenticated_user()
  ));

-- List contacts junction
CREATE TABLE IF NOT EXISTS list_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES email_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, contact_id)
);

ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage list contacts" ON list_contacts
  USING (list_id IN (
    SELECT id FROM email_lists WHERE org_id IN (
      SELECT get_orgs_for_authenticated_user()
    )
  ));

-- Broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org broadcasts" ON broadcasts
  FOR ALL USING (org_id IN (
    SELECT get_orgs_for_authenticated_user()
  ));

-- Broadcast lists junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS broadcast_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES email_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, list_id)
);

ALTER TABLE broadcast_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage broadcast lists" ON broadcast_lists
  USING (broadcast_id IN (
    SELECT id FROM broadcasts WHERE org_id IN (
      SELECT get_orgs_for_authenticated_user()
    )
  ));

-- Broadcast metrics
CREATE TABLE IF NOT EXISTS broadcast_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  delivered BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  unsubscribed BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE broadcast_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view broadcast metrics" ON broadcast_metrics
  USING (broadcast_id IN (
    SELECT id FROM broadcasts WHERE org_id IN (
      SELECT get_orgs_for_authenticated_user()
    )
  ));

-- Add updated_at triggers
CREATE TRIGGER update_email_lists_updated_at BEFORE UPDATE ON email_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broadcasts_updated_at BEFORE UPDATE ON broadcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();