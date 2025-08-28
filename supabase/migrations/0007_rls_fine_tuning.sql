-- Additional RLS policies for better security

-- Prevent users from updating other users' profiles
CREATE POLICY "Users can update only own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Prevent users from deleting their own profile (should use auth.users deletion)
CREATE POLICY "Users cannot delete profiles" ON profiles
  FOR DELETE USING (false);

-- More restrictive orders policy
CREATE POLICY "Users can view only their org's orders" ON orders
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE profile_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_profile_id ON org_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON orders(org_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_profile_id ON enrollments(profile_id);