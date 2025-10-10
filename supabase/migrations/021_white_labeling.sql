-- Create white_label_configs table
CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  accent_color TEXT DEFAULT '#10B981',
  background_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT DEFAULT '#1F2937',
  font_family TEXT DEFAULT 'Inter',
  logo_url TEXT,
  favicon_url TEXT,
  custom_css TEXT,
  custom_js TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'failed')) DEFAULT 'pending',
  ssl_status TEXT CHECK (ssl_status IN ('pending', 'active', 'error')),
  verification_token TEXT NOT NULL,
  dns_records JSONB NOT NULL DEFAULT '[]',
  last_verified_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create branding_assets table
CREATE TABLE IF NOT EXISTS branding_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'background', 'icon')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create theme_presets table for pre-built themes
CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  font_family TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their org's white label config" 
  ON white_label_configs FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's custom domains" 
  ON custom_domains FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's branding assets" 
  ON branding_assets FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Anyone can view public theme presets" 
  ON theme_presets FOR SELECT 
  USING (is_public = TRUE);

CREATE POLICY "Admins can manage theme presets" 
  ON theme_presets FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM org_members 
    WHERE profile_id = auth.uid() AND role = 'admin'
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_white_label_configs_org_id ON white_label_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_org_id ON custom_domains(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);
CREATE INDEX IF NOT EXISTS idx_branding_assets_org_id ON branding_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_theme_presets_public ON theme_presets(is_public, created_at);

-- Add updated_at triggers
CREATE TRIGGER update_white_label_configs_updated_at BEFORE UPDATE ON white_label_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_domains_updated_at BEFORE UPDATE ON custom_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert default theme presets
INSERT INTO theme_presets (name, description, primary_color, secondary_color, accent_color, background_color, text_color, font_family) VALUES
('Ocean Blue', 'Professional blue theme', '#2563EB', '#1D4ED8', '#059669', '#FFFFFF', '#1E293B', 'Inter'),
('Forest Green', 'Natural green theme', '#059669', '#047857', '#DC2626', '#F8FAFC', '#1E293B', 'Inter'),
('Sunset Orange', 'Warm orange theme', '#EA580C', '#C2410C', '#7C3AED', '#FFFFFF', '#292524', 'Inter'),
('Midnight Dark', 'Dark mode theme', '#6366F1', '#4F46E5', '#10B981', '#0F172A', '#F1F5F9', 'Inter'),
('Corporate Gray', 'Professional gray theme', '#475569', '#334155', '#DC2626', '#FFFFFF', '#1E293B', 'Inter');