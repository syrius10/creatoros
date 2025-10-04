-- Create AI models table for tracking AI configurations
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN (
    'recommendation',
    'summarization',
    'transcription',
    'outline_generation',
    'grading',
    'feedback'
  )),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'huggingface', 'custom')),
  model_name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  cost_per_request DECIMAL(10,6) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content recommendations table
CREATE TABLE IF NOT EXISTS content_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'resource')),
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'similar_content',
    'popular_in_topic',
    'completion_based',
    'collaborative_filtering'
  )),
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  algorithm_version TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id, content_type)
);

-- Create learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goals JSONB NOT NULL DEFAULT '[]',
  estimated_hours INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN DEFAULT TRUE,
  progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning path items table
CREATE TABLE IF NOT EXISTS learning_path_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'quiz', 'resource')),
  item_order INTEGER NOT NULL,
  estimated_duration_minutes INTEGER,
  prerequisites JSONB DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learning_path_id, item_order)
);

-- Create AI-generated content table
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  original_content_id UUID,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'summary',
    'transcription',
    'outline',
    'feedback',
    'grade'
  )),
  input_text TEXT,
  output_text TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_used INTEGER,
  cost DECIMAL(10,6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user learning preferences table
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_learning_style TEXT[] DEFAULT '{}',
  difficulty_preference TEXT CHECK (difficulty_preference IN ('beginner', 'intermediate', 'advanced')),
  topics_of_interest TEXT[] DEFAULT '{}',
  daily_learning_goal_minutes INTEGER DEFAULT 30,
  availability_pattern JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI usage analytics table
CREATE TABLE IF NOT EXISTS ai_usage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  model_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  tokens_used INTEGER,
  cost DECIMAL(10,6),
  duration_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their org's AI models" 
  ON ai_models FOR ALL 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can view their own recommendations" 
  ON content_recommendations FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their learning paths" 
  ON learning_paths FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their org's AI content" 
  ON ai_generated_content FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Users can manage their learning preferences" 
  ON user_learning_preferences FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their org's AI analytics" 
  ON ai_usage_analytics FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_recommendations_user ON content_recommendations(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_content ON content_recommendations(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_path_items_path ON learning_path_items(learning_path_id, item_order);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_org ON ai_generated_content(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_org ON ai_usage_analytics(org_id, created_at);

-- Add updated_at triggers
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_preferences_updated_at BEFORE UPDATE ON user_learning_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();