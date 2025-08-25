-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- Create blocks table (stores JSON content for each page)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'heading', 'paragraph', 'image', 'video'
  content JSONB NOT NULL, -- stores the block content as JSON
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Sites policies: tenant isolation
CREATE POLICY "Org members can view sites" ON sites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = sites.org_id
      AND org_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Org admins and owners can manage sites" ON sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = sites.org_id
      AND org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Pages policies: inherit from site access
CREATE POLICY "Users can view pages if they can view the site" ON pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = pages.site_id
      AND EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.org_id = sites.org_id
        AND org_members.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage pages if they can manage the site" ON pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = pages.site_id
      AND EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.org_id = sites.org_id
        AND org_members.profile_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
      )
    )
  );

-- Blocks policies: inherit from page access
CREATE POLICY "Users can view blocks if they can view the page" ON blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = blocks.page_id
      AND EXISTS (
        SELECT 1 FROM sites
        WHERE sites.id = pages.site_id
        AND EXISTS (
          SELECT 1 FROM org_members
          WHERE org_members.org_id = sites.org_id
          AND org_members.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage blocks if they can manage the page" ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = blocks.page_id
      AND EXISTS (
        SELECT 1 FROM sites
        WHERE sites.id = pages.site_id
        AND EXISTS (
          SELECT 1 FROM org_members
          WHERE org_members.org_id = sites.org_id
          AND org_members.profile_id = auth.uid()
          AND org_members.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();