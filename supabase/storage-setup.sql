-- Create storage buckets for course media
INSERT INTO storage.buckets (id, name, public) VALUES
  ('lesson-videos', 'lesson-videos', false),
  ('lesson-files', 'lesson-files', false);

-- Set up RLS policies for storage buckets

-- Lesson videos: only enrolled users can access
CREATE POLICY "Enrolled users can view lesson videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lesson-videos' AND
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.video_url = (bucket_id || '/' || name) AND
      EXISTS (
        SELECT 1 FROM sections 
        WHERE sections.id = lessons.section_id AND
        EXISTS (
          SELECT 1 FROM courses 
          WHERE courses.id = sections.course_id AND
          EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = courses.id 
            AND enrollments.profile_id = auth.uid()
          )
        )
      )
    )
  );

-- Lesson files: only enrolled users can access
CREATE POLICY "Enrolled users can view lesson files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lesson-files' AND
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.video_url = (bucket_id || '/' || name) AND
      EXISTS (
        SELECT 1 FROM sections 
        WHERE sections.id = lessons.section_id AND
        EXISTS (
          SELECT 1 FROM courses 
          WHERE courses.id = sections.course_id AND
          EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = courses.id 
            AND enrollments.profile_id = auth.uid()
          )
        )
      )
    )
  );

-- Only course admins can upload media
CREATE POLICY "Course admins can upload lesson media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('lesson-videos', 'lesson-files') AND
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Course admins can update lesson media" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('lesson-videos', 'lesson-files') AND
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Course admins can delete lesson media" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('lesson-videos', 'lesson-files') AND
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.profile_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );