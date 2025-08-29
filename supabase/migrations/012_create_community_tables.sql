-- Create forums table
CREATE TABLE IF NOT EXISTS forums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on forums
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;

-- Forums policies
CREATE POLICY "Forums are viewable by org members" 
  ON forums FOR SELECT 
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Only admins can create forums" 
  ON forums FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = forums.org_id 
      AND profile_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only admins can update forums" 
  ON forums FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = forums.org_id 
      AND profile_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only admins can delete forums" 
  ON forums FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = forums.org_id 
      AND profile_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on threads
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Threads policies
CREATE POLICY "Threads are viewable by org members" 
  ON threads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM forums f
      JOIN org_members om ON f.org_id = om.org_id
      WHERE f.id = threads.forum_id 
      AND om.profile_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create threads" 
  ON threads FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forums f
      JOIN org_members om ON f.org_id = om.org_id
      WHERE f.id = threads.forum_id 
      AND om.profile_id = auth.uid()
      AND f.is_private = FALSE
    ) AND profile_id = auth.uid()
  );

CREATE POLICY "Thread authors can update their threads" 
  ON threads FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Thread authors and admins can delete threads" 
  ON threads FOR DELETE 
  USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM forums f
      JOIN org_members om ON f.org_id = om.org_id
      WHERE f.id = threads.forum_id 
      AND om.profile_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by org members" 
  ON comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN forums f ON t.forum_id = f.id
      JOIN org_members om ON f.org_id = om.org_id
      WHERE t.id = comments.thread_id 
      AND om.profile_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create comments" 
  ON comments FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN forums f ON t.forum_id = f.id
      JOIN org_members om ON f.org_id = om.org_id
      WHERE t.id = comments.thread_id 
      AND om.profile_id = auth.uid()
    ) AND profile_id = auth.uid()
  );

CREATE POLICY "Comment authors can update their comments" 
  ON comments FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Comment authors and admins can delete comments" 
  ON comments FOR DELETE 
  USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM threads t
      JOIN forums f ON t.forum_id = f.id
      JOIN org_members om ON f.org_id = om.org_id
      WHERE t.id = comments.thread_id 
      AND om.profile_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'laugh', 'insightful', 'curious')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, thread_id, comment_id)
);

-- Enable RLS on reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Reactions are viewable by org members" 
  ON reactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.profile_id = auth.uid()
      AND (
        (thread_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM threads t
          JOIN forums f ON t.forum_id = f.id
          WHERE t.id = reactions.thread_id AND f.org_id = om.org_id
        ))
        OR
        (comment_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM comments c
          JOIN threads t ON c.thread_id = t.id
          JOIN forums f ON t.forum_id = f.id
          WHERE c.id = reactions.comment_id AND f.org_id = om.org_id
        ))
      )
    )
  );

CREATE POLICY "Users can create their own reactions" 
  ON reactions FOR INSERT 
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own reactions" 
  ON reactions FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own reactions" 
  ON reactions FOR DELETE 
  USING (profile_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forums_org_id ON forums(org_id);
CREATE INDEX IF NOT EXISTS idx_threads_forum_id ON threads(forum_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_reactions_thread_id ON reactions(thread_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_profile_id ON reactions(profile_id);

-- Add updated_at triggers
CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON forums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();