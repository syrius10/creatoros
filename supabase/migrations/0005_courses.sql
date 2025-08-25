-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  price_id TEXT REFERENCES prices(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sections table (modules/units within a course)
CREATE TABLE IF NOT EXISTS sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table (individual content pieces)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- text content or HTML
  video_url TEXT, -- reference to Supabase Storage
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table (track course access)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Link to purchase
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, profile_id)
);

-- Create lesson progress table (track individual lesson completion)
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Courses policies: tenant isolation
CREATE POLICY "Org members can view courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = courses.org_id
      AND org_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Org admins and owners can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = courses.org_id
      AND org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Sections policies: inherit from course access
CREATE POLICY "Users can view sections if they can view the course" ON sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = sections.course_id
      AND EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.org_id = courses.org_id
        AND org_members.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage sections if they can manage the course" ON sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = sections.course_id
      AND EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.org_id = courses.org_id
        AND org_members.profile_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
      )
    )
  );

-- Lessons policies: inherit from section access
CREATE POLICY "Users can view lessons if they can view the section" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = lessons.section_id
      AND EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = sections.course_id
        AND EXISTS (
          SELECT 1 FROM org_members
          WHERE org_members.org_id = courses.org_id
          AND org_members.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage lessons if they can manage the section" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = lessons.section_id
      AND EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = sections.course_id
        AND EXISTS (
          SELECT 1 FROM org_members
          WHERE org_members.org_id = courses.org_id
          AND org_members.profile_id = auth.uid()
          AND org_members.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Enrollments policies: users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Enrollments can be created by server" ON enrollments
  FOR INSERT WITH CHECK (true); -- Server will handle enrollment creation

-- Lesson progress policies: users can view and update their own progress
CREATE POLICY "Users can view their own lesson progress" ON lesson_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own lesson progress" ON lesson_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.profile_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();