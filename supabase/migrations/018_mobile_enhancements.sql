-- Create offline_access table for tracking downloaded content
CREATE TABLE IF NOT EXISTS offline_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'video', 'document')),
  content_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER, -- Size in bytes
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for cached content
  UNIQUE(user_id, content_type, content_id)
);

-- Create push_subscriptions table for mobile notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  course_updates BOOLEAN DEFAULT TRUE,
  new_messages BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create background_sync_queue for offline actions
CREATE TABLE IF NOT EXISTS background_sync_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'course_progress',
    'quiz_submission',
    'message_sent',
    'content_access'
  )),
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE offline_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their offline content" 
  ON offline_access FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their push subscriptions" 
  ON push_subscriptions FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their notification preferences" 
  ON notification_preferences FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their sync queue items" 
  ON background_sync_queue FOR ALL 
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offline_access_user_id ON offline_access(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_access_content ON offline_access(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_token ON push_subscriptions(token);
CREATE INDEX IF NOT EXISTS idx_background_sync_queue_status ON background_sync_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_background_sync_queue_user ON background_sync_queue(user_id, status);

-- Add updated_at triggers
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();